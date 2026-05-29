import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Gestiona la colección personal de plantas nativas del usuario.
 * Usa la tabla user_native_plants (native_plant_id, user_id).
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
    async (nativePlantId: string) => {
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
          .insert({ native_plant_id: nativePlantId, user_id: user.id });
      }
    },
    [user?.id, savedIds]
  );

  return { savedIds, count: savedIds.size, loading, toggle };
};
