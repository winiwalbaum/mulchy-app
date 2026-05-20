import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { gardenTasks } from "@/data/gardenTasks";

export interface FeedData {
  latestVariety: any | null;
  popularPhoto: any | null;
  popularRecipe: any | null;
  seasonTask: any | null;
  nativePlant: any | null;
  myPhoto: string | null; // latest personal photo (journal or variety)
}

/** Fetch up to 30 recent posts of a given type, ranked by likes */
async function fetchPopularPost(type: string): Promise<any | null> {
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id, title, image_url, display_name, created_at")
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!posts || posts.length === 0) return null;

  const postIds = posts.map((p: any) => p.id);
  const { data: likes } = await supabase
    .from("community_likes")
    .select("post_id")
    .in("post_id", postIds);

  const likesMap: Record<string, number> = {};
  (likes || []).forEach((l: any) => {
    likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1;
  });

  return posts
    .map((p: any) => ({ ...p, likes_count: likesMap[p.id] || 0 }))
    .sort(
      (a: any, b: any) =>
        b.likes_count - a.likes_count ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0] ?? null;
}

/** Obtiene una planta nativa aleatoria con imagen.
 *  Si hay lat/lng invoca la edge function directamente (maneja su propio caché).
 *  Fallback: consulta native_plants_cache en caso de error o sin ubicación. */
async function fetchNativePlant(lat?: number | null, lng?: number | null): Promise<any | null> {
  let pool: any[] = [];

  // Camino principal: edge function (rápida si ya hay caché de 30 días)
  if (lat && lng) {
    try {
      const { data } = await supabase.functions.invoke("fetch-native-plants", {
        body: { lat, lng },
      });
      if (data?.success && Array.isArray(data.data)) {
        pool = data.data.filter((p: any) => p.image_url);
      }
    } catch {
      // si falla la edge function, cae al fallback
    }
  }

  // Fallback: tabla nativa directa (cualquier región, por si no hay ubicación)
  if (pool.length === 0) {
    const { data } = await supabase
      .from("native_plants_cache")
      .select("taxon_id, common_name, common_name_en, scientific_name, category, image_url")
      .not("image_url", "is", null)
      .limit(200);
    pool = data || [];
  }

  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const useFeed = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [data, setData] = useState<FeedData>({
    latestVariety: null,
    popularPhoto: null,
    popularRecipe: null,
    seasonTask: null,
    nativePlant: null,
    myPhoto: null,
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

      const [varietyRes, photoRes, recipeRes, journalPhotoRes, varietyPhotoRes] =
        await Promise.allSettled([
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
          // Mi foto más reciente del diario
          supabase
            .from("journal_entries")
            .select("image_url")
            .eq("user_id", user.id)
            .not("image_url", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          // Mi foto más reciente de variedad (fallback)
          supabase
            .from("varieties")
            .select("image_url")
            .eq("created_by", user.id)
            .not("image_url", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      // Best personal photo: journal first, variety as fallback
      const journalPhoto =
        journalPhotoRes.status === "fulfilled"
          ? (journalPhotoRes.value as any).data?.image_url ?? null
          : null;
      const varietyPhoto =
        varietyPhotoRes.status === "fulfilled"
          ? (varietyPhotoRes.value as any).data?.image_url ?? null
          : null;
      const myPhoto = journalPhoto ?? varietyPhoto;

      // Native plant (with auto-populate fallback)
      const nativePlant = await fetchNativePlant(profile?.latitude, profile?.longitude);

      setData({
        latestVariety:
          varietyRes.status === "fulfilled" ? (varietyRes.value as any).data : null,
        popularPhoto: photoRes.status === "fulfilled" ? photoRes.value : null,
        popularRecipe: recipeRes.status === "fulfilled" ? recipeRes.value : null,
        seasonTask,
        nativePlant,
        myPhoto,
      });
      setLoading(false);
    };

    fetchFeed();
    // Re-run when profile location becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.latitude, profile?.longitude]);

  return { ...data, loading };
};
