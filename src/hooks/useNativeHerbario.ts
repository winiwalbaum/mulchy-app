import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NativePlantSaveData {
  common_name?: string | null;
  common_name_en?: string | null;
  scientific_name?: string;
  category?: string;
  image_url?: string | null;
}

/**
 * Gestiona la colección personal de plantas nativas del usuario.
 * Usa la tabla user_native_plants (native_plant_id = taxon_id como texto).
 * Guarda los datos de la planta directamente en la tabla para evitar joins.
 */
export const useNativeHerbario = () => {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("user_native_plants")
      .select("native_plant_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setSavedIds(new Set((data ?? []).map((r: any) => r.native_plant_id as string)));
        setLoading(false);
      });
  }, [user?.id]);

  const toggle = useCallback(
    async (nativePlantId: string, plantData?: NativePlantSaveData) => {
      if (!user) return;
      if (savedIds.has(nativePlantId)) {
        setSavedIds((prev) => { const next = new Set(prev); next.delete(nativePlantId); return next; });
        await supabase
          .from("user_native_plants")
          .delete()
          .eq("user_id", user.id)
          .eq("native_plant_id", nativePlantId);
      } else {
        setSavedIds((prev) => new Set([...prev, nativePlantId]));
        await supabase
          .from("user_native_plants")
          .insert({
            native_plant_id: nativePlantId,
            user_id: user.id,
            common_name: plantData?.common_name ?? null,
            common_name_en: plantData?.common_name_en ?? null,
            scientific_name: plantData?.scientific_name ?? "",
            category: plantData?.category ?? "",
            image_url: plantData?.image_url ?? null,
          });
      }
    },
    [user?.id, savedIds]
  );

  return { savedIds, count: savedIds.size, loading, toggle };
};
