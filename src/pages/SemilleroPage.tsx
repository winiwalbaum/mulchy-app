import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, ChevronLeft, ChevronRight, Star, Leaf,
  Sprout, Users, X, Check, Loader2, Calendar, ArrowLeft, MapPin, ExternalLink, TreePine, Camera, Pencil,
  Bookmark, BookmarkCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/i18n/LanguageContext";
import { plants, type Plant, type PlantCategory } from "@/data/plants";
import { plantExtra, formatMonths } from "@/data/plantExtra";
import { useNativePlants, categoryEmoji, categoryLabels, type NativePlant } from "@/hooks/useNativePlants";
import { useNativeHerbario } from "@/hooks/useNativeHerbario";
import {
  useVarieties, useVarietyGrows, useMyGrow, useMyRating,
  upsertGrow, insertVariety, updateVariety, upsertRating, uploadVarietyPhoto,
  statusEmoji, statusLabel,
  type Variety,
} from "@/hooks/useSemillero";

const STATUS_OPTIONS = ["growing", "harvested", "failed", "planned"] as const;

const CATEGORIES: { value: PlantCategory | "all"; label: { es: string; en: string } }[] = [
  { value: "all",         label: { es: "Todas", en: "All" } },
  { value: "hortalizas",  label: { es: "Hortalizas", en: "Vegetables" } },
  { value: "aromáticas",  label: { es: "Aromáticas", en: "Herbs" } },
  { value: "frutales",    label: { es: "Frutales", en: "Fruit" } },
  { value: "flores",      label: { es: "Flores", en: "Flowers" } },
  { value: "medicinales", label: { es: "Medicinales", en: "Medicinal" } },
  { value: "ornamentales",label: { es: "Ornamentales", en: "Ornamental" } },
  { value: "arbustos",    label: { es: "Arbustos", en: "Shrubs" } },
  { value: "bulbos",      label: { es: "Bulbos", en: "Bulbs" } },
  { value: "trepadoras",  label: { es: "Trepadoras", en: "Climbers" } },
  { value: "interior",    label: { es: "Interior", en: "Indoor" } },
];

