import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageUtils";

export interface Variety {
  id: string;
  plant_scientific_name: string;
  name: string;
  aka: string[] | null;
  description: string | null;
  origin: string | null;
  days_to_harvest: number | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  tags: string[] | null;
  color: string | null;
  shape: string | null;
  size_weight: string | null;
  location: string | null;
  years_cultivated: number | null;
  seed_origin: string | null;
  personal_experience: string | null;
  difficulty: string | null;
  info_score: number;
  info_ratings_count: number;
  created_at: string;
  created_by: string;
  grows_count?: number;
}

export interface UserGrow {
  id: string;
  variety_id: string;
  user_id: string;
  display_name: string | null;
  status: "growing" | "harvested" | "failed" | "planned";
  season: string | null;
  location_city: string | null;
  notes: string | null;
  rating: number | null;
  sow_date: string | null;
  harvest_date: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VarietyRating {
  id: string;
  variety_id: string;
  user_id: string;
  photo_quality: number | null;
  detail_quality: number | null;
  story_quality: number | null;
  created_at: string;
}

export const statusEmoji: Record<string, string> = {
  growing: "🌱",
  harvested: "🌾",
  failed: "🥀",
  planned: "📅",
};

export const statusLabel: Record<string, { es: string; en: string }> = {
  growing: { es: "Cultivando", en: "Growing" },
  harvested: { es: "Cosechado", en: "Harvested" },
  failed: { es: "No prosperó", en: "Didn't make it" },
  planned: { es: "Planeado", en: "Planned" },
};

export const useVarieties = (scientificName: string | null) => {
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!scientificName) { setVarieties([]); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("plant_varieties")
      .select("*, user_variety_grows(count)")
      .eq("plant_scientific_name", scientificName)
      .eq("approved", true)
      .order("info_score", { ascending: false })
      .order("name");
    setVarieties(
      (data || []).map((v: any) => ({
        ...v,
        grows_count: v.user_variety_grows?.[0]?.count ?? 0,
        info_score: v.info_score ?? 0,
        info_ratings_count: v.info_ratings_count ?? 0,
      }))
    );
    setLoading(false);
  }, [scientificName]);

  useEffect(() => { fetch(); }, [fetch]);

  return { varieties, loading, refetch: fetch };
};

export const useVarietyGrows = (varietyId: string | null) => {
  const [grows, setGrows] = useState<UserGrow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!varietyId) { setGrows([]); return; }
    setLoading(true);
    (supabase as any)
      .from("user_variety_grows")
      .select("*")
      .eq("variety_id", varietyId)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: UserGrow[] | null }) => {
        setGrows(data || []);
        setLoading(false);
      });
  }, [varietyId]);

  return { grows, loading };
};

export const useMyGrow = (varietyId: string | null, userId: string | null) => {
  const [myGrow, setMyGrow] = useState<UserGrow | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMyGrow = useCallback(async () => {
    if (!varietyId || !userId) { setMyGrow(null); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("user_variety_grows")
      .select("*")
      .eq("variety_id", varietyId)
      .eq("user_id", userId)
      .maybeSingle();
    setMyGrow(data || null);
    setLoading(false);
  }, [varietyId, userId]);

  useEffect(() => { fetchMyGrow(); }, [fetchMyGrow]);

  return { myGrow, loading, refetch: fetchMyGrow };
};

export const useMyRating = (varietyId: string | null, userId: string | null) => {
  const [myRating, setMyRating] = useState<VarietyRating | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMyRating = useCallback(async () => {
    if (!varietyId || !userId) { setMyRating(null); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("variety_ratings")
      .select("*")
      .eq("variety_id", varietyId)
      .eq("user_id", userId)
      .maybeSingle();
    setMyRating(data || null);
    setLoading(false);
  }, [varietyId, userId]);

  useEffect(() => { fetchMyRating(); }, [fetchMyRating]);

  return { myRating, loading, refetch: fetchMyRating };
};

export const upsertGrow = async (
  grow: Partial<UserGrow> & { variety_id: string; user_id: string }
) => {
  const { data, error } = await (supabase as any)
    .from("user_variety_grows")
    .upsert(
      { ...grow, updated_at: new Date().toISOString() },
      { onConflict: "variety_id,user_id" }
    )
    .select()
    .single();
  return { data, error };
};

export const upsertRating = async (rating: {
  variety_id: string;
  user_id: string;
  photo_quality?: number;
  detail_quality?: number;
  story_quality?: number;
}) => {
  const { data, error } = await (supabase as any)
    .from("variety_ratings")
    .upsert(rating, { onConflict: "variety_id,user_id" })
    .select()
    .single();
  return { data, error };
};

export const uploadVarietyPhoto = async (
  file: File,
  userId: string,
  slot: 1 | 2 | 3
): Promise<string | null> => {
  try {
    const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.82 });
    const path = `${userId}/${Date.now()}-${slot}.jpg`;
    const { data, error } = await supabase.storage
      .from("variety-photos")
      .upload(path, compressed, { contentType: "image/jpeg", upsert: true });
    if (error || !data) return null;
    const { data: urlData } = supabase.storage
      .from("variety-photos")
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch {
    return null;
  }
};

export const updateVariety = async (
  id: string,
  updates: {
    name?: string;
    color?: string;
    shape?: string;
    size_weight?: string;
    difficulty?: string;
    personal_experience?: string;
    seed_origin?: string;
    location?: string;
    years_cultivated?: number;
    image_url?: string;
    image_url_2?: string;
    image_url_3?: string;
    tags?: string[];
    description?: string;
  }
) => {
  const { data, error } = await (supabase as any)
    .from("plant_varieties")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
};

export const insertVariety = async (variety: {
  plant_scientific_name: string;
  name: string;
  description?: string;
  origin?: string;
  days_to_harvest?: number;
  tags?: string[];
  created_by: string;
  color?: string;
  shape?: string;
  size_weight?: string;
  location?: string;
  years_cultivated?: number;
  seed_origin?: string;
  personal_experience?: string;
  difficulty?: string;
  image_url?: string;
  image_url_2?: string;
  image_url_3?: string;
}) => {
  const { data, error } = await (supabase as any)
    .from("plant_varieties")
    .insert(variety)
    .select()
    .single();
  return { data, error };
};
