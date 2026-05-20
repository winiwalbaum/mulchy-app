import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { gardenTasks } from "@/data/gardenTasks";

export interface FeedData {
  latestVariety: any | null;
  popularPhoto: any | null;
  popularRecipe: any | null;
  seasonTask: any | null;
  nativePlant: any | null;
}

/** Fetch up to `limit` recent posts of a given type, then rank by likes count */
async function fetchPopularPost(type: string): Promise<any | null> {
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id, title, image_url, display_name, created_at")
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!posts || posts.length === 0) return null;

  // Fetch likes for all those posts in one query
  const postIds = posts.map((p: any) => p.id);
  const { data: likes } = await supabase
    .from("community_likes")
    .select("post_id")
    .in("post_id", postIds);

  const likesMap: Record<string, number> = {};
  (likes || []).forEach((l: any) => {
    likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1;
  });

  // Sort by likes desc, then by recency as tiebreaker
  const ranked = posts
    .map((p: any) => ({ ...p, likes_count: likesMap[p.id] || 0 }))
    .sort((a: any, b: any) => b.likes_count - a.likes_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return ranked[0] ?? null;
}

export const useFeed = () => {
  const { user } = useAuth();
  const [data, setData] = useState<FeedData>({
    latestVariety: null,
    popularPhoto: null,
    popularRecipe: null,
    seasonTask: null,
    nativePlant: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFeed = async () => {
      setLoading(true);

      // Tarea del mes (datos estáticos)
      const month = new Date().getMonth() + 1;
      const monthTasks = gardenTasks.filter((t) => t.months.includes(month));
      const seasonTask =
        monthTasks.length > 0
          ? monthTasks[Math.floor(Math.random() * Math.min(3, monthTasks.length))]
          : null;

      const [varietyRes, photoRes, recipeRes, nativeRes] = await Promise.allSettled([
        // Última variedad registrada
        supabase
          .from("varieties")
          .select("id, name, plant_scientific_name, image_url, description, created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Foto más popular de comunidad
        fetchPopularPost("photo"),
        // Receta más popular de comunidad
        fetchPopularPost("recipe"),
        // Planta nativa random con imagen
        supabase
          .from("native_plants_cache")
          .select("taxon_id, common_name, common_name_en, scientific_name, category, image_url")
          .not("image_url", "is", null)
          .order("observation_count", { ascending: false })
          .limit(20),
      ]);

      let nativePlant = null;
      if (nativeRes.status === "fulfilled" && nativeRes.value.data && nativeRes.value.data.length > 0) {
        const plants = nativeRes.value.data;
        nativePlant = plants[Math.floor(Math.random() * plants.length)];
      }

      setData({
        latestVariety: varietyRes.status === "fulfilled" ? (varietyRes.value as any).data : null,
        popularPhoto: photoRes.status === "fulfilled" ? photoRes.value : null,
        popularRecipe: recipeRes.status === "fulfilled" ? recipeRes.value : null,
        seasonTask,
        nativePlant,
      });
      setLoading(false);
    };

    fetchFeed();
  }, [user?.id]);

  return { ...data, loading };
};
