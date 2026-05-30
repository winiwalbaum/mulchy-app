import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sprout, ChevronLeft, ChevronRight, X, Bookmark, TreePine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { plants, type PlantCategory } from "@/data/plants";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useHerbario } from "@/hooks/useHerbario";
import { useNativeHerbario } from "@/hooks/useNativeHerbario";
import { useAuth } from "@/contexts/AuthContext";
import { categoryEmoji, categoryLabels } from "@/hooks/useNativePlants";

interface NativePlantCard {
  native_plant_id: string;
  common_name: string | null;
  common_name_en: string | null;
  scientific_name: string;
  category: string;
  image_url: string | null;
}

const CATALOG_CATEGORIES: { value: PlantCategory | "all"; label: { es: string; en: string } }[] = [
  { value: "all",          label: { es: "Todas",       en: "All" } },
  { value: "hortalizas",   label: { es: "Hortalizas",  en: "Vegetables" } },
  { value: "aromáticas",   label: { es: "Aromáticas",  en: "Herbs" } },
  { value: "frutales",     label: { es: "Frutales",    en: "Fruit" } },
  { value: "flores",       label: { es: "Flores",      en: "Flowers" } },
  { value: "medicinales",  label: { es: "Medicinales", en: "Medicinal" } },
  { value: "ornamentales", label: { es: "Ornamentales",en: "Ornamental" } },
  { value: "arbustos",     label: { es: "Arbustos",    en: "Shrubs" } },
  { value: "bulbos",       label: { es: "Bulbos",      en: "Bulbs" } },
  { value: "trepadoras",   label: { es: "Trepadoras",  en: "Climbers" } },
  { value: "interior",     label: { es: "Interior",    en: "Indoor" } },
];

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
  const { user } = useAuth();
  const [varieties, setVarieties] = useState<VarietyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VarietyCard | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [catalogCategory, setCatalogCategory] = useState<PlantCategory | "all">("all");
  const [catalogSearch, setCatalogSearch] = useState("");

  const { savedIds, toggle: toggleHerbario } = useHerbario();
  const { toggle: toggleNative } = useNativeHerbario();
  const [nativePlants, setNativePlants] = useState<NativePlantCard[]>([]);
  const [nativeLoading, setNativeLoading] = useState(true);
  const [selectedNative, setSelectedNative] = useState<NativePlantCard | null>(null);

  const es = (spa: string, en: string) => (lang === "en" ? en : spa);

  const filteredPlants = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return plants.filter((p) => {
      if (catalogCategory !== "all" && p.category !== catalogCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q)
      );
    });
  }, [catalogCategory, catalogSearch]);

  useEffect(() => {
    const fetchVarieties = async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);

      // Fetch only varieties the user has saved in their herbario
      const { data: grows } = await supabase
        .from("user_variety_grows")
        .select("variety_id")
        .eq("user_id", user.id);

      if (!grows || grows.length === 0) {
        setVarieties([]);
        setLoading(false);
        return;
      }

      const ids = grows.map((g: any) => g.variety_id);
      const { data } = await supabase
        .from("plant_varieties")
        .select(
          "id, name, plant_scientific_name, image_url, image_url_2, image_url_3, color, shape, size_weight, difficulty, personal_experience, description, tags, created_at"
        )
        .in("id", ids)
        .order("created_at", { ascending: false });

      setVarieties(data || []);
      setLoading(false);
    };
    fetchVarieties();
  }, [user?.id]);

  useEffect(() => {
    const fetchNatives = async () => {
      if (!user) { setNativeLoading(false); return; }
      const { data } = await supabase
        .from("user_native_plants")
        .select("native_plant_id, common_name, common_name_en, scientific_name, category, image_url")
        .eq("user_id", user.id);
      setNativePlants((data as NativePlantCard[]) || []);
      setNativeLoading(false);
    };
    fetchNatives();
  }, [user?.id]);

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
              {es("Mis plantas", "My plants")}
            </h1>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-widest">
              {es("Tu colección personal", "Your personal collection")}
            </p>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="px-4 pt-5 pb-4 max-w-lg mx-auto">
        {loading && nativeLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} delay={i * 0.05} />
            ))}
          </div>
        ) : varieties.length === 0 && nativePlants.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center gap-3 mb-4 opacity-30">
              <Sprout className="w-8 h-8 text-muted-foreground" />
              <TreePine className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-body text-sm">
              {es("Aún no tienes plantas guardadas.", "You haven't saved any plants yet.")}
            </p>
            <p className="text-xs text-muted-foreground font-body mt-1 mb-5">
              {es(
                "Guarda variedades desde el Semillero 🔖 o plantas nativas desde la Biblioteca 🌿",
                "Save varieties from the Seed Library 🔖 or native plants from the Library 🌿"
              )}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/semillero" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-body text-sm font-medium">
                <Sprout className="w-4 h-4" /> {es("Semillero", "Seed Library")}
              </Link>
              <Link to="/biblioteca" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border font-body text-sm font-medium">
                <TreePine className="w-4 h-4" /> {es("Biblioteca", "Library")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {varieties.map((v, i) => {
              const plant = getPlant(v.plant_scientific_name);
              // Usar la primera foto disponible (cualquiera de los 3 slots)
              const cardPhoto = v.image_url || v.image_url_2 || v.image_url_3;
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
                  {cardPhoto ? (
                    <img
                      src={cardPhoto}
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
                  {cardPhoto && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  )}

                  {/* Badge planta */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 text-[9px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground">
                      <Sprout className="w-2.5 h-2.5" />
                      {lang === "en" ? plant?.name_en : plant?.name}
                    </span>
                  </div>

                  {/* Botón quitar de colección */}
                  <button
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg backdrop-blur-sm bg-primary text-primary-foreground transition-colors hover:bg-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHerbario(v.id);
                      setVarieties((prev) => prev.filter((p) => p.id !== v.id));
                    }}
                    title={es("Quitar de mis plantas", "Remove from my plants")}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Nombre */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p
                      className={`font-display font-bold text-sm leading-snug line-clamp-2 ${
                        cardPhoto ? "text-white" : "text-foreground"
                      }`}
                    >
                      {v.name}
                    </p>
                    {v.color && (
                      <p
                        className={`font-body text-xs mt-0.5 line-clamp-1 ${
                          cardPhoto ? "text-white/70" : "text-muted-foreground"
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

        {/* ── Plantas nativas guardadas ── */}
        {nativePlants.length > 0 && (
          <div className="mt-6">
            {varieties.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-px bg-border" />
                <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-widest shrink-0 flex items-center gap-1.5">
                  <TreePine className="w-3.5 h-3.5" />
                  {es("Plantas nativas", "Native plants")}
                </h2>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {nativePlants.map((np, i) => {
                const name = lang === "en"
                  ? np.common_name_en || np.common_name || np.scientific_name
                  : np.common_name || np.scientific_name;
                const emoji = categoryEmoji[np.category] || "🍃";
                const catLabel = categoryLabels[np.category]?.[lang === "en" ? "en" : "es"] || np.category;
                return (
                  <motion.div
                    key={np.native_plant_id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
                    className="rounded-2xl overflow-hidden relative cursor-pointer group"
                    style={{ height: "172px" }}
                    onClick={() => setSelectedNative(np)}
                  >
                    {/* Fondo */}
                    {np.image_url ? (
                      <img
                        src={np.image_url}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-green-50 flex items-center justify-center">
                        <span className="text-6xl opacity-20 select-none">{emoji}</span>
                      </div>
                    )}
                    {np.image_url && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    )}

                    {/* Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 text-[9px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-700/90 text-white">
                        <TreePine className="w-2.5 h-2.5" />
                        {catLabel}
                      </span>
                    </div>

                    {/* Quitar */}
                    <button
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg backdrop-blur-sm bg-emerald-700/90 text-white transition-colors hover:bg-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNative(np.native_plant_id);
                        setNativePlants((prev) => prev.filter((p) => p.native_plant_id !== np.native_plant_id));
                      }}
                      title={es("Quitar de mis plantas", "Remove from my plants")}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Nombre */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className={`font-display font-bold text-sm leading-snug line-clamp-2 ${np.image_url ? "text-white" : "text-foreground"}`}>
                        {name}
                      </p>
                      <p className={`font-body text-xs mt-0.5 italic line-clamp-1 ${np.image_url ? "text-white/70" : "text-muted-foreground"}`}>
                        {np.scientific_name}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>{/* /Grid */}

      {/* ── Catálogo de plantas ────────────────────────────── */}
      <div className="px-4 pb-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mt-8 mb-4">
          <div className="flex-1 h-px bg-border" />
          <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-widest shrink-0">
            {es("Explorar por planta", "Browse by plant")}
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            placeholder={es("Buscar plantas...", "Search plants...")}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card font-body text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {CATALOG_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCatalogCategory(c.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors border ${
                catalogCategory === c.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {lang === "en" ? c.label.en : c.label.es}
            </button>
          ))}
        </div>

        {/* Lista de plantas */}
        <div className="space-y-2">
          {filteredPlants.map((plant, i) => (
            <motion.div
              key={plant.scientificName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
            >
              <Link
                to="/semillero"
                state={{ expandPlant: plant.scientificName }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted/30 transition-colors"
              >
                <span className="text-2xl w-8 shrink-0">{plant.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-sm">
                    {lang === "en" ? plant.name_en : plant.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-body italic truncate">
                    {plant.scientificName}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            </motion.div>
          ))}
          {filteredPlants.length === 0 && (
            <p className="text-center py-8 text-muted-foreground font-body text-sm">
              {es("No se encontraron plantas.", "No plants found.")}
            </p>
          )}
        </div>
      </div>

      {/* Diálogo de detalle */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) { setSelected(null); setPhotoIndex(0); setLightboxOpen(false); }
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
                    <div
                      className="aspect-video rounded-xl overflow-hidden bg-muted/20 cursor-zoom-in"
                      onClick={() => setLightboxOpen(true)}
                    >
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

                {/* Botón quitar de colección */}
                <button
                  onClick={() => {
                    toggleHerbario(selected.id);
                    setVarieties((prev) => prev.filter((p) => p.id !== selected.id));
                    setSelected(null);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-body text-sm font-medium transition-colors border border-destructive/30 text-destructive hover:bg-destructive/5"
                >
                  <Bookmark className="w-4 h-4" />
                  {es("Quitar de mis plantas", "Remove from my plants")}
                </button>

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

      {/* ── Diálogo planta nativa ── */}
      <Dialog open={!!selectedNative} onOpenChange={(open) => { if (!open) setSelectedNative(null); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{selectedNative?.scientific_name}</DialogTitle>
          </DialogHeader>
          {selectedNative && (() => {
            const name = lang === "en"
              ? selectedNative.common_name_en || selectedNative.common_name || selectedNative.scientific_name
              : selectedNative.common_name || selectedNative.scientific_name;
            const emoji = categoryEmoji[selectedNative.category] || "🍃";
            const catLabel = categoryLabels[selectedNative.category]?.[lang === "en" ? "en" : "es"] || selectedNative.category;
            return (
              <div className="space-y-4">
                {selectedNative.image_url && (
                  <div className="rounded-xl overflow-hidden">
                    <img src={selectedNative.image_url} alt={name} className="w-full h-52 object-cover" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{emoji}</span>
                  <div className="flex-1">
                    <h2 className="text-xl font-display font-bold capitalize">{name}</h2>
                    <p className="text-sm text-muted-foreground font-body italic">{selectedNative.scientific_name}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-body mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <TreePine className="w-3 h-3" /> {catLabel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    toggleNative(selectedNative.native_plant_id);
                    setNativePlants((prev) => prev.filter((p) => p.native_plant_id !== selectedNative.native_plant_id));
                    setSelectedNative(null);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-body text-sm font-medium transition-colors border border-destructive/30 text-destructive hover:bg-destructive/5"
                >
                  <Bookmark className="w-4 h-4" />
                  {es("Quitar de mis plantas", "Remove from my plants")}
                </button>
                <Link
                  to="/biblioteca"
                  state={{ tab: "native" }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-primary/30 text-primary font-body text-sm font-medium hover:bg-primary/5 transition-colors"
                >
                  <TreePine className="w-4 h-4" />
                  {es("Ver en Biblioteca →", "View in Library →")}
                </Link>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxOpen && selected && createPortal(
        (() => {
          const lbPhotos = [selected.image_url, selected.image_url_2, selected.image_url_3].filter(Boolean) as string[];
          return (
            <div
              className="fixed inset-0 flex items-center justify-center"
              style={{ zIndex: 9999, background: "rgba(0,0,0,0.95)" }}
              onClick={() => setLightboxOpen(false)}
            >
              {/* Cerrar */}
              <button
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                style={{ zIndex: 10000 }}
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
              >
                <X className="w-6 h-6" />
              </button>

              {/* Prev / Next */}
              {lbPhotos.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    style={{ zIndex: 10000 }}
                    onClick={(e) => { e.stopPropagation(); setPhotoIndex((p) => (p - 1 + lbPhotos.length) % lbPhotos.length); }}
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    style={{ zIndex: 10000 }}
                    onClick={(e) => { e.stopPropagation(); setPhotoIndex((p) => (p + 1) % lbPhotos.length); }}
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                </>
              )}

              {/* Imagen */}
              <img
                src={lbPhotos[photoIndex] ?? lbPhotos[0]}
                alt={selected.name}
                className="max-w-full max-h-full object-contain select-none"
                style={{ padding: "3rem" }}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Dots */}
              {lbPhotos.length > 1 && (
                <div className="absolute bottom-6 flex gap-2">
                  {lbPhotos.map((_, i) => (
                    <button
                      key={i}
                      style={{ zIndex: 10000 }}
                      onClick={(e) => { e.stopPropagation(); setPhotoIndex(i); }}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${i === photoIndex ? "bg-white" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
};

export default VariedadesPage;