// ─── Grow Form ────────────────────────────────────────────────────────────────
const GrowForm = ({
  varietyId, userId, displayName, lang, onClose, onSaved,
}: {
  varietyId: string; userId: string; displayName: string;
  lang: string; onClose: () => void; onSaved: () => void;
}) => {
  const { myGrow, loading } = useMyGrow(varietyId, userId);
  const [status, setStatus] = useState<string>("growing");
  const [season, setSeason] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [sowDate, setSowDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (!loading && !initialized) {
    setInitialized(true);
    if (myGrow) {
      setStatus(myGrow.status);
      setSeason(myGrow.season || "");
      setNotes(myGrow.notes || "");
      setRating(myGrow.rating || 0);
      setSowDate(myGrow.sow_date || "");
    }
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await upsertGrow({
      variety_id: varietyId,
      user_id: userId,
      display_name: displayName,
      status: status as any,
      season: season || null,
      notes: notes || null,
      rating: rating || null,
      sow_date: sowDate || null,
    });
    setSaving(false);
    if (error) { toast.error(lang === "en" ? "Error saving" : "Error al guardar"); return; }
    toast.success(lang === "en" ? "Saved!" : "¡Guardado!");
    onSaved();
    onClose();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <Label className="font-body text-sm mb-2 block">{lang === "en" ? "Status" : "Estado"}</Label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-body transition-colors border ${status === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary"}`}
            >
              {statusEmoji[s]} {statusLabel[s][lang as "es" | "en"] ?? statusLabel[s].es}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="font-body text-sm">{lang === "en" ? "Season" : "Temporada"}</Label>
          <Input value={season} onChange={(e) => setSeason(e.target.value)} placeholder={lang === "en" ? "Spring 2026" : "Primavera 2026"} className="mt-1 font-body" />
        </div>
        <div>
          <Label className="font-body text-sm">{lang === "en" ? "Sow date" : "Fecha de siembra"}</Label>
          <Input type="date" value={sowDate} onChange={(e) => setSowDate(e.target.value)} className="mt-1 font-body" />
        </div>
      </div>

      <div>
        <Label className="font-body text-sm">{lang === "en" ? "Notes" : "Notas"}</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={lang === "en" ? "How did it go? Flavor, yield, soil, pests..." : "¿Cómo te fue? Sabor, rendimiento, suelo, plagas..."}
          className="mt-1 font-body resize-none"
          rows={3}
        />
      </div>

      <div>
        <Label className="font-body text-sm mb-2 block">{lang === "en" ? "Rating" : "Valoración"}</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(rating === n ? 0 : n)}>
              <Star className={`w-6 h-6 transition-colors ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1 font-body" onClick={onClose}>{lang === "en" ? "Cancel" : "Cancelar"}</Button>
        <Button variant="hero" className="flex-1 font-body" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
          {lang === "en" ? "Save" : "Guardar"}
        </Button>
      </div>
    </div>
  );
};

// ─── Add Variety Form (multi-step) ────────────────────────────────────────────
const DIFFICULTY_OPTIONS = [
  { value: "Fácil", emoji: "🟢" },
  { value: "Media", emoji: "🟡" },
  { value: "Avanzada", emoji: "🔴" },
];

const AddVarietyForm = ({
  plant, userId, lang, onClose, onSaved,
}: {
  plant: Plant; userId: string; lang: string;
  onClose: () => void; onSaved: () => void;
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Photos
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);
  // Step 2 — variety data
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [shape, setShape] = useState("");
  const [sizeWeight, setSizeWeight] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  // Step 3 — experience
  const [location, setLocation] = useState("");
  const [yearsCultivated, setYearsCultivated] = useState("");
  const [seedOrigin, setSeedOrigin] = useState("");
  const [personalExperience, setPersonalExperience] = useState("");
  const [saving, setSaving] = useState(false);

  // Refs must be unconditional
  const photoRef1 = useRef<HTMLInputElement>(null);
  const photoRef2 = useRef<HTMLInputElement>(null);
  const photoRef3 = useRef<HTMLInputElement>(null);
  const photoRefs = [photoRef1, photoRef2, photoRef3];

  const handlePhotoChange = (index: number, file: File) => {
    setPhotos((prev) => { const n = [...prev]; n[index] = file; return n; });
    const url = URL.createObjectURL(file);
    setPreviews((prev) => { const n = [...prev]; n[index] = url; return n; });
  };

  const addTag = (value: string) => {
    const t = value.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    else if (e.key === "Backspace" && !tagInput && tags.length > 0) setTags((prev) => prev.slice(0, -1));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const urls: (string | undefined)[] = [];
    for (let i = 0; i < 3; i++) {
      if (photos[i]) {
        const url = await uploadVarietyPhoto(photos[i]!, userId, (i + 1) as 1 | 2 | 3);
        urls.push(url || undefined);
      } else {
        urls.push(undefined);
      }
    }
    const { error } = await insertVariety({
      plant_scientific_name: plant.scientificName,
      name: name.trim(),
      color: color || undefined,
      shape: shape || undefined,
      size_weight: sizeWeight || undefined,
      location: location || undefined,
      years_cultivated: yearsCultivated ? parseInt(yearsCultivated) : undefined,
      seed_origin: seedOrigin || undefined,
      personal_experience: personalExperience || undefined,
      difficulty: difficulty || undefined,
      tags: tags.length ? tags : undefined,
      image_url: urls[0],
      image_url_2: urls[1],
      image_url_3: urls[2],
      created_by: userId,
    });
    setSaving(false);
    if (error) { toast.error(lang === "en" ? "Error saving" : "Error al guardar"); return; }
    toast.success(lang === "en" ? "Variety submitted!" : "¡Ficha enviada! Se revisará antes de publicarse.");
    onSaved();
    onClose();
  };

  const StepIndicator = () => (
    <div className="flex items-center gap-1 mb-5">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium shrink-0 transition-colors ${step === n ? "bg-primary text-primary-foreground" : step > n ? "bg-primary/25 text-primary" : "bg-muted text-muted-foreground"}`}>{n}</div>
          {i < 2 && <div className={`flex-1 h-px transition-colors ${step > n ? "bg-primary/40" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );

  // ── Step 1: Photos ──
  if (step === 1) {
    const slots = [
      { ref: photoRef1, label: lang === "en" ? "On the plant" : "En la mata", hint: lang === "en" ? "Fruit on the plant" : "Fruto en la planta" },
      { ref: photoRef2, label: lang === "en" ? "In hand" : "En la mano", hint: lang === "en" ? "Real size" : "Tamaño real" },
      { ref: photoRef3, label: lang === "en" ? "Cross-section" : "Al corte", hint: lang === "en" ? "Inside the fruit" : "Interior del fruto" },
    ];
    return (
      <div className="space-y-4">
        <StepIndicator />
        <div>
          <h3 className="font-display font-bold text-base mb-1">{lang === "en" ? "Photos" : "Fotos"}</h3>
          <p className="text-xs text-muted-foreground font-body mb-4">
            {lang === "en"
              ? "Natural light, good quality. One photo on the plant, one in hand, one cross-section."
              : "Con buena luz natural. Un fruto en la planta, uno en la mano y uno al corte."}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {slots.map(({ ref, label, hint }, i) => (
              <div key={i}
                onClick={() => ref.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-colors overflow-hidden"
              >
                <input ref={ref} type="file" accept="image/*" className="sr-only"
                  onChange={(e) => e.target.files?.[0] && handlePhotoChange(i, e.target.files[0])} />
                {previews[i] ? (
                  <img src={previews[i]!} className="w-full h-full object-cover" alt={label} />
                ) : (
                  <div className="flex flex-col items-center gap-1 p-2 text-center">
                    <Camera className="w-5 h-5 text-muted-foreground" />
                    <p className="text-[10px] font-body font-medium text-muted-foreground leading-tight">{label}</p>
                    <p className="text-[9px] font-body text-muted-foreground/60 leading-tight">{hint}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1 font-body" onClick={onClose}>{lang === "en" ? "Cancel" : "Cancelar"}</Button>
          <Button variant="hero" className="flex-1 font-body" onClick={() => setStep(2)}>{lang === "en" ? "Next →" : "Siguiente →"}</Button>
        </div>
      </div>
    );
  }

  // ── Step 2: Variety data ──
  if (step === 2) return (
    <div className="space-y-3">
      <StepIndicator />
      <h3 className="font-display font-bold text-base">{lang === "en" ? "The variety" : "La variedad"}</h3>

      <div>
        <Label className="font-body text-sm">{lang === "en" ? "Variety name *" : "Nombre de la variedad *"}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)}
          placeholder={lang === "en" ? "e.g. Ox Heart" : "Ej: Corazón de buey"} className="mt-1 font-body" autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="font-body text-sm">{lang === "en" ? "Color" : "Color"}</Label>
          <Input value={color} onChange={(e) => setColor(e.target.value)}
            placeholder={lang === "en" ? "e.g. Deep red" : "Ej: Rojo intenso"} className="mt-1 font-body" />
        </div>
        <div>
          <Label className="font-body text-sm">{lang === "en" ? "Shape" : "Forma"}</Label>
          <Input value={shape} onChange={(e) => setShape(e.target.value)}
            placeholder={lang === "en" ? "e.g. Ribbed" : "Ej: Acostillado"} className="mt-1 font-body" />
        </div>
      </div>

      <div>
        <Label className="font-body text-sm">{lang === "en" ? "Size / Weight" : "Tamaño / Peso"}</Label>
        <Input value={sizeWeight} onChange={(e) => setSizeWeight(e.target.value)}
          placeholder={lang === "en" ? "e.g. 300–500g" : "Ej: 300–500g"} className="mt-1 font-body" />
      </div>

      <div>
        <Label className="font-body text-sm mb-2 block">{lang === "en" ? "Difficulty" : "Dificultad"}</Label>
        <div className="flex gap-1.5">
          {DIFFICULTY_OPTIONS.map(({ value, emoji }) => (
            <button key={value} onClick={() => setDifficulty(difficulty === value ? "" : value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-body border transition-colors ${difficulty === value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
              {emoji} {value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="font-body text-sm">Tags</Label>
        <div className="mt-1 flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border min-h-[44px] focus-within:border-primary transition-colors cursor-text">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-body">
              {tag}
              <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="opacity-60 hover:opacity-100 leading-none">×</button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => tagInput.trim() && addTag(tagInput)}
            placeholder={tags.length ? "" : (lang === "en" ? "tomate, red, heirloom..." : "tomate, rojo, reliquia...")}
            className="flex-1 min-w-[100px] text-xs font-body outline-none bg-transparent placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-[10px] text-muted-foreground font-body mt-1">
          {lang === "en" ? "Press Enter or comma to add each tag" : "Enter o coma para agregar cada tag"}
        </p>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1 font-body" onClick={() => setStep(1)}>{lang === "en" ? "← Back" : "← Atrás"}</Button>
        <Button variant="hero" className="flex-1 font-body" onClick={() => setStep(3)} disabled={!name.trim()}>{lang === "en" ? "Next →" : "Siguiente →"}</Button>
      </div>
    </div>
  );

  // ── Step 3: Experience ──
  return (
    <div className="space-y-3">
      <StepIndicator />
      <h3 className="font-display font-bold text-base">{lang === "en" ? "Your experience" : "Tu experiencia"}</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="font-body text-sm">{lang === "en" ? "Where do you grow it?" : "¿Dónde la cultivas?"}</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder={lang === "en" ? "e.g. Aconcagua Valley" : "Ej: Valle del Aconcagua"} className="mt-1 font-body" />
        </div>
        <div>
          <Label className="font-body text-sm">{lang === "en" ? "Years growing it" : "Años cultivándola"}</Label>
          <Input type="number" min="0" value={yearsCultivated} onChange={(e) => setYearsCultivated(e.target.value)}
            placeholder="5" className="mt-1 font-body" />
        </div>
      </div>

      <div>
        <Label className="font-body text-sm">{lang === "en" ? "Seed origin" : "Procedencia de la semilla"}</Label>
        <Input value={seedOrigin} onChange={(e) => setSeedOrigin(e.target.value)}
          placeholder={lang === "en" ? "e.g. Grandmother, seed swap, market..." : "Ej: Mi abuela, intercambio, feria..."} className="mt-1 font-body" />
      </div>

      <div>
        <Label className="font-body text-sm">{lang === "en" ? "Your personal experience" : "Tu experiencia personal"}</Label>
        <Textarea value={personalExperience} onChange={(e) => setPersonalExperience(e.target.value)}
          placeholder={lang === "en"
            ? "Flavor, uses, anecdotes, why you keep growing it..."
            : "¿Cómo es su sabor? ¿Para qué la usas? ¿Alguna anécdota? ¿Por qué la guardas?"}
          className="mt-1 font-body resize-none" rows={4} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1 font-body" onClick={() => setStep(2)}>{lang === "en" ? "← Back" : "← Atrás"}</Button>
        <Button variant="hero" className="flex-1 font-body" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
          {saving ? (lang === "en" ? "Saving..." : "Guardando...") : (lang === "en" ? "Submit sheet" : "Enviar ficha")}
        </Button>
      </div>
    </div>
  );
};

// ─── Rating Widget ────────────────────────────────────────────────────────────
const RatingWidget = ({
  varietyId, userId, lang, createdBy,
}: {
  varietyId: string; userId: string | null; lang: string; createdBy: string;
}) => {
  const { myRating, loading, refetch } = useMyRating(varietyId, userId);
  const [photoQ, setPhotoQ] = useState(0);
  const [detailQ, setDetailQ] = useState(0);
  const [storyQ, setStoryQ] = useState(0);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (!loading && !initialized) {
    setInitialized(true);
    if (myRating) {
      setPhotoQ(myRating.photo_quality ?? 0);
      setDetailQ(myRating.detail_quality ?? 0);
      setStoryQ(myRating.story_quality ?? 0);
    }
  }

  if (!userId || userId === createdBy) return null;

  const StarRow = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-body text-muted-foreground">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(value === n ? 0 : n)}>
            <Star className={`w-4 h-4 transition-colors ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
          </button>
        ))}
      </div>
    </div>
  );

  const handleRate = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await upsertRating({
      variety_id: varietyId,
      user_id: userId,
      photo_quality: photoQ || undefined,
      detail_quality: detailQ || undefined,
      story_quality: storyQ || undefined,
    });
    setSaving(false);
    if (!error) {
      toast.success(lang === "en" ? "Rating saved!" : "¡Valoración guardada!");
      refetch();
    }
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 border border-border">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
        {lang === "en" ? "Rate this variety sheet" : "Valorar esta ficha"}
      </p>
      <div className="space-y-2.5 mb-4">
        <StarRow
          label={lang === "en" ? "Photo quality" : "Calidad de fotos"}
          value={photoQ}
          onChange={setPhotoQ}
        />
        <StarRow
          label={lang === "en" ? "Variety detail" : "Detalle de la variedad"}
          value={detailQ}
          onChange={setDetailQ}
        />
        <StarRow
          label={lang === "en" ? "Personal story" : "Anécdota / experiencia"}
          value={storyQ}
          onChange={setStoryQ}
        />
      </div>
      <Button
        variant="outline" className="w-full font-body text-sm h-9"
        onClick={handleRate}
        disabled={saving || (!photoQ && !detailQ && !storyQ)}
      >
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
        {myRating
          ? (lang === "en" ? "Update rating" : "Actualizar valoración")
          : (lang === "en" ? "Submit rating" : "Enviar valoración")}
      </Button>
    </div>
  );
};

