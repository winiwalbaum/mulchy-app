import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Leaf, ChevronRight, ArrowLeft, ExternalLink, Thermometer, Sun, MapPin, TreePine, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { plants, categories, type Plant, type PlantCategory } from "@/data/plants";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNativePlants, categoryEmoji, categoryLabels, type NativePlant } from "@/hooks/useNativePlants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Detecta el link de compra correcto para "Un año en mi huerto" según la región del usuario
const getUnAnioLink = (): { url: string; label: string } => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const locale = navigator.language || navigator.languages?.[0] || "";
  const locales = Array.from(navigator.languages || [locale]);

  // Chile: timezone America/Santiago o Punta_Arenas, o cualquier locale es-CL
  const isChile = timezone.includes("Santiago") || timezone.includes("Punta_Arenas")
    || locales.some(l => l.toLowerCase().startsWith("es-cl"));
  if (isChile) {
    return { url: "https://editorial-trayecto.cl/producto/un-ano-en-mi-huerto-segunda-edicion/", label: "Trayecto Editorial" };
  }

  // Latinoamérica: timezones America/* excepto US/Canadá, o locale es-* excepto es-ES
  const latamTimezones = ["America/Argentina","America/Bogota","America/Lima","America/Caracas","America/La_Paz","America/Asuncion","America/Montevideo","America/Guayaquil","America/Mexico_City","America/Monterrey","America/Bogota","America/Costa_Rica","America/El_Salvador","America/Guatemala","America/Managua","America/Panama","America/Havana","America/Santo_Domingo","America/Tegucigalpa"];
  const isLatam = latamTimezones.some(tz => timezone.startsWith(tz))
    || (locales.some(l => l.toLowerCase().startsWith("es")) && !locales.some(l => l.toLowerCase().startsWith("es-es")));
  if (isLatam) {
    return { url: "https://www.buscalibre.cl/libros/buscar?q=un+a%C3%B1o+en+mi+huerto+wini+walbaum", label: "Buscalibre" };
  }

  return { url: "https://www.amazon.com/s?k=un+a%C3%B1o+en+mi+huerto+wini+walbaum", label: "Amazon" };
};

const difficultyColor: Record<string, string> = {
  "Fácil": "bg-leaf-light/40 text-primary",
  "Easy": "bg-leaf-light/40 text-primary",
  "Media": "bg-secondary text-earth",
  "Medium": "bg-secondary text-earth",
  "Avanzada": "bg-accent/20 text-violet",
  "Advanced": "bg-accent/20 text-violet",
};

