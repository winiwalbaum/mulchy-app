import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { plants } from "@/data/plants";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VarietyCard {
  id: string;
  name: string;
  plant_scientific_name: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  color: string | null;
  shape: string | null;
  size_weight: string | null;
  difficulty: string | null;
  personal_experience: string | null;
  description: string | null;
  tags: string[] | null;
  created_at: string;
}

// ─── Skeleton ────────────────────────────────────────────────
const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="rounded-2xl bg-muted animate-pulse"
    style={{ height: "172px" }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay }}
  />
);

// ─── VariedadesPage ───────────────────────────────────────────
const VariedadesPage = () => {
  const { lang } = useLanguage();
  const [varieties, setVarieties] = useState<VarietyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VarietyCard | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const es = (spa: string, en: string) => (lang === "en" ? en : spa);

  useEffect(() => {
    const fetchVarieties = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("plant_varieties")
        .select(
          "id, name, plant_scientific_name, image_url, image_url_2, image_url_3, color, shape, size_weight, difficulty, personal_experience, description, tags, created_at"
        )
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(60);
      setVarieties(data || []);
      setLoading(false);
    };
    fetchVarieties();
  }, []);

  const getPlant = (scientificName: string | null) =>
    scientificName ? plants.find((p) => p.scientificName === scientificName) : null;

  const openVariety = (v: VarietyCard) => {
    setPhotoIndex(0);
    setSelected(v);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 max-w-lg mx-auto flex items-center gap-3">
          <Link to="/dashboard" className="p-1 -ml-1 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-base">
              {es("Variedades", "Varieties")}
            </h1>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-widest">
              {es("Las más recientes de la comunidad", "Most recent from the community")}
            </p>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="px-4 pt-5 pb-4 max-w-lg mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} delay={i * 0.05} />
            ))}
          </div>
        ) : varieties.length === 0 ? (
          <div className="text-center py-20">
            <Sprout className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground font-body text-sm">
              {es(
                "Aún no hay variedades. ¡Sé la primera en agregar una!",
                "No varieties yet. Be the first to add one!"
              )}
            </p>
            <Link
              to="/semillero"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground font-body text-sm font-medium"
            >
              <Sprout className="w-4 h-4" />
              {es("Ir al Semillero", "Go to Seed Library")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {varieties.map((v, i) => {
              const plant = getPlant(v.plant_scientific_name);
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.5) }}
                  className="rounded-2xl overflow-hidden relative cursor-pointer group"
                  style={{ height: "172px" }}
                  onClick={() => openVariety(v)}
                >
                  {/* Fondo */}
                  {v.image_url ? (
                    <img
                      src={v.image_url}
                      alt={v.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-leaf-light/40 flex items-center justify-center">
                      <span className="text-6xl opacity-20 select-none">
                        {plant?.emoji || "🌱"}
                      </span>
                    </div>
                  )}

                  {/* Gradiente */}
                  {v.image_url && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  )}

                  {/* Badge planta */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 text-[9px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground">
                      <Sprout className="w-2.5 h-2.5" />
                      {lang === "en" ? plant?.name_en : plant?.name}
                    </span>
                  </div>

                  {/* Nombre */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p
                      className={`font-display font-bold text-sm leading-snug line-clamp-2 ${
                        v.image_url ? "text-white" : "text-foreground"
                      }`}
                    >
                      {v.name}
                    </p>
                    {v.color && (
                      <p
                        className={`font-body text-xs mt-0.5 line-clamp-1 ${
                          v.image_url ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        {v.color}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Diálogo de detalle */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) { setSelected(null); setPhotoIndex(0); }
        }}
      >
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const plant = getPlant(selected.plant_scientific_name);
            const photos = [selected.image_url, selected.image_url_2, selected.image_url_3].filter(
              Boolean
            ) as string[];
            const detailRows = [
              { label: es("Color", "Color"), value: selected.color },
              { label: es("Forma", "Shape"), value: selected.shape },
              { label: es("Tamaño/Peso", "Size/Weight"), value: selected.size_weight },
              { label: es("Dificultad", "Difficulty"), value: selected.difficulty },
            ].filter((r) => r.value);

            return (
              <div className="space-y-4">
                {/* Fotos */}
                {photos.length > 0 && (
                  <div>
                    <div className="aspect-video rounded-xl overflow-hidden bg-muted/20">
                      <img
                        src={photos[photoIndex]}
                        alt={selected.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {photos.length > 1 && (
                      <div className="flex gap-1.5 mt-2 justify-center">
                        {photos.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPhotoIndex(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              i === photoIndex ? "bg-primary" : "bg-border"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{plant?.emoji || "🌱"}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-display font-bold">{selected.name}</h2>
                    <p className="text-sm text-muted-foreground font-body italic">
                      {lang === "en" ? plant?.name_en : plant?.name}
                      {selected.plant_scientific_name && ` · ${selected.plant_scientific_name}`}
                    </p>
                    {selected.tags && selected.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selected.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs font-body">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Datos */}
                {detailRows.length > 0 && (
                  <div className="rounded-xl border border-border overflow-hidden divide-y divide-border text-xs">
                    {detailRows.map((r) => (
                      <div key={r.label} className="flex gap-3 px-3 py-2.5">
                        <span className="text-muted-foreground shrink-0 w-24">{r.label}</span>
                        <span className="font-body text-foreground">{r.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Experiencia personal */}
                {selected.personal_experience && (
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                      {es("Experiencia personal", "Personal experience")}
                    </p>
                    <p className="text-sm font-body leading-relaxed text-foreground italic">
                      &ldquo;{selected.personal_experience}&rdquo;
                    </p>
                  </div>
                )}

                {selected.description && (
                  <p className="text-sm text-muted-foreground font-body leading-relaxed bg-muted/40 rounded-lg p-3">
                    {selected.description}
                  </p>
                )}

                {/* Link al semillero */}
                <Link
                  to="/semillero"
                  state={{
                    openVariety: selected.id,
                    plantName: selected.plant_scientific_name,
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-primary/30 text-primary font-body text-sm font-medium hover:bg-primary/5 transition-colors"
                >
                  <Sprout className="w-4 h-4" />
                  {es("Ver ficha completa →", "See full variety sheet →")}
                </Link>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VariedadesPage;
