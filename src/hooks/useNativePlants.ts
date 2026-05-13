import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface NativePlant {
  id: string;
  region_key: string;
  taxon_id: number;
  common_name: string | null;
  common_name_en: string | null;
  scientific_name: string;
  category: string;
  observation_count: number;
  image_url: string | null;
  inat_url: string | null;
  wikipedia_url: string | null;
  description: string | null;
  description_en: string | null;
  fetched_at: string;
}

const categoryEmoji: Record<string, string> = {
  tree: "🌳",
  shrub: "🌿",
  groundcover: "☘️",
  fern: "🌿",
  vine: "🌱",
  grass: "🌾",
  wildflower: "🌸",
  native_plant: "🍃",
};

const categoryLabels: Record<string, { es: string; en: string }> = {
  tree: { es: "Árboles", en: "Trees" },
  shrub: { es: "Arbustos", en: "Shrubs" },
  groundcover: { es: "Cubresuelos", en: "Ground covers" },
  fern: { es: "Helechos", en: "Ferns" },
  vine: { es: "Trepadoras", en: "Vines" },
  grass: { es: "Gramíneas", en: "Grasses" },
  wildflower: { es: "Flores silvestres", en: "Wildflowers" },
  native_plant: { es: "Plantas nativas", en: "Native plants" },
};

export { categoryEmoji, categoryLabels };

export const useNativePlants = () => {
  const { profile } = useProfile();
  const [plants, setPlants] = useState<NativePlant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.latitude || !profile?.longitude) return;

    const fetchPlants = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "fetch-native-plants",
          {
            body: {
              lat: profile.latitude,
              lng: profile.longitude,
              country: profile.country,
            },
          }
        );

        if (fnError) throw fnError;
        if (data?.success && data.data) {
          setPlants(data.data);
        } else {
          setError(data?.error || "Error fetching native plants");
        }
      } catch (err: any) {
        console.error("Error fetching native plants:", err);
        setError(err.message || "Error fetching native plants");
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
  }, [profile?.latitude, profile?.longitude]);

  const fetchDescription = useCallback(
    async (plant: NativePlant): Promise<{ description: string | null; description_en: string | null }> => {
      // Return cached description if available
      if (plant.description) {
        return { description: plant.description, description_en: plant.description_en };
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "describe-native-plant",
          {
            body: {
              taxon_id: plant.taxon_id,
              scientific_name: plant.scientific_name,
              common_name: plant.common_name,
              wikipedia_url: plant.wikipedia_url,
            },
          }
        );

        if (fnError) throw fnError;

        if (data?.success) {
          // Update local state with the description
          setPlants((prev) =>
            prev.map((p) =>
              p.taxon_id === plant.taxon_id
                ? { ...p, description: data.description, description_en: data.description_en }
                : p
            )
          );
          return { description: data.description, description_en: data.description_en };
        }
      } catch (err) {
        console.error("Error fetching description:", err);
      }
      return { description: null, description_en: null };
    },
    []
  );

  return { plants, loading, error, fetchDescription };
};