const BibliotecaPage = () => {
  const { t, lang } = useLanguage();
  const b = t.biblioteca as any;
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<PlantCategory | "todas">("todas");
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [selectedNative, setSelectedNative] = useState<NativePlant | null>(null);
  const [nativeCategory, setNativeCategory] = useState<string>("all");
  const [nativeDesc, setNativeDesc] = useState<string | null>(null);
  const [nativeDescLoading, setNativeDescLoading] = useState(false);

  const { plants: nativePlants, loading: nativeLoading, error: nativeError, fetchDescription } = useNativePlants();

  // Fetch description when a native plant is selected
  useEffect(() => {
    if (!selectedNative) {
      setNativeDesc(null);
      setNativeDescLoading(false);
      return;
    }
    const desc = lang === "en" ? selectedNative.description_en : selectedNative.description;
    if (desc) {
      setNativeDesc(desc);
      return;
    }
    setNativeDescLoading(true);
    setNativeDesc(null);
    fetchDescription(selectedNative).then((result) => {
      const d = lang === "en" ? result.description_en : result.description;
      setNativeDesc(d);
      setNativeDescLoading(false);
    });
  }, [selectedNative, lang]);

  const l = <T,>(es: T, en: T | undefined): T => lang === "en" && en !== undefined ? en as T : es;

  const filtered = useMemo(() => {
    return plants.filter((p) => {
      const q = search.toLowerCase();
      const name = lang === "en" ? p.name_en : p.name;
      const matchesSearch = name.toLowerCase().includes(q) || p.scientificName.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      const matchesCategory = activeCategory === "todas" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory, lang]);

  // Native plants filtering
  const nativeCategories = useMemo(() => {
    const cats = new Set(nativePlants.map((p) => p.category));
    return Array.from(cats).sort();
  }, [nativePlants]);

  const filteredNative = useMemo(() => {
    let result = nativePlants;
    if (nativeCategory !== "all") {
      result = result.filter((p) => p.category === nativeCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.common_name || "").toLowerCase().includes(q) ||
          (p.common_name_en || "").toLowerCase().includes(q) ||
          p.scientific_name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [nativePlants, nativeCategory, search]);

  const getNativeName = (p: NativePlant) => {
    if (lang === "en" && p.common_name_en) return p.common_name_en;
    return p.common_name || p.scientific_name;
  };

  const getCategoryLabel = (cat: string) => {
    const labels = categoryLabels[cat];
    if (!labels) return cat;
    return lang === "en" ? labels.en : labels.es;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHY" />
            <h1 className="text-xl font-semibold">{b.title}</h1>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={b.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 font-body" />
        </div>

        <Tabs defaultValue="catalog" className="mb-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="catalog" className="font-body">
              <Leaf className="w-4 h-4 mr-2" />
              {lang === "en" ? "Plant Catalog" : "Catálogo"}
            </TabsTrigger>
            <TabsTrigger value="native" className="font-body">
              <TreePine className="w-4 h-4 mr-2" />
              {lang === "en" ? "Native Plants" : "Nativas"}
              {nativePlants.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                  {nativePlants.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── Catalog Tab ─── */}
          <TabsContent value="catalog">
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <button key={cat.value} onClick={() => setActiveCategory(cat.value)} className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${activeCategory === cat.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
                  {l(cat.label, cat.label_en)}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground font-body mb-4">
              {filtered.length} {(t.common as any).plants}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filtered.map((plant, i) => {
                const name = l(plant.name, plant.name_en);
                const difficulty = l(plant.difficulty, plant.difficulty_en);
                return (
                  <motion.div
                    key={`${plant.category}-${plant.name}`}
                    className="cursor-pointer group"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.5) }}
                    onClick={() => setSelectedPlant(plant)}
                  >
                    {/* Pantone card */}
                    <div className="bg-white rounded-sm shadow-card hover:shadow-elevated transition-shadow border border-gray-200 overflow-hidden">
                      {/* Photo area */}
                      <div className="aspect-square bg-gradient-to-br from-leaf-light/40 via-leaf-light/20 to-cream flex items-center justify-center relative overflow-hidden">
                        <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300">{plant.emoji}</span>
                        <div className="absolute top-1.5 right-1.5">
                          <span className={`text-[8px] px-1 py-0.5 rounded font-body font-medium ${difficultyColor[difficulty] || ""}`}>{difficulty}</span>
                        </div>
                      </div>
                      {/* Pantone label */}
                      <div className="bg-white px-2 pt-1.5 pb-2 border-t border-gray-100">
                        <p className="text-[8px] font-body text-gray-400 tracking-widest uppercase mb-0.5">MULCHY®</p>
                        <h3 className="font-display font-bold text-sm leading-tight text-gray-900">{name}</h3>
                        <p className="text-[9px] text-gray-400 font-body italic mt-0.5 truncate">{plant.scientificName}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground font-body">{b.noResults}</p>
              </div>
            )}
          </TabsContent>

          {/* ─── Native Plants Tab ─── */}
          <TabsContent value="native">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-semibold">{b.nativeTitle}</h2>
              </div>
              <p className="text-sm text-muted-foreground font-body">{b.nativeSubtitle}</p>
            </div>

            {nativeLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground font-body">{b.nativeLoading}</p>
              </div>
            ) : nativeError ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground font-body">{b.nativeError}</p>
                <p className="text-xs text-muted-foreground font-body mt-2">{nativeError}</p>
              </div>
            ) : nativePlants.length === 0 ? (
              <div className="text-center py-20">
                <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-body">{b.nativeNoLocation}</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to="/perfil">{lang === "en" ? "Go to Profile" : "Ir a Perfil"}</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Category filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setNativeCategory("all")}
                    className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${nativeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
                  >
                    {b.nativeAllCategories}
                  </button>
                  {nativeCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNativeCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${nativeCategory === cat ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
                    >
                      {categoryEmoji[cat] || "🍃"} {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground font-body mb-4">
                  {filteredNative.length} {lang === "en" ? "species" : "especies"}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredNative.map((plant, i) => (
                    <motion.div
                      key={plant.taxon_id}
                      className="cursor-pointer group"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.5) }}
                      onClick={() => setSelectedNative(plant)}
                    >
                      {/* Pantone card */}
                      <div className="bg-white rounded-sm shadow-card hover:shadow-elevated transition-shadow border border-gray-200 overflow-hidden">
                        {/* Photo area */}
                        <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-leaf-light/30 to-cream flex items-center justify-center">
                          {plant.image_url ? (
                            <img
                              src={plant.image_url}
                              alt={getNativeName(plant)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-5xl select-none">{categoryEmoji[plant.category] || "🍃"}</span>
                          )}
                          <div className="absolute top-1.5 right-1.5">
                            <span className="text-[8px] px-1 py-0.5 rounded font-body font-medium bg-white/80 text-gray-600">
                              {getCategoryLabel(plant.category)}
                            </span>
                          </div>
                        </div>
                        {/* Pantone label */}
                        <div className="bg-white px-2 pt-1.5 pb-2 border-t border-gray-100">
                          <p className="text-[8px] font-body text-gray-400 tracking-widest uppercase mb-0.5">MULCHY®</p>
                          <h3 className="font-display font-bold text-sm leading-tight text-gray-900 capitalize">{getNativeName(plant)}</h3>
                          <p className="text-[9px] text-gray-400 font-body italic mt-0.5 truncate">{plant.scientific_name}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredNative.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground font-body">{b.noResults}</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Catalog Plant Detail Dialog ─── */}
      <Dialog open={!!selectedPlant} onOpenChange={() => setSelectedPlant(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedPlant && (() => {
            const name = l(selectedPlant.name, selectedPlant.name_en);
            const tip = l(selectedPlant.tip, selectedPlant.tip_en);
            const season = l(selectedPlant.season, selectedPlant.season_en);
            const difficulty = l(selectedPlant.difficulty, selectedPlant.difficulty_en);
            const description = l(selectedPlant.description, selectedPlant.description_en);
            const lightCold = l(selectedPlant.lightCold, selectedPlant.lightCold_en);
            const lightWarm = l(selectedPlant.lightWarm, selectedPlant.lightWarm_en);
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedPlant.emoji}</span>
                    <div>
                      <DialogTitle className="text-xl">{name}</DialogTitle>
                      <p className="text-sm text-muted-foreground italic font-body">{selectedPlant.scientificName}</p>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-body capitalize">{l(selectedPlant.category, categories.find(c => c.value === selectedPlant.category)?.label_en?.replace(/^[^\s]+\s/, '') || selectedPlant.category)}</Badge>
                    <Badge variant="secondary" className="font-body">{season}</Badge>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-body font-medium ${difficultyColor[difficulty] || ""}`}>{difficulty}</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-body font-medium text-foreground">{b.quickTip}</p>
                    <p className="text-sm text-muted-foreground font-body mt-1">{tip}</p>
                  </div>
                  {description && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">{b.description}</h4>
                      <p className="text-sm text-muted-foreground font-body leading-relaxed">{description}</p>
                    </div>
                  )}
                  {(selectedPlant.tempRange || lightCold || lightWarm) && (
                    <div className="grid grid-cols-1 gap-3">
                      {selectedPlant.tempRange && (
                        <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                          <Thermometer className="w-5 h-5 text-destructive shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{b.temperature}</p>
                            <p className="text-xs text-muted-foreground font-body">{selectedPlant.tempRange}</p>
                          </div>
                        </div>
                      )}
                      {lightCold && lightCold !== "—" && (
                        <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                          <Sun className="w-5 h-5 text-warning shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{b.lightCold}</p>
                            <p className="text-xs text-muted-foreground font-body">{lightCold}</p>
                          </div>
                        </div>
                      )}
                      {lightWarm && lightWarm !== "—" && (
                        <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                          <Sun className="w-5 h-5 text-primary shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{b.lightWarm}</p>
                            <p className="text-xs text-muted-foreground font-body">{lightWarm}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Fuentes múltiples */}
                  {(selectedPlant.sourceUrl || selectedPlant.sources) && (
                    <div className="flex flex-col gap-1 mt-2">
                      {/* Un año en mi huerto – link regional único */}
                      {selectedPlant.sourceName?.includes("Un año en mi huerto") && (() => {
                        const { url, label } = getUnAnioLink();
                        return (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-body">
                            <ExternalLink className="w-3.5 h-3.5" /> 📗 Un año en mi huerto — {label}
                          </a>
                        );
                      })()}
                      {/* Old Farmer's Almanac */}
                      {selectedPlant.sourceUrl && selectedPlant.sourceName?.includes("Almanac") && (
                        <a href={selectedPlant.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-body">
                          <ExternalLink className="w-3.5 h-3.5" /> The Old Farmer's Almanac
                        </a>
                      )}
                      {/* Wikipedia u otras fuentes simples */}
                      {selectedPlant.sourceUrl && !selectedPlant.sourceName?.includes("Almanac") && !selectedPlant.sourceName?.includes("Un año") && (
                        <a href={selectedPlant.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-body">
                          <ExternalLink className="w-3.5 h-3.5" /> {selectedPlant.sourceName || b.viewSource}
                        </a>
                      )}
                      {/* Sources array adicionales */}
                      {selectedPlant.sources?.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-body">
                          <ExternalLink className="w-3.5 h-3.5" /> {s.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── Native Plant Detail Dialog ─── */}
      <Dialog open={!!selectedNative} onOpenChange={() => setSelectedNative(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedNative && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{categoryEmoji[selectedNative.category] || "🍃"}</span>
                  <div>
                    <DialogTitle className="text-xl capitalize">{getNativeName(selectedNative)}</DialogTitle>
                    <p className="text-sm text-muted-foreground italic font-body">{selectedNative.scientific_name}</p>
                  </div>
                </div>
              </DialogHeader>

              {selectedNative.image_url && (
                <div className="rounded-lg overflow-hidden mt-2">
                  <img
                    src={selectedNative.image_url}
                    alt={getNativeName(selectedNative)}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="space-y-4 mt-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-body">
                    {getCategoryLabel(selectedNative.category)}
                  </Badge>
                  <Badge variant="outline" className="font-body text-xs">
                    {selectedNative.observation_count} {b.nativeObservations}
                  </Badge>
                </div>

                {/* AI-generated description */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-body font-medium text-foreground mb-1">
                    {b.description}
                  </p>
                  {nativeDescLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {lang === "en" ? "Generating description..." : "Generando descripción..."}
                    </div>
                  ) : nativeDesc ? (
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">{nativeDesc}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground font-body italic">
                      {lang === "en" ? "No description available." : "Descripción no disponible."}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {selectedNative.inat_url && (
                    <a href={selectedNative.inat_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-body">
                      <ExternalLink className="w-3.5 h-3.5" />
                      {b.nativeViewOn}
                    </a>
                  )}
                  {selectedNative.wikipedia_url && (
                    <a href={selectedNative.wikipedia_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-body">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Wikipedia
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BibliotecaPage;