// ─── Edit Variety Form ────────────────────────────────────────────────────────
const EditVarietyForm = ({
  variety, userId, lang, onClose, onSaved,
}: {
  variety: Variety; userId: string; lang: string;
  onClose: () => void; onSaved: (updated: Variety) => void;
}) => {
  const [name, setName] = useState(variety.name);
  const [color, setColor] = useState(variety.color || "");
  const [shape, setShape] = useState(variety.shape || "");
  const [sizeWeight, setSizeWeight] = useState(variety.size_weight || "");
  const [difficulty, setDifficulty] = useState(variety.difficulty || "");
  const [personalExperience, setPersonalExperience] = useState(variety.personal_experience || "");
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([
    variety.image_url || null,
    variety.image_url_2 || null,
    variety.image_url_3 || null,
  ]);
  const [saving, setSaving] = useState(false);

  const photoRef1 = useRef<HTMLInputElement>(null);
  const photoRef2 = useRef<HTMLInputElement>(null);
  const photoRef3 = useRef<HTMLInputElement>(null);
  const photoRefs = [photoRef1, photoRef2, photoRef3];

  const handlePhotoChange = (i: number, file: File) => {
    setPhotos((prev) => { const n = [...prev]; n[i] = file; return n; });
    setPreviews((prev) => { const n = [...prev]; n[i] = URL.createObjectURL(file); return n; });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const urls: (string | null)[] = [
      variety.image_url || null,
      variety.image_url_2 || null,
      variety.image_url_3 || null,
    ];

    for (let i = 0; i < 3; i++) {
      if (photos[i]) {
        const url = await uploadVarietyPhoto(photos[i]!, userId, (i + 1) as 1 | 2 | 3);
        if (url) urls[i] = url;
        else toast.error(lang === "en" ? `Photo ${i + 1} failed to upload` : `Error subiendo foto ${i + 1}`);
      }
    }

    const { data, error } = await updateVariety(variety.id, {
      name: name.trim(),
      color: color || undefined,
      shape: shape || undefined,
      size_weight: sizeWeight || undefined,
      difficulty: difficulty || undefined,
      personal_experience: personalExperience || undefined,
      image_url: urls[0] || undefined,
      image_url_2: urls[1] || undefined,
      image_url_3: urls[2] || undefined,
    });

    setSaving(false);
    if (error) {
      console.error("updateVariety error:", error);
      toast.error(lang === "en" ? "Error saving" : "Error al guardar");
      return;
    }
    toast.success(lang === "en" ? "Updated!" : "¡Actualizada!");
    onSaved(data);
    onClose();
  };

  const slots = [
    { ref: photoRef1, label: lang === "en" ? "On the plant" : "En la mata" },
    { ref: photoRef2, label: lang === "en" ? "In hand" : "En la mano" },
    { ref: photoRef3, label: lang === "en" ? "Cross-section" : "Al corte" },
  ];

  return (
    <div className="space-y-4">
      {/* Fotos */}
      <div>
        <Label className="font-body text-sm mb-2 block">{lang === "en" ? "Photos" : "Fotos"}</Label>
        <div className="grid grid-cols-3 gap-2">
          {slots.map(({ ref, label }, i) => (
            <div
              key={i}
              onClick={() => ref.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-colors overflow-hidden"
            >
              <input ref={ref} type="file" accept="image/*" className="sr-only"
                onChange={(e) => e.target.files?.[0] && handlePhotoChange(i, e.target.files[0])} />
              {previews[i] ? (
                <img src={previews[i]!} className="w-full h-full object-cover" alt={label} />
              ) : (
                <div className="flex flex-col items-center gap-1 p-2 text-center">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                  <p className="text-[10px] font-body text-muted-foreground">{label}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nombre */}
      <div>
        <Label className="font-body text-sm">{lang === "en" ? "Variety name *" : "Nombre *"}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 font-body" />
      </div>

      {/* Color + Forma */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="font-body text-sm">{lang === "en" ? "Color" : "Color"}</Label>
          <Input value={color} onChange={(e) => setColor(e.target.value)} className="mt-1 font-body" />
        </div>
        <div>
          <Label className="font-body text-sm">{lang === "en" ? "Shape" : "Forma"}</Label>
          <Input value={shape} onChange={(e) => setShape(e.target.value)} className="mt-1 font-body" />
        </div>
      </div>

      {/* Tamaño + Dificultad */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="font-body text-sm">{lang === "en" ? "Size/Weight" : "Tamaño/Peso"}</Label>
          <Input value={sizeWeight} onChange={(e) => setSizeWeight(e.target.value)} className="mt-1 font-body" />
        </div>
        <div>
          <Label className="font-body text-sm mb-2 block">{lang === "en" ? "Difficulty" : "Dificultad"}</Label>
          <div className="flex gap-1 mt-1">
            {[{ value: "Fácil", emoji: "🟢" }, { value: "Media", emoji: "🟡" }, { value: "Avanzada", emoji: "🔴" }].map(({ value, emoji }) => (
              <button key={value} onClick={() => setDifficulty(difficulty === value ? "" : value)}
                className={`flex-1 py-1 rounded-lg text-xs font-body border transition-colors ${difficulty === value ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Experiencia */}
      <div>
        <Label className="font-body text-sm">{lang === "en" ? "Personal experience" : "Experiencia personal"}</Label>
        <Textarea value={personalExperience} onChange={(e) => setPersonalExperience(e.target.value)}
          className="mt-1 font-body resize-none" rows={3} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1 font-body" onClick={onClose}>{lang === "en" ? "Cancel" : "Cancelar"}</Button>
        <Button variant="hero" className="flex-1 font-body" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
          {lang === "en" ? "Save" : "Guardar"}
        </Button>
      </div>
    </div>
  );
};

// ─── Variety Detail Panel ─────────────────────────────────────────────────────
const VarietyDetail = ({
  variety, plant, userId, displayName, lang, onClose,
}: {
  variety: Variety; plant: Plant; userId: string | null;
  displayName: string; lang: string; onClose: () => void;
}) => {
  const { grows, loading } = useVarietyGrows(variety.id);
  const [showGrowForm, setShowGrowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentVariety, setCurrentVariety] = useState(variety);
  const [growsKey, setGrowsKey] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isOwner = userId === currentVariety.created_by;
  const photos = [currentVariety.image_url, currentVariety.image_url_2, currentVariety.image_url_3].filter(Boolean) as string[];

  const detailRows = [
    { key: "color",    label: { es: "Color", en: "Color" },             value: variety.color },
    { key: "shape",    label: { es: "Forma", en: "Shape" },             value: variety.shape },
    { key: "size",     label: { es: "Tamaño/Peso", en: "Size/Weight" }, value: variety.size_weight },
    { key: "loc",      label: { es: "Territorio", en: "Territory" },    value: variety.location },
    { key: "years",    label: { es: "Años cultivada", en: "Years grown" }, value: variety.years_cultivated ? `${variety.years_cultivated} años` : null },
    { key: "seed",     label: { es: "Semilla", en: "Seed origin" },     value: variety.seed_origin },
    { key: "diff",     label: { es: "Dificultad", en: "Difficulty" },   value: variety.difficulty },
  ].filter((r) => r.value);

  return (
    <div className="space-y-4">
      {/* Photo carousel */}
      {photos.length > 0 && (
        <div>
          <div
            className="aspect-video rounded-xl overflow-hidden bg-muted/20 cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
          >
            <img src={photos[photoIndex]} alt={variety.name} className="w-full h-full object-cover" />
          </div>
          {photos.length > 1 && (
            <div className="flex gap-1.5 mt-2 justify-center">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setPhotoIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === photoIndex ? "bg-primary" : "bg-border"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-4xl">{plant.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-display font-bold flex-1">{currentVariety.name}</h2>
            {isOwner && (
              <button
                onClick={() => setShowEditForm(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-body text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20"
              >
                <Pencil className="w-3 h-3" />
                {lang === "en" ? "Edit" : "Editar"}
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-body italic">
            {lang === "en" ? plant.name_en : plant.name} · {plant.scientificName}
          </p>
          {currentVariety.info_ratings_count > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-body text-muted-foreground">
                {currentVariety.info_score.toFixed(1)} · {currentVariety.info_ratings_count} {lang === "en" ? "ratings" : "valoraciones"}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {currentVariety.origin && <Badge variant="secondary" className="text-xs font-body">{currentVariety.origin}</Badge>}
            {currentVariety.days_to_harvest && (
              <Badge variant="outline" className="text-xs font-body gap-1">
                <Calendar className="w-3 h-3" />{currentVariety.days_to_harvest}d
              </Badge>
            )}
            {currentVariety.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs font-body">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Variety detail grid */}
      {detailRows.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border text-xs">
          {detailRows.map((r) => (
            <div key={r.key} className="flex gap-3 px-3 py-2.5">
              <span className="text-muted-foreground shrink-0 w-24">
                {lang === "en" ? r.label.en : r.label.es}
              </span>
              <span className="font-body text-foreground">{r.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Personal experience */}
      {currentVariety.personal_experience && (
        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            {lang === "en" ? "Personal experience" : "Experiencia personal"}
          </p>
          <p className="text-sm font-body leading-relaxed text-foreground italic">
            &ldquo;{currentVariety.personal_experience}&rdquo;
          </p>
        </div>
      )}

      {currentVariety.description && (
        <p className="text-sm text-muted-foreground font-body leading-relaxed bg-muted/40 rounded-lg p-3">{currentVariety.description}</p>
      )}

      {/* Diálogo de edición (solo para el creador) */}
      {isOwner && showEditForm && (
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {lang === "en" ? "Edit variety" : "Editar variedad"}
              </DialogTitle>
            </DialogHeader>
            <EditVarietyForm
              variety={currentVariety}
              userId={userId!}
              lang={lang}
              onClose={() => setShowEditForm(false)}
              onSaved={(updated) => {
                setCurrentVariety((prev) => ({ ...prev, ...updated }));
                setPhotoIndex(0);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* My grow CTA */}
      {userId && !showGrowForm && (
        <Button variant="hero" className="w-full font-body" onClick={() => setShowGrowForm(true)}>
          <Sprout className="w-4 h-4 mr-2" />
          {lang === "en" ? "Add my growing experience" : "Agregar mi experiencia de cultivo"}
        </Button>
      )}

      <AnimatePresence>
        {showGrowForm && userId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 rounded-xl p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{lang === "en" ? "My grow" : "Mi cultivo"}</h3>
              <button onClick={() => setShowGrowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <GrowForm
              varietyId={variety.id}
              userId={userId}
              displayName={displayName}
              lang={lang}
              onClose={() => setShowGrowForm(false)}
              onSaved={() => setGrowsKey((k) => k + 1)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community grows */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">
            {lang === "en" ? "Community experiences" : "Experiencias de la comunidad"}
            {grows.length > 0 && <span className="text-muted-foreground font-normal ml-1">({grows.length})</span>}
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : grows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground font-body text-sm">
            <Sprout className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {lang === "en" ? "No grows yet. Be the first!" : "Sin experiencias aún. ¡Sé el primero!"}
          </div>
        ) : (
          <div className="space-y-3" key={growsKey}>
            {grows.map((grow) => (
              <motion.div
                key={grow.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{statusEmoji[grow.status]}</span>
                    <div>
                      <p className="font-body font-medium text-sm">{grow.display_name ?? "Huertero/a"}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {statusLabel[grow.status]?.[lang as "es" | "en"] ?? grow.status}
                        {grow.season && ` · ${grow.season}`}
                        {grow.location_city && ` · ${grow.location_city}`}
                      </p>
                    </div>
                  </div>
                  {grow.rating && (
                    <div className="flex gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`w-3 h-3 ${n <= grow.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  )}
                </div>
                {grow.notes && <p className="text-xs text-muted-foreground font-body mt-2 leading-relaxed">{grow.notes}</p>}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Rate this variety sheet */}
      <RatingWidget
        varietyId={variety.id}
        userId={userId}
        lang={lang}
        createdBy={variety.created_by}
      />

      {/* Lightbox */}
      {lightboxOpen && createPortal(
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
          {photos.length > 1 && (
            <>
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                style={{ zIndex: 10000 }}
                onClick={(e) => { e.stopPropagation(); setPhotoIndex((p) => (p - 1 + photos.length) % photos.length); }}
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                style={{ zIndex: 10000 }}
                onClick={(e) => { e.stopPropagation(); setPhotoIndex((p) => (p + 1) % photos.length); }}
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          {/* Imagen */}
          <img
            src={photos[photoIndex]}
            alt={variety.name}
            className="max-w-full max-h-full object-contain select-none"
            style={{ padding: "3rem" }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Dots */}
          {photos.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  style={{ zIndex: 10000 }}
                  onClick={(e) => { e.stopPropagation(); setPhotoIndex(i); }}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${i === photoIndex ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Ficha Técnica ────────────────────────────────────────────────────────────
const FichaTecnica = ({ plant, lang }: { plant: Plant; lang: string }) => {
  const extra = plantExtra[plant.scientificName];
  const l = lang as "es" | "en";

  const rows: { icon: string; label: string; value: string | undefined }[] = [
    {
      icon: "🌍",
      label: l === "en" ? "Origin" : "Origen",
      value: l === "en" ? extra?.origin_en ?? extra?.origin : extra?.origin,
    },
    {
      icon: "🌡️",
      label: l === "en" ? "Temperature" : "Temperatura",
      value: plant.tempRange,
    },
    {
      icon: "🌱",
      label: l === "en" ? "Soil" : "Suelo",
      value: l === "en" ? extra?.soil_en ?? extra?.soil : extra?.soil,
    },
    {
      icon: "💧",
      label: l === "en" ? "Watering" : "Riego",
      value: l === "en" ? extra?.watering_en ?? extra?.watering : extra?.watering,
    },
    {
      icon: "☀️",
      label: l === "en" ? "Light (cold months)" : "Luz (meses fríos)",
      value: l === "en" ? plant.lightCold_en : plant.lightCold,
    },
    {
      icon: "☀️",
      label: l === "en" ? "Light (warm months)" : "Luz (meses cálidos)",
      value: l === "en" ? plant.lightWarm_en : plant.lightWarm,
    },
    {
      icon: "🔧",
      label: l === "en" ? "Infrastructure" : "Infraestructura",
      value: l === "en" ? extra?.infrastructure_en ?? extra?.infrastructure : extra?.infrastructure,
    },
    {
      icon: "🌎",
      label: l === "en" ? "Southern Hemisphere" : "Hemisferio Sur",
      value: extra?.months_south ? formatMonths(extra.months_south, l) : undefined,
    },
    {
      icon: "🌍",
      label: l === "en" ? "Northern Hemisphere" : "Hemisferio Norte",
      value: extra?.months_north ? formatMonths(extra.months_north, l) : undefined,
    },
    {
      icon: "⚡",
      label: l === "en" ? "Difficulty" : "Dificultad",
      value: l === "en" ? plant.difficulty_en : plant.difficulty,
    },
    {
      icon: "🌱",
      label: l === "en" ? "Start seedlings" : "Inicio almácigo",
      value: l === "en" ? extra?.seedling_start_en ?? extra?.seedling_start : extra?.seedling_start,
    },
    {
      icon: "📐",
      label: l === "en" ? "Spacing" : "Espaciado",
      value: l === "en" ? extra?.spacing_en ?? extra?.spacing : extra?.spacing,
    },
    {
      icon: "🤝",
      label: l === "en" ? "Companion plants" : "Asociaciones",
      value: l === "en" ? extra?.companions_en ?? extra?.companions : extra?.companions,
    },
  ].filter((r) => r.value && r.value !== "—");

  const description = l === "en" ? plant.description_en : plant.description;
  const tip = l === "en" ? plant.tip_en : plant.tip;

  return (
    <div className="mb-4 bg-muted/30 rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2 bg-muted/50 border-b border-border">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {l === "en" ? "Official Technical Sheet" : "Ficha Técnica Oficial"}
        </p>
      </div>
      <div className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-3 px-4 py-2.5">
            <span className="text-sm shrink-0 w-5">{r.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
                {r.label}
              </p>
              <p className="text-xs font-body text-foreground leading-snug">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
      {description && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {l === "en" ? "Description" : "Descripción"}
          </p>
          <p className="text-xs font-body text-muted-foreground leading-relaxed">{description}</p>
        </div>
      )}
      {tip && (
        <div className="px-4 py-2.5 border-t border-border bg-primary/5">
          <p className="text-xs font-body text-foreground leading-relaxed">
            💡 {tip}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Plant Card ────────────────────────────────────────────────────────────────
const PlantCard = ({
  plant, isExpanded, onToggle, lang, userId, displayName, autoOpenVarietyId,
}: {
  plant: Plant; isExpanded: boolean; onToggle: () => void;
  lang: string; userId: string | null; displayName: string;
  autoOpenVarietyId?: string | null;
}) => {
  const { varieties, loading, refetch } = useVarieties(isExpanded ? plant.scientificName : null);
  const [selectedVariety, setSelectedVariety] = useState<Variety | null>(null);
  const [showAddVariety, setShowAddVariety] = useState(false);
  const displayPlantName = lang === "en" ? plant.name_en : plant.name;

  // Auto-abrir la variedad específica cuando llega desde el feed
  useEffect(() => {
    if (!autoOpenVarietyId || varieties.length === 0 || selectedVariety) return;
    const v = varieties.find((v) => v.id === autoOpenVarietyId);
    if (v) setSelectedVariety(v);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenVarietyId, varieties]);

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
        onClick={onToggle}
      >
        <span className="text-2xl w-8 shrink-0">{plant.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold">{displayPlantName}</p>
          <p className="text-xs text-muted-foreground font-body italic">{plant.scientificName}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-3">
              <FichaTecnica plant={plant} lang={lang} />

              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : (
                <>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    {lang === "en" ? "Community varieties" : "Variedades de la comunidad"}
                    {varieties.length > 0 && ` (${varieties.length})`}
                  </p>
                  <div className="space-y-2 mb-3">
                    {varieties.length === 0 && (
                      <p className="text-xs text-muted-foreground font-body text-center py-3">
                        {lang === "en" ? "No varieties yet — add the first one!" : "Sin variedades aún — ¡agrega la primera!"}
                      </p>
                    )}
                    {varieties.map((v) => (
                      <button
                        key={v.id}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors text-left border border-transparent hover:border-border"
                        onClick={() => setSelectedVariety(v)}
                      >
                        <Leaf className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-body font-medium text-sm">{v.name}</span>
                          {v.origin && <span className="text-xs text-muted-foreground font-body ml-2">· {v.origin}</span>}
                        </div>
                        {v.grows_count ? (
                          <span className="text-xs text-muted-foreground font-body flex items-center gap-1 shrink-0">
                            <Users className="w-3 h-3" />{v.grows_count}
                          </span>
                        ) : null}
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>

                  {userId && (
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs text-primary font-body font-medium rounded-lg hover:bg-primary/5 transition-colors border border-dashed border-primary/40"
                      onClick={() => setShowAddVariety(true)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {lang === "en" ? `Add variety of ${displayPlantName}` : `Agregar variedad de ${displayPlantName}`}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!selectedVariety} onOpenChange={() => setSelectedVariety(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{selectedVariety?.name}</DialogTitle>
          </DialogHeader>
          {selectedVariety && (
            <VarietyDetail
              variety={selectedVariety}
              plant={plant}
              userId={userId}
              displayName={displayName}
              lang={lang}
              onClose={() => setSelectedVariety(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddVariety} onOpenChange={setShowAddVariety}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {lang === "en" ? `New variety of ${displayPlantName}` : `Nueva variedad de ${displayPlantName}`}
            </DialogTitle>
          </DialogHeader>
          {userId && (
            <AddVarietyForm
              plant={plant}
              userId={userId}
              lang={lang}
              onClose={() => setShowAddVariety(false)}
              onSaved={refetch}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── SemilleroPage ─────────────────────────────────────────────────────────────
const SemilleroPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { lang } = useLanguage();
  const location = useLocation();
  const navState = (location.state as any) || {};

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PlantCategory | "all">("all");
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(navState.tab || "catalog");

  // Variedad a auto-abrir desde el feed
  const targetVarietyId: string | null = navState.openVariety ?? null;
  const targetPlantName: string | null = navState.plantName ?? null;
  const [catalogAutoOpenDone, setCatalogAutoOpenDone] = useState(false);

  // Native plants state
  const { plants: nativePlants, loading: nativeLoading, error: nativeError, fetchDescription } = useNativePlants();
  const { savedIds: savedNativeIds, toggle: toggleNative } = useNativeHerbario();
  const [nativeCategory, setNativeCategory] = useState<string>("all");
  const [selectedNative, setSelectedNative] = useState<NativePlant | null>(null);
  const [nativeDesc, setNativeDesc] = useState<string | null>(null);
  const [nativeDescLoading, setNativeDescLoading] = useState(false);
  const [autoOpenDone, setAutoOpenDone] = useState(false);
  const featuredTaxonId: number | null = navState.openPlant ?? null;

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "Huertero/a";

  // Recent community varieties for the featured strip
  const [recentVarieties, setRecentVarieties] = useState<Variety[]>([]);
  useEffect(() => {
    (supabase as any)
      .from("plant_varieties")
      .select("id, name, plant_scientific_name, image_url")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }: { data: Variety[] | null }) => setRecentVarieties(data || []));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return plants.filter((p) => {
      const matchesCategory = category === "all" || p.category === category;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.description_en?.toLowerCase().includes(q) ?? false) ||
        p.tip.toLowerCase().includes(q) ||
        p.tip_en.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  const activeCategories = useMemo(() => {
    const used = new Set(plants.map((p) => p.category));
    return CATEGORIES.filter((c) => c.value === "all" || used.has(c.value as PlantCategory));
  }, []);

  const nativeCategories = useMemo(() => {
    const cats = new Set(nativePlants.map((p) => p.category));
    return Array.from(cats).sort();
  }, [nativePlants]);

  const filteredNative = useMemo(() => {
    let result = nativePlants;
    if (nativeCategory !== "all") result = result.filter((p) => p.category === nativeCategory);
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

  // Fetch description when a native plant is selected
  const handleSelectNative = async (plant: NativePlant) => {
    setSelectedNative(plant);
    const cached = lang === "en" ? plant.description_en : plant.description;
    if (cached) { setNativeDesc(cached); return; }
    setNativeDescLoading(true);
    setNativeDesc(null);
    const result = await fetchDescription(plant);
    setNativeDesc(lang === "en" ? result.description_en : result.description);
    setNativeDescLoading(false);
  };

  // Auto-expandir la planta del catálogo cuando viene desde el feed o desde VariedadesPage
  useEffect(() => {
    if (catalogAutoOpenDone) return;
    const plantToExpand = targetPlantName || navState.expandPlant || null;
    if (!plantToExpand) return;
    setExpandedName(plantToExpand);
    setCatalogAutoOpenDone(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPlantName, navState.expandPlant]);

  // Marca la planta del feed como "vista" (sin auto-abrir diálogo — se muestra como hero card)
  useEffect(() => {
    if (autoOpenDone || !featuredTaxonId || nativePlants.length === 0) return;
    const plant = nativePlants.find((p) => p.taxon_id === featuredTaxonId);
    if (plant) setAutoOpenDone(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTaxonId, nativePlants, autoOpenDone]);

  const toggleExpand = (name: string) =>
    setExpandedName((prev) => (prev === name ? null : name));

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">
              {lang === "en" ? "Seed Library" : "Semillero"}
            </h1>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Search — shared across tabs */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === "native"
                ? (lang === "en" ? "Search native plants..." : "Buscar plantas nativas...")
                : (lang === "en" ? "Search plants..." : "Buscar plantas...")
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 font-body"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="catalog" className="font-body">
              <Leaf className="w-4 h-4 mr-2" />
              {lang === "en" ? "Catalog" : "Catálogo"}
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

          {/* ── Catalog tab ── */}
          <TabsContent value="catalog">
            <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">
              {lang === "en"
                ? "Explore the plant catalog, discover community varieties, and add your own growing experience."
                : "Explora el catálogo, descubre variedades de la comunidad y agrega tu experiencia de cultivo."}
            </p>

            {/* ── Variedades destacadas ── */}
            {recentVarieties.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  {lang === "en" ? "Community varieties" : "Variedades de la comunidad"}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {recentVarieties.map((v) => {
                    const plant = plants.find((p) => p.scientificName === v.plant_scientific_name);
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setCategory("all");
                          setSearch("");
                          setExpandedName(v.plant_scientific_name);
                        }}
                        className="shrink-0 w-28 bg-card rounded-xl border border-border overflow-hidden text-left hover:border-primary/60 transition-colors"
                      >
                        <div className="h-16 bg-muted overflow-hidden flex items-center justify-center">
                          {v.image_url ? (
                            <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{(plant as any)?.emoji ?? "🌱"}</span>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-[11px] font-body font-semibold leading-tight truncate">{v.name}</p>
                          <p className="text-[10px] text-muted-foreground font-body truncate">
                            {plant ? (lang === "en" ? plant.name_en : plant.name) : v.plant_scientific_name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
              {activeCategories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors border ${
                    category === c.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {lang === "en" ? c.label.en : c.label.es}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground font-body mb-4">
              {filtered.length} {lang === "en" ? "plants" : "plantas"}
            </p>

            <div className="space-y-3">
              {filtered.map((plant) => (
                <motion.div
                  key={plant.scientificName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <PlantCard
                    plant={plant}
                    isExpanded={expandedName === plant.scientificName}
                    onToggle={() => toggleExpand(plant.scientificName)}
                    lang={lang}
                    userId={user?.id ?? null}
                    displayName={displayName}
                    autoOpenVarietyId={
                      targetPlantName === plant.scientificName ? targetVarietyId : null
                    }
                  />
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground font-body text-sm">
                    {lang === "en" ? "No plants found." : "No se encontraron plantas."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Native plants tab ── */}
          <TabsContent value="native">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold">
                {lang === "en" ? "Native Plants Near You" : "Plantas nativas de tu región"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground font-body mb-4">
              {lang === "en"
                ? "Species native to your area, sourced from iNaturalist observations."
                : "Especies nativas de tu zona, basadas en observaciones de iNaturalist."}
            </p>

            {nativeLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground font-body">
                  {lang === "en" ? "Loading native plants..." : "Cargando plantas nativas..."}
                </p>
              </div>
            ) : nativeError ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground font-body text-sm">
                  {lang === "en" ? "Error loading native plants." : "Error al cargar plantas nativas."}
                </p>
              </div>
            ) : nativePlants.length === 0 ? (
              <div className="text-center py-20">
                <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground font-body text-sm mb-4">
                  {lang === "en"
                    ? "Set your location in your profile to see native plants."
                    : "Configura tu ubicación en el perfil para ver plantas nativas."}
                </p>
                <Button variant="outline" asChild>
                  <Link to="/perfil">{lang === "en" ? "Go to Profile" : "Ir a Perfil"}</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* ── Planta del día (viene del feed) ── */}
                {featuredTaxonId && (() => {
                  const fp = nativePlants.find((p) => p.taxon_id === featuredTaxonId);
                  if (!fp) return null;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-5 rounded-2xl overflow-hidden relative cursor-pointer"
                      style={{ height: "200px" }}
                      onClick={() => handleSelectNative(fp)}
                    >
                      {fp.image_url ? (
                        <img
                          src={fp.image_url}
                          alt={getNativeName(fp)}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-green-50 flex items-center justify-center">
                          <span className="text-7xl opacity-30">{categoryEmoji[fp.category] || "🌿"}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 text-[9px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-700/90 text-white">
                          <TreePine className="w-2.5 h-2.5" />
                          {lang === "en" ? "Today's native plant" : "Planta nativa de hoy"}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-display font-bold text-white text-lg leading-tight capitalize">
                          {getNativeName(fp)}
                        </h3>
                        <p className="font-body text-white/70 text-xs italic mt-0.5">{fp.scientific_name}</p>
                        <p className="font-body text-white/60 text-[10px] mt-1.5 uppercase tracking-wider">
                          {lang === "en" ? "Tap to discover →" : "Toca para descubrir →"}
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}

                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setNativeCategory("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors border ${nativeCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary"}`}
                  >
                    {lang === "en" ? "All" : "Todas"}
                  </button>
                  {nativeCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNativeCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors border ${nativeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary"}`}
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
                      onClick={() => handleSelectNative(plant)}
                    >
                      <div className="bg-white rounded-sm shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden">
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
                        <div className="bg-white px-2 pt-1.5 pb-2 border-t border-gray-100">
                          <p className="text-[8px] font-body text-gray-400 tracking-widest uppercase mb-0.5">MULCHII®</p>
                          <h3 className="font-display font-bold text-sm leading-tight text-gray-900 capitalize">{getNativeName(plant)}</h3>
                          <p className="text-[9px] text-gray-400 font-body italic mt-0.5 truncate">{plant.scientific_name}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredNative.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground font-body text-sm">
                      {lang === "en" ? "No species found." : "No se encontraron especies."}
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Native plant detail dialog */}
      <Dialog open={!!selectedNative} onOpenChange={(open) => { if (!open) { setSelectedNative(null); setNativeDesc(null); } }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{selectedNative ? getNativeName(selectedNative) : ""}</DialogTitle>
          </DialogHeader>
          {selectedNative && (
            <div className="space-y-4">
              {selectedNative.image_url && (
                <div className="aspect-video rounded-xl overflow-hidden">
                  <img src={selectedNative.image_url} alt={getNativeName(selectedNative)} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-display font-bold capitalize">{getNativeName(selectedNative)}</h2>
                <p className="text-sm text-muted-foreground font-body italic">{selectedNative.scientific_name}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs font-body">
                    {categoryEmoji[selectedNative.category] || "🍃"} {getCategoryLabel(selectedNative.category)}
                  </Badge>
                  {selectedNative.observation_count > 0 && (
                    <Badge variant="outline" className="text-xs font-body">
                      {selectedNative.observation_count} {lang === "en" ? "obs." : "obs."}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant={savedNativeIds.has(String(selectedNative.taxon_id)) ? "default" : "outline"}
                size="sm"
                className="w-full gap-2"
                onClick={() => toggleNative(String(selectedNative.taxon_id), {
                  common_name: selectedNative.common_name,
                  common_name_en: selectedNative.common_name_en,
                  scientific_name: selectedNative.scientific_name,
                  category: selectedNative.category,
                  image_url: selectedNative.image_url,
                })}
              >
                {savedNativeIds.has(String(selectedNative.taxon_id)) ? (
                  <><BookmarkCheck className="w-4 h-4" /> {lang === "en" ? "In my collection" : "En mi colección"}</>
                ) : (
                  <><Bookmark className="w-4 h-4" /> {lang === "en" ? "Add to my plants" : "Agregar a mis plantas"}</>
                )}
              </Button>
              {nativeDescLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {lang === "en" ? "Loading description..." : "Cargando descripción..."}
                </div>
              ) : nativeDesc ? (
                <p className="text-sm text-muted-foreground font-body leading-relaxed bg-muted/40 rounded-lg p-3">{nativeDesc}</p>
              ) : null}
              <div className="flex gap-2">
                {selectedNative.inat_url && (
                  <a
                    href={selectedNative.inat_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary font-body hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    iNaturalist
                  </a>
                )}
                {selectedNative.wikipedia_url && (
                  <a
                    href={selectedNative.wikipedia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary font-body hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Wikipedia
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SemilleroPage;
