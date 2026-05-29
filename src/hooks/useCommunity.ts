import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { compressImage } from "@/lib/imageUtils";

export type PostType = "question" | "exchange" | "photo" | "recipe";

export interface CommunityPost {
  id: string;
  user_id: string;
  display_name: string;
  type: PostType;
  title: string;
  body: string;
  image_url: string | null;
  category: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
}

type GeoFilter = "all" | "city" | "nearby";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const useCommunity = (typeFilter: PostType | "all", geoFilter: GeoFilter = "all", radiusKm = 50) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase.from("community_posts").select("*").order("created_at", { ascending: false });

    if (typeFilter !== "all") {
      query = query.eq("type", typeFilter);
    }

    if (geoFilter === "city" && profile?.city) {
      query = query.eq("city", profile.city);
    }

    const { data: postsData, error } = await query;
    if (error || !postsData) {
      setLoading(false);
      return;
    }

    // Get likes and comments counts
    const postIds = postsData.map((p: any) => p.id);

    const [likesRes, commentsRes, userLikesRes] = await Promise.all([
      supabase.from("community_likes").select("post_id").in("post_id", postIds),
      supabase.from("community_comments").select("post_id").in("post_id", postIds),
      supabase.from("community_likes").select("post_id").in("post_id", postIds).eq("user_id", user.id),
    ]);

    const likesMap: Record<string, number> = {};
    const commentsMap: Record<string, number> = {};
    const userLikedSet = new Set<string>();

    (likesRes.data || []).forEach((l: any) => {
      likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1;
    });
    (commentsRes.data || []).forEach((c: any) => {
      commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
    });
    (userLikesRes.data || []).forEach((l: any) => userLikedSet.add(l.post_id));

    let enriched: CommunityPost[] = postsData.map((p: any) => ({
      ...p,
      likes_count: likesMap[p.id] || 0,
      comments_count: commentsMap[p.id] || 0,
      user_liked: userLikedSet.has(p.id),
    }));

    // Client-side nearby filter
    if (geoFilter === "nearby" && profile?.latitude && profile?.longitude) {
      enriched = enriched.filter(
        (p) =>
          p.latitude != null &&
          p.longitude != null &&
          haversineKm(profile.latitude!, profile.longitude!, p.latitude!, p.longitude!) <= radiusKm
      );
    }

    setPosts(enriched);
    setLoading(false);
  }, [user, typeFilter, geoFilter, profile?.city, profile?.latitude, profile?.longitude, radiusKm]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("community-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => {
        fetchPosts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.82 });
    const path = `${user.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("community-images").upload(path, compressed, { contentType: "image/jpeg" });
    if (error) return null;
    const { data } = supabase.storage.from("community-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const createPost = async (post: { type: PostType; title: string; body: string; image_url?: string; category?: string }) => {
    if (!user) return;
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      display_name: profile?.display_name || user.email || "Anónimo",
      type: post.type,
      title: post.title,
      body: post.body,
      image_url: post.image_url || null,
      category: post.category || null,
      city: profile?.city || null,
      latitude: profile?.latitude || null,
      longitude: profile?.longitude || null,
    });
    if (!error) fetchPosts();
    return error;
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", postId).eq("user_id", user.id);
    if (!error) fetchPosts();
    return error;
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.user_liked) {
      await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("community_likes").insert({ post_id: postId, user_id: user.id });
    }
    fetchPosts();
  };

  return { posts, loading, createPost, deletePost, toggleLike, uploadImage, refetch: fetchPosts };
};

export const useComments = (postId: string | null) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    const { data } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments((data as CommunityComment[]) || []);
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const addComment = async (body: string) => {
    if (!user || !profile || !postId) return;
    await supabase.from("community_comments").insert({
      post_id: postId,
      user_id: user.id,
      display_name: profile.display_name || "Anónimo",
      body,
    });
    fetchComments();
  };

  return { comments, loading, addComment };
};
