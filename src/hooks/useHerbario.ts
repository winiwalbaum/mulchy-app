import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Gestiona el Herbario personal del usuario:
 * - savedIds: Set con los variety_id guardados
 * - toggle(id): agrega o quita una variedad del herbario
 * - count: número total de variedades guardadas
 */
export const useHerbario = () => {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchSaved = async () => {
      const { data } = await supabase
        .from("user_variety_grows")
        .select("variety_id")
        .eq("user_id", user.id);

      setSavedIds(new Set((data ?? []).map((r: any) => r.variety_id as string)));
      setLoading(false);
    };

    fetchSaved();
  }, [user?.id]);

  const toggle = useCallback(
    async (varietyId: string) => {
      if (!user) return;

      if (savedIds.has(varietyId)) {
        // Quitar del herbario
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(varietyId);
          return next;
        });
        await supabase
          .from("user_variety_grows")
          .delete()
          .eq("user_id", user.id)
          .eq("variety_id", varietyId);
      } else {
        // Agregar al herbario
        setSavedIds((prev) => new Set([...prev, varietyId]));
        await supabase.from("user_variety_grows").insert({
          variety_id: varietyId,
          user_id: user.id,
          status: "planned",
        });
      }
    },
    [user?.id, savedIds]
  );

  return { savedIds, count: savedIds.size, loading, toggle };
};
