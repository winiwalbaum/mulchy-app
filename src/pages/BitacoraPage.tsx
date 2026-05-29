import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Leaf, Plus, Trash2, StickyNote, Camera, ImagePlus, X, Loader2, Share2,
  CalendarDays, Sprout, Moon, LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useCommunity } from "@/hooks/useCommunity";
import { compressImage } from "@/lib/imageUtils";
import { toast } from "sonner";
import { gardenTasks } from "@/data/gardenTasks";
import { getCurrentLunarPeriod } from "@/data/lunarCalendar";
import { format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────

interface JournalEntry {
  id: string;
  text: string;
  image_url: string | null;
  color: string;
  created_at: string;
}

// ─── Small magazine card (local) ──────────────────────────────

interface SmallCardProps {
  to?: string;
  onClick?: () => void;
  image?: string | null;
  bgClass: string;
  emojiBg?: string;
  categoryLabel: string;
  categoryClass: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  delay?: number;
}

const SmallCard = ({
  to,
  onClick,
  image,
  bgClass,
  emojiBg,
  categoryLabel,
  categoryClass,
  icon: Icon,
  title,
  subtitle,
  delay = 0,
}: SmallCardProps) => {
  const inner = (
    <>
      {image ? (
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className={`absolute inset-0 ${bgClass} flex items-center justify-center`}>
          {emojiBg && (
            <span className="text-5xl opacity-20 select-none">{emojiBg}</span>
          )}
        </div>
      )}
      {image && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      )}
      <div className="absolute top-2 left-2">
        <span className={`inline-flex items-center gap-1 text-[9px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryClass}`}>
          <Icon className="w-2.5 h-2.5" />
          {categoryLabel}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className={`font-display font-bold text-sm leading-snug line-clamp-2 ${image ? "text-white" : "text-foreground"}`}>
          {title}
        </p>
        {subtitle && (
          <p className={`font-body text-xs mt-0.5 line-clamp-1 ${image ? "text-white/70" : "text-muted-foreground"}`}>
            {subtitle}
          </p>
        )}
      </div>
    </>
  );

  const cls = "absolute inset-0 block group cursor-pointer";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl overflow-hidden relative"
      style={{ height: "148px" }}
    >
      {to ? (
        <Link to={to} className={cls}>{inner}</Link>
      ) : (
        <div onClick={onClick} className={cls}>{inner}</div>
      )}
    </motion.div>
  );
};

// ─── Pantone journal card ─────────────────────────────────────

const stickerColors = [
  "bg-leaf-light/30 border-leaf/30",
  "bg-accent/15 border-accent/30",
  "bg-secondary border-earth-light/20",
  "bg-rose-old/15 border-rose-old/30",
];

// ─── Page ─────────────────────────────────────────────────────

