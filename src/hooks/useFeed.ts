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

      const results = await Promise.allSettled([
        // Última variedad registrada
        supabase
          .from("varieties")
          .select("id, name, plant_scientific_name, image_url, description, created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Foto más reciente de comunidad
        supabase
          .from("community_posts")
          .select("id, title, image_url, display_name, created_at")
          .eq("type", "photo")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Receta más reciente de comunidad
        supabase
          .from("community_posts")
          .select("id, title, image_url, display_name, created_at")
          .eq("type", "recipe")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Planta nativa con imagen (top observadas)
        supabase
          .from("native_plants_cache")
          .select("common_name, common_name_en, scientific_name, category, image_url")
          .not("image_url", "is", null)
          .order("observation_count", { ascending: false })
          .limit(10),
      ]);

      const [varietyRes, photoRes, recipeRes, nativeRes] = results;

      let nativePlant = null;
      if (
        nativeRes.status === "fulfilled" &&
        nativeRes.value.data &&
        nativeRes.value.data.length > 0
      ) {
        const plants = nativeRes.value.data;
        nativePlant = plants[Math.floor(Math.random() * plants.length)];
      }

      setData({
        latestVariety:
          varietyRes.status === "fulfilled" ? varietyRes.value.data : null,
        popularPhoto:
          photoRes.status === "fulfilled" ? photoRes.value.data : null,
        popularRecipe:
          recipeRes.status === "fulfilled" ? recipeRes.value.data : null,
        seasonTask,
        nativePlant,
      });
      setLoading(false);
    };

    fetchFeed();
  }, [user?.id]);

  return { ...data, loading };
};
