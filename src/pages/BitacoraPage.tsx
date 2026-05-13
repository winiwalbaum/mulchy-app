import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Leaf, Plus, Trash2, StickyNote, Camera, ImagePlus, X, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCommunity } from "@/hooks/useCommunity";
import { toast } from "sonner";

interface JournalEntry {
  id: string;
  text: string;
  image_url: string | null;
  color: string;
  created_at: string;
}

const stickerColors = [
  "bg-leaf-light/30 border-leaf/30",
  "bg-accent/15 border-accent/30",
  "bg-secondary border-earth-light/20",
  "bg-rose-old/15 border-rose-old/30",
];

const BitacoraPage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const b = t.bitacora as any;
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newNote, setNewNote] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shareEntry, setShareEntry] = useState<JournalEntry | null>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [sharing, setSharing] = useState(false);
  const [savedPosts, setSavedPosts] = useState<any[]>(() => {
    try {
      const data = JSON.parse(localStorage.getItem("mulchy-saved-posts") || "{}");
      return Object.values(data).sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch { return []; }
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { createPost } = useCommunity("all");

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

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Max 10MB");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const addEntry = async (mode: "private" | "community" = "private") => {
    if (!newNote.trim() && !photoFile) return;
    if (!user) return;
    setUploading(true);

    try {
      let imageUrl: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("journal-images")
          .upload(path, photoFile, { contentType: photoFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("journal-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const color = stickerColors[Math.floor(Math.random() * stickerColors.length)];
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          text: newNote.trim(),
          image_url: imageUrl,
          color,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setEntries((prev) => [data, ...prev]);
        if (mode === "community") {
          setShareEntry(data);
          setShareTitle("");
        }
      }
      setNewNote("");
      clearPhoto();
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setUploading(false);
    }
  };

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
    if (!error) {
      toast.success(b.shareSuccess);
      setShareEntry(null);
      setShareTitle("");
    } else {
      toast.error(b.shareError);
    }
  };

  const removeEntry = async (entry: JournalEntry) => {
    // Delete image from storage if exists
    if (entry.image_url) {
      const pathMatch = entry.image_url.match(/journal-images\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("journal-images").remove([pathMatch[1]]);
      }
    }
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entry.id);
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHY" />
            <h1 className="text-xl font-semibold">{b.title}</h1>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* New entry form */}
        <div className="dot-grid rounded-2xl border border-border p-6 md:p-8 mb-8 min-h-[200px]">
          <div className="flex items-start gap-3">
            <StickyNote className="w-5 h-5 text-earth-light shrink-0 mt-1" />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={b.placeholder}
                className="w-full bg-transparent resize-none font-body text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[80px]"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addEntry(); }}
              />

              {/* Photo preview */}
              {photoPreview && (
                <div className="relative mt-2 inline-block">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-xl border border-border"
                  />
                  <button
                    onClick={clearPhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3">
                {/* Camera (capture) */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  className="gap-1.5"
                  disabled={uploading}
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">{b.takePhoto}</span>
                </Button>

                {/* Gallery */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => galleryInputRef.current?.click()}
                  className="gap-1.5"
                  disabled={uploading}
                >
                  <ImagePlus className="w-4 h-4" />
                  <span className="hidden sm:inline">{b.choosePhoto}</span>
                </Button>

                <div className="flex-1" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addEntry("private")}
                  disabled={(!newNote.trim() && !photoFile) || uploading}
                  className="gap-1"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {b.onlyForMe}
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => addEntry("community")}
                  disabled={(!newNote.trim() && !photoFile) || uploading}
                  className="gap-1"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  {b.forCommunity}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Entries grid */}
        {loading ? (
          <div className="flex justify-center py-20">
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
                {/* Pantone card */}
                <div className="bg-white rounded-sm shadow-card hover:shadow-elevated transition-shadow border border-gray-200 overflow-hidden">
                  {/* Visual area */}
                  <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-leaf-light/30 via-leaf-light/10 to-cream flex items-center justify-center">
                    {entry.image_url ? (
                      <img
                        src={entry.image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-5xl select-none">🌱</span>
                    )}
                    {/* Action buttons — visible on hover */}
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setShareEntry(entry); setShareTitle(""); }}
                        className="w-6 h-6 rounded bg-white/85 flex items-center justify-center text-gray-600 hover:text-primary shadow-sm"
                        title={b.shareToComm}
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeEntry(entry)}
                        className="w-6 h-6 rounded bg-white/85 flex items-center justify-center text-gray-600 hover:text-destructive shadow-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Label area */}
                  <div className="bg-white px-2 pt-1.5 pb-2 border-t border-gray-100">
                    <p className="text-[8px] font-body text-gray-400 tracking-widest uppercase mb-0.5">MULCHY®</p>
                    {entry.text && (
                      <p className="font-body text-[10px] leading-relaxed line-clamp-3 text-gray-800 mb-0.5">{entry.text}</p>
                    )}
                    <p className="text-[8px] text-gray-400 font-body">
                      {new Date(entry.created_at).toLocaleDateString(
                        lang === "en" ? "en-US" : "es-CL",
                        { day: "numeric", month: "short" }
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-center py-20">
            <Leaf className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-body">{b.empty}</p>
          </div>
        )}

        {/* Posts guardados de la comunidad */}
        {savedPosts.length > 0 && (
          <div className="mt-8 px-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🔖</span>
              <h2 className="text-sm font-semibold font-display text-muted-foreground">{b.savedFromCommunity}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {savedPosts.map((post: any) => (
                <div key={post.id} className="group">
                  {/* Pantone card */}
                  <div className="bg-white rounded-sm shadow-card hover:shadow-elevated transition-shadow border border-gray-200 overflow-hidden">
                    {/* Visual area */}
                    <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-leaf-light/30 via-leaf-light/10 to-cream flex items-center justify-center">
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-5xl select-none">🔖</span>
                      )}
                      {/* Remove button */}
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            const current = JSON.parse(localStorage.getItem("mulchy-saved-posts") || "{}");
                            delete current[post.id];
                            localStorage.setItem("mulchy-saved-posts", JSON.stringify(current));
                            setSavedPosts(prev => prev.filter((p: any) => p.id !== post.id));
                          }}
                          className="w-6 h-6 rounded bg-white/85 flex items-center justify-center text-gray-600 hover:text-destructive shadow-sm"
                          title={b.removeFromSaved}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {/* Label area */}
                    <div className="bg-white px-2 pt-1.5 pb-2 border-t border-gray-100">
                      <p className="text-[8px] font-body text-gray-400 tracking-widest uppercase mb-0.5">MULCHY®</p>
                      <h3 className="font-display font-bold text-sm leading-tight text-gray-900 line-clamp-2 mb-0.5">{post.title}</h3>
                      {post.body && (
                        <p className="text-[9px] text-gray-500 font-body leading-relaxed line-clamp-2 mb-0.5">{post.body}</p>
                      )}
                      <p className="text-[9px] text-gray-400 font-body truncate">
                        {post.display_name}{post.city && ` · ${post.city}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share to community dialog */}
      <Dialog open={!!shareEntry} onOpenChange={(open) => !open && setShareEntry(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{b.shareDialogTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-body">{b.shareDialogDesc}</p>

          {shareEntry?.image_url && (
            <img src={shareEntry.image_url} alt="" className="w-full rounded-xl object-cover max-h-48" />
          )}

          {shareEntry?.text && (
            <p className="text-sm font-body bg-muted rounded-lg p-3 line-clamp-3">{shareEntry.text}</p>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">{b.shareTitleLabel}</label>
            <Input
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              placeholder={b.shareTitlePlaceholder}
            />
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
    </div>
  );
};

export default BitacoraPage;