const BitacoraPage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const b = t.bitacora as any;

  // Journal state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newNote, setNewNote] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shareEntry, setShareEntry] = useState<JournalEntry | null>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [sharing, setSharing] = useState(false);
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);
  const [savedPosts, setSavedPosts] = useState<any[]>(() => {
    try {
      const data = JSON.parse(localStorage.getItem("mulchii-saved-posts") || "{}");
      return Object.values(data).sort(
        (a: any, bv: any) => new Date(bv.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch { return []; }
  });
  const [myVarietiesCount, setMyVarietiesCount] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const entriesRef = useRef<HTMLDivElement>(null);
  const { createPost } = useCommunity("all");

  // ── Magazine card data ────────────────────────────────────
  const month = new Date().getMonth() + 1;
  const monthTasks = gardenTasks.filter((t) => t.months.includes(month));
  const seasonTask = monthTasks.length > 0 ? monthTasks[0] : null;
  const currentLunar = getCurrentLunarPeriod();

  const es = (spa: string, en: string) => (lang === "en" ? en : spa);
  const dateLocale = lang === "en" ? enUS : esLocale;
  const today = format(new Date(), lang === "en" ? "EEEE, MMM d" : "EEEE d 'de' MMM", { locale: dateLocale });

  // ── Fetch journal entries ─────────────────────────────────
  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setEntries(data);
    setLoading(false);
  }, [user]);

  // ── Fetch my varieties count ──────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from("varieties")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setMyVarietiesCount(count || 0));
  }, [user?.id]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // ── Photo handling ────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearPhoto = () => { setPhotoFile(null); setPhotoPreview(null); };

  // ── Add entry ─────────────────────────────────────────────
  const addEntry = async (mode: "private" | "community" = "private") => {
    if (!newNote.trim() && !photoFile) return;
    if (!user) return;
    setUploading(true);
    try {
      let imageUrl: string | null = null;
      if (photoFile) {
        const compressed = await compressImage(photoFile, { maxDimension: 1200, quality: 0.82 });
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("journal-images")
          .upload(path, compressed, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("journal-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const color = stickerColors[Math.floor(Math.random() * stickerColors.length)];
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({ user_id: user.id, text: newNote.trim(), image_url: imageUrl, color })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setEntries((prev) => [data, ...prev]);
        if (mode === "community") { setShareEntry(data); setShareTitle(""); }
      }
      setNewNote("");
      clearPhoto();
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setUploading(false);
    }
  };

  // ── Share to community ────────────────────────────────────
  const handleShare = async () => {
    if (!shareEntry || !shareTitle.trim()) return;
    setSharing(true);
    const error = await createPost({
      type: "photo",
      title: shareTitle.trim(),
      body: shareEntry.text || "",
      image_url: shareEntry.image_url || undefined,
    });
    setSharing(false);
    if (!error) { toast.success(b.shareSuccess); setShareEntry(null); setShareTitle(""); }
    else toast.error(b.shareError);
  };

  // ── Delete entry ──────────────────────────────────────────
  const removeEntry = async (entry: JournalEntry) => {
    if (entry.image_url) {
      const pathMatch = entry.image_url.match(/journal-images\/(.+)$/);
      if (pathMatch) await supabase.storage.from("journal-images").remove([pathMatch[1]]);
    }
    const { error } = await supabase.from("journal_entries").delete().eq("id", entry.id);
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  };

  const latestEntryWithImage = useMemo(
    () => entries.find((e) => e.image_url) || null,
    [entries]
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHII" />
              <span className="font-display font-bold text-lg">{b.title}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-body capitalize">{today}</p>
              {profile?.city && (
                <p className="text-xs font-body text-primary">{profile.city}</p>
              )}
            </div>
          </div>
          <p className="text-[10px] font-body text-muted-foreground mt-0.5 uppercase tracking-widest">
            {es("Tu huerto, mes a mes", "Your garden, month by month")}
          </p>
        </div>
      </header>

      <div className="px-4 pt-5 max-w-lg mx-auto">

        {/* ── Magazine cards ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">

          {/* Tarea del mes */}
          {seasonTask ? (
            <SmallCard
              to="/tareas"
              bgClass="bg-gradient-to-br from-violet-100/80 to-purple-50"
              emojiBg={seasonTask.emoji}
              categoryLabel={es("Tarea del mes", "Monthly task")}
              categoryClass="bg-violet-600/90 text-white"
              icon={CalendarDays}
              title={`${seasonTask.emoji} ${lang === "en" ? seasonTask.title_en || seasonTask.title : seasonTask.title}`}
              subtitle={es("Ver calendario completo", "See full calendar")}
              delay={0.05}
            />
          ) : (
            <SmallCard
              to="/tareas"
              bgClass="bg-gradient-to-br from-violet-100/80 to-purple-50"
              emojiBg="📅"
              categoryLabel={es("Calendario", "Calendar")}
              categoryClass="bg-violet-600/90 text-white"
              icon={CalendarDays}
              title={es("Ver tareas de temporada", "See seasonal tasks")}
              delay={0.05}
            />
          )}

          {/* Mi bitácora */}
          <SmallCard
            onClick={() => entriesRef.current?.scrollIntoView({ behavior: "smooth" })}
            image={latestEntryWithImage?.image_url}
            bgClass="bg-gradient-to-br from-secondary/80 to-muted"
            emojiBg="📓"
            categoryLabel={es("Mi bitácora", "My journal")}
            categoryClass="bg-primary/90 text-primary-foreground"
            icon={StickyNote}
            title={
              entries.length > 0
                ? es(`${entries.length} entrada${entries.length !== 1 ? "s" : ""}`, `${entries.length} entr${entries.length !== 1 ? "ies" : "y"}`)
                : es("Sin entradas aún", "No entries yet")
            }
            subtitle={
              entries[0]
                ? new Date(entries[0].created_at).toLocaleDateString(
                    lang === "en" ? "en-US" : "es-CL",
                    { day: "numeric", month: "short" }
                  )
                : es("Empieza a registrar", "Start recording")
            }
            delay={0.1}
          />

          {/* Luna del mes */}
          {currentLunar ? (
            <SmallCard
              to="/tareas"
              bgClass="bg-gradient-to-br from-indigo-950 to-slate-800"
              emojiBg={currentLunar.emoji}
              categoryLabel={es("Luna", "Moon")}
              categoryClass="bg-indigo-400/80 text-white"
              icon={Moon}
              title={`${currentLunar.emoji} ${lang === "en" ? currentLunar.label_en : currentLunar.label}`}
              subtitle={lang === "en" ? currentLunar.recommendation_en : currentLunar.recommendation}
              delay={0.15}
            />
          ) : (
            <SmallCard
              to="/tareas"
              bgClass="bg-gradient-to-br from-indigo-950 to-slate-800"
              emojiBg="🌙"
              categoryLabel={es("Luna", "Moon")}
              categoryClass="bg-indigo-400/80 text-white"
              icon={Moon}
              title={es("Fases lunares", "Lunar phases")}
              delay={0.15}
            />
          )}

          {/* Mis plantas cultivadas */}
          <SmallCard
            to="/variedades"
            bgClass="bg-gradient-to-br from-primary/15 to-leaf-light/40"
            emojiBg="🌱"
            categoryLabel={es("Mis plantas", "My plants")}
            categoryClass="bg-primary/90 text-primary-foreground"
            icon={Sprout}
            title={
              myVarietiesCount > 0
                ? es(`${myVarietiesCount} variedad${myVarietiesCount !== 1 ? "es" : ""} registrada${myVarietiesCount !== 1 ? "s" : ""}`, `${myVarietiesCount} variet${myVarietiesCount !== 1 ? "ies" : "y"} registered`)
                : es("Agrega tus variedades", "Add your varieties")
            }
            subtitle={es("Ver semillero →", "See seed bank →")}
            delay={0.2}
          />
        </div>

        {/* ── Nueva entrada ── */}
        <div ref={entriesRef}>
          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-widest mb-3">
            {es("Mis notas y fotos", "My notes & photos")}
          </p>

          <div className="dot-grid rounded-2xl border border-border p-5 mb-5 min-h-[160px]">
            <div className="flex items-start gap-3">
              <StickyNote className="w-5 h-5 text-earth-light shrink-0 mt-1" />
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={b.placeholder}
                  className="w-full bg-transparent resize-none font-body text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[64px]"
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addEntry(); }}
                />

                {photoPreview && (
                  <div className="relative mt-2 inline-block">
                    <img src={photoPreview} alt="Preview" className="w-28 h-28 object-cover rounded-xl border border-border" />
                    <button
                      onClick={clearPhoto}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                  <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} className="gap-1.5" disabled={uploading}>
                    <Camera className="w-4 h-4" />
                    {b.takePhoto}
                  </Button>

                  <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <Button variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()} className="gap-1.5" disabled={uploading}>
                    <ImagePlus className="w-4 h-4" />
                    {b.choosePhoto}
                  </Button>

                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm" onClick={() => addEntry("private")} disabled={(!newNote.trim() && !photoFile) || uploading} className="gap-1">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {b.onlyForMe}
                    </Button>

                    <Button variant="default" size="sm" onClick={() => addEntry("community")} disabled={(!newNote.trim() && !photoFile) || uploading} className="gap-1">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                      {b.forCommunity}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Entries grid ── */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  className="group"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.5) }}
                >
                  <div className="bg-white rounded-sm shadow-card hover:shadow-elevated transition-shadow border border-gray-200 overflow-hidden">
                    {/* Área clickeable → abre la entrada */}
                    <button className="w-full text-left" onClick={() => setViewEntry(entry)}>
                      <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-leaf-light/30 via-leaf-light/10 to-cream flex items-center justify-center">
                        {entry.image_url ? (
                          <img src={entry.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        ) : (
                          <span className="text-5xl select-none">🌱</span>
                        )}
                      </div>
                      <div className="bg-white px-2 pt-1.5 pb-1 border-t border-gray-100">
                        <p className="text-[8px] font-body text-gray-400 tracking-widest uppercase mb-0.5">MULCHII®</p>
                        {entry.text && <p className="font-body text-[10px] leading-relaxed line-clamp-3 text-gray-800 mb-0.5">{entry.text}</p>}
                        <p className="text-[8px] text-gray-400 font-body">
                          {new Date(entry.created_at).toLocaleDateString(lang === "en" ? "en-US" : "es-CL", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </button>
                    {/* Acciones rápidas */}
                    <div className="flex items-center gap-1 px-2 pb-2 pt-0.5 bg-white">
                      <button onClick={() => { setShareEntry(entry); setShareTitle(""); }} className="flex items-center gap-1 text-[10px] font-body text-gray-400 hover:text-primary transition-colors" title={b.shareToComm}>
                        <Share2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeEntry(entry)} className="flex items-center gap-1 text-[10px] font-body text-gray-400 hover:text-destructive transition-colors ml-auto">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="text-center py-16">
              <Leaf className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-body">{b.empty}</p>
            </div>
          )}

          {/* ── Saved community posts ── */}
          {savedPosts.length > 0 && (
            <div className="mt-8 pb-4">
              <p className="text-[10px] font-body text-muted-foreground uppercase tracking-widest mb-3">
                🔖 {b.savedFromCommunity}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {savedPosts.map((post: any) => (
                  <div key={post.id} className="group">
                    <div className="bg-white rounded-sm shadow-card hover:shadow-elevated transition-shadow border border-gray-200 overflow-hidden">
                      <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-leaf-light/30 via-leaf-light/10 to-cream flex items-center justify-center">
                        {post.image_url ? (
                          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        ) : (
                          <span className="text-5xl select-none">🔖</span>
                        )}
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              const current = JSON.parse(localStorage.getItem("mulchii-saved-posts") || "{}");
                              delete current[post.id];
                              localStorage.setItem("mulchii-saved-posts", JSON.stringify(current));
                              setSavedPosts((prev) => prev.filter((p: any) => p.id !== post.id));
                            }}
                            className="w-6 h-6 rounded bg-white/85 flex items-center justify-center text-gray-600 hover:text-destructive shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-white px-2 pt-1.5 pb-2 border-t border-gray-100">
                        <p className="text-[8px] font-body text-gray-400 tracking-widest uppercase mb-0.5">MULCHII®</p>
                        <h3 className="font-display font-bold text-sm leading-tight text-gray-900 line-clamp-2 mb-0.5">{post.title}</h3>
                        {post.body && <p className="text-[9px] text-gray-500 font-body leading-relaxed line-clamp-2 mb-0.5">{post.body}</p>}
                        <p className="text-[9px] text-gray-400 font-body truncate">{post.display_name}{post.city && ` · ${post.city}`}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Share dialog ── */}
      <Dialog open={!!shareEntry} onOpenChange={(open) => !open && setShareEntry(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{b.shareDialogTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body">{b.shareDialogDesc}</p>
          {shareEntry?.image_url && <img src={shareEntry.image_url} alt="" className="w-full rounded-xl object-cover max-h-48" />}
          {shareEntry?.text && <p className="text-sm font-body bg-muted rounded-lg p-3 line-clamp-3">{shareEntry.text}</p>}
          <div className="space-y-1">
            <label className="text-sm font-medium">{b.shareTitleLabel}</label>
            <Input value={shareTitle} onChange={(e) => setShareTitle(e.target.value)} placeholder={b.shareTitlePlaceholder} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setShareEntry(null)}>{b.shareCancel}</Button>
            <Button onClick={handleShare} disabled={!shareTitle.trim() || sharing} className="gap-1.5">
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              {b.shareConfirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Vista de entrada ── */}
      <Dialog open={!!viewEntry} onOpenChange={(open) => !open && setViewEntry(null)}>
        <DialogContent className="sm:max-w-lg p-0 max-h-[92vh] flex flex-col overflow-hidden gap-0">
          {viewEntry?.image_url && (
            <div className="w-full bg-black flex items-center justify-center shrink-0" style={{ maxHeight: "55vh" }}>
              <img
                src={viewEntry.image_url}
                alt=""
                className="w-full h-auto object-contain"
                style={{ maxHeight: "55vh" }}
              />
            </div>
          )}
          <div className="px-5 py-4 flex-1 overflow-y-auto">
            {viewEntry?.text && (
              <p className="font-body text-base text-foreground leading-relaxed mb-3">{viewEntry.text}</p>
            )}
            <p className="text-xs text-muted-foreground font-body">
              {viewEntry && new Date(viewEntry.created_at).toLocaleDateString(
                lang === "en" ? "en-US" : "es-CL",
                { weekday: "long", day: "numeric", month: "long", year: "numeric" }
              )}
            </p>
          </div>
          <div className="flex gap-2 px-5 py-3 border-t border-border shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { if (viewEntry) { setShareEntry(viewEntry); setShareTitle(""); setViewEntry(null); } }}>
              <Share2 className="w-4 h-4" />
              {b.shareToComm}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive ml-auto" onClick={() => { if (viewEntry) { removeEntry(viewEntry); setViewEntry(null); } }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BitacoraPage;
