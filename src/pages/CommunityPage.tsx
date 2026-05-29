import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCommunity, useComments, PostType, CommunityPost } from "@/hooks/useCommunity";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  MessageCircle,
  Heart,
  HelpCircle,
  Repeat2,
  Camera,
  Plus,
  MapPin,
  Send,
  Loader2,
  Filter,
  Trash2,
  Bookmark,
  BookmarkCheck,
  ChefHat,
  CornerDownRight,
} from "lucide-react";
import { toast } from "sonner";

type TabKey = "all" | "question" | "exchange" | "photo" | "recipe";
type GeoFilter = "all" | "city" | "nearby";

const typeEmoji: Record<string, string> = {
  question: "❓",
  exchange: "🔄",
  photo: "📸",
  recipe: "🍳",
};

function getTimeAgo(dateStr: string, c: any): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return c.now;
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}${c.now === "now" ? "mo" : "mes"}`;
}

const getSavedPosts = (): Record<string, CommunityPost> => {
  try { return JSON.parse(localStorage.getItem("mulchii-saved-posts") || "{}"); } catch { return {}; }
};

const PostCard = ({
  post,
  onLike,
  onOpen,
  onDelete,
  currentUserId,
  c,
}: {
  post: CommunityPost;
  onLike: (id: string) => void;
  onOpen: (post: CommunityPost) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
  c: any;
}) => {
  const timeAgo = getTimeAgo(post.created_at, c);
  const typeLabel =
    post.type === "question" ? c.typeQuestion
    : post.type === "exchange" ? c.typeExchange
    : post.type === "recipe" ? c.typeRecipe
    : c.typePhoto;

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-sm shadow-card hover:shadow-elevated transition-shadow border border-gray-200 overflow-hidden">
        {/* Clickable visual + title area → opens full post */}
        <button className="w-full text-left" onClick={() => onOpen(post)}>
          <div className="aspect-square overflow-hidden relative bg-gradient-to-br from-leaf-light/30 via-leaf-light/10 to-cream flex items-center justify-center">
            {post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <span className="text-5xl select-none">{typeEmoji[post.type]}</span>
            )}
            <div className="absolute top-1.5 right-1.5">
              <span className="text-[8px] px-1 py-0.5 rounded font-body font-medium bg-white/85 text-gray-600">
                {typeEmoji[post.type]} {typeLabel}
              </span>
            </div>
          </div>
          <div className="bg-white px-2 pt-1.5 pb-1 border-t border-gray-100">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[8px] font-body text-gray-400 tracking-widest uppercase">MULCHII®</p>
              <span className="text-[8px] text-gray-400 font-body">{timeAgo}</span>
            </div>
            <h3 className="font-display font-bold text-sm leading-tight text-gray-900 line-clamp-2 mb-0.5">{post.title}</h3>
            <p className="text-[9px] text-gray-400 font-body truncate">
              {post.display_name}{post.city && ` · ${post.city}`}
            </p>
          </div>
        </button>

        {/* Quick actions — fuera del área clickeable */}
        <div className="flex items-center gap-2 px-2 pb-2 pt-1 border-t border-gray-100 bg-white">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1 text-[10px] font-body transition-colors ${post.user_liked ? "text-destructive" : "text-gray-400 hover:text-destructive"}`}
          >
            <Heart className={`w-3 h-3 ${post.user_liked ? "fill-current" : ""}`} />
            {post.likes_count > 0 && post.likes_count}
          </button>
          <button
            onClick={() => onOpen(post)}
            className="flex items-center gap-1 text-[10px] font-body text-gray-400 hover:text-primary transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            {post.comments_count > 0 && post.comments_count}
          </button>
          {currentUserId === post.user_id && (
            <button
              onClick={() => onDelete(post.id)}
              className="ml-auto flex items-center gap-1 text-[10px] font-body text-gray-400 hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const PostDetailDialog = ({
  post,
  onClose,
  onLike,
  onDelete,
  currentUserId,
  c,
}: {
  post: CommunityPost | null;
  onClose: () => void;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
  c: any;
}) => {
  const { comments, loading, addComment } = useComments(post?.id || null);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [saved, setSaved] = useState(false);

  // sync saved state when post changes
  useState(() => { if (post) setSaved(!!getSavedPosts()[post.id]); });

  const toggleSave = () => {
    if (!post) return;
    const current = getSavedPosts();
    if (saved) {
      delete current[post.id];
      toast.info(c.removedFromJournal);
    } else {
      current[post.id] = { ...post };
      toast.success(c.savedToJournal);
    }
    localStorage.setItem("mulchii-saved-posts", JSON.stringify(current));
    setSaved(!saved);
  };

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    await addComment(newComment.trim(), null);
    setNewComment("");
    setSending(false);
  };

  const handleSendReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    await addComment(replyText.trim(), parentId);
    setReplyText("");
    setReplyingTo(null);
    setSendingReply(false);
  };

  if (!post) return null;

  const topLevel = comments.filter((cm) => !cm.parent_id);
  const repliesMap = comments.reduce<Record<string, typeof comments>>((acc, cm) => {
    if (cm.parent_id) {
      if (!acc[cm.parent_id]) acc[cm.parent_id] = [];
      acc[cm.parent_id].push(cm);
    }
    return acc;
  }, {});

  const timeAgo = getTimeAgo(post.created_at, c);

  return (
    <Dialog open={!!post} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 max-h-[92vh] flex flex-col overflow-hidden gap-0">
        {/* Imagen completa sin recorte */}
        {post.image_url && (
          <div className="w-full bg-black flex items-center justify-center shrink-0" style={{ maxHeight: "45vh" }}>
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-auto object-contain"
              style={{ maxHeight: "45vh" }}
            />
          </div>
        )}

        {/* Info del post */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <DialogHeader className="mb-0 space-y-0">
            <DialogTitle className="font-display font-bold text-base leading-tight text-left">
              {post.title}
            </DialogTitle>
          </DialogHeader>
          {post.body && (
            <p className="text-sm font-body text-muted-foreground mt-1.5 leading-relaxed">{post.body}</p>
          )}
          <p className="text-xs text-muted-foreground font-body mt-1">
            {post.display_name}{post.city && ` · ${post.city}`} · {timeAgo}
          </p>

          {/* Acciones */}
          <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-sm font-body transition-colors ${post.user_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
            >
              <Heart className={`w-4 h-4 ${post.user_liked ? "fill-current" : ""}`} />
              {post.likes_count > 0 && <span>{post.likes_count}</span>}
            </button>
            <span className="flex items-center gap-1.5 text-sm font-body text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              {post.comments_count > 0 && post.comments_count}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={toggleSave}
                className={`transition-colors ${saved ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
              >
                {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
              {currentUserId === post.user_id && (
                <button
                  onClick={() => { onDelete(post.id); onClose(); }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Comentarios con hilos */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : topLevel.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body text-center py-8">{c.firstComment}</p>
          ) : (
            topLevel.map((cm) => (
              <div key={cm.id} className="space-y-2">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0 mt-0.5">🌿</div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold font-display">{cm.display_name}</span>
                        <span className="text-[10px] text-muted-foreground font-body">{getTimeAgo(cm.created_at, c)}</span>
                      </div>
                      <p className="text-sm font-body mt-0.5">{cm.body}</p>
                    </div>
                    <button
                      onClick={() => { setReplyingTo(replyingTo === cm.id ? null : cm.id); setReplyText(""); }}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary font-body mt-1 ml-2 transition-colors"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      {c.reply || "Responder"}
                    </button>
                  </div>
                </div>

                {(repliesMap[cm.id] || []).map((reply) => (
                  <div key={reply.id} className="flex gap-2 ml-8">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] shrink-0 mt-0.5">🌱</div>
                    <div className="bg-background border border-border rounded-xl px-3 py-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold font-display">{reply.display_name}</span>
                        <span className="text-[10px] text-muted-foreground font-body">{getTimeAgo(reply.created_at, c)}</span>
                      </div>
                      <p className="text-sm font-body mt-0.5">{reply.body}</p>
                    </div>
                  </div>
                ))}

                {replyingTo === cm.id && (
                  <div className="flex gap-2 ml-8">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`${c.replyTo || "Responder a"} ${cm.display_name}…`}
                      className="font-body text-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply(cm.id)}
                    />
                    <Button size="icon" onClick={() => handleSendReply(cm.id)} disabled={sendingReply || !replyText.trim()}>
                      {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input nuevo comentario */}
        <div className="flex gap-2 px-4 py-3 border-t border-border shrink-0">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={c.writeComment}
            className="font-body text-sm"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <Button size="icon" onClick={handleSend} disabled={sending || !newComment.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const NewPostDialog = ({
  open,
  onClose,
  onCreate,
  onUploadImage,
  c,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (post: { type: PostType; title: string; body: string; image_url?: string; category?: string }) => Promise<any>;
  onUploadImage: (file: File) => Promise<string | null>;
  c: any;
}) => {
  const [type, setType] = useState<PostType>("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(c.imageTooLarge);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    let imageUrl: string | undefined;
    if (imageFile) {
      const url = await onUploadImage(imageFile);
      if (!url) {
        toast.error(c.imageUploadError);
        setSaving(false);
        return;
      }
      imageUrl = url;
    }
    const err = await onCreate({ type, title: title.trim(), body: body.trim(), image_url: imageUrl, category: category.trim() || undefined });
    setSaving(false);
    if (!err) {
      toast.success(c.published);
      setTitle(""); setBody(""); setCategory(""); removeImage(); onClose();
    } else {
      toast.error(c.publishError);
    }
  };

  const typeOptions: { key: PostType; label: string; emoji: string }[] = [
    { key: "question", label: c.typeQuestion, emoji: "❓" },
    { key: "exchange", label: c.typeExchange, emoji: "🔄" },
    { key: "photo", label: c.typePhoto, emoji: "📸" },
    { key: "recipe", label: c.typeRecipe, emoji: "🍳" },
  ];

  const placeholders: Record<PostType, string> = {
    question: c.questionPlaceholder,
    exchange: c.exchangePlaceholder,
    photo: c.photoPlaceholder,
    recipe: c.recipePlaceholder,
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{c.newPost}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {typeOptions.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-body font-medium transition-colors border whitespace-nowrap shrink-0 ${
                  type === t.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"
                }`}
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={placeholders[type]} className="font-body" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={c.moreDetails} className="font-body min-h-[100px]" />

          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full rounded-xl object-cover max-h-48" />
              <button onClick={removeImage} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/70 text-background flex items-center justify-center text-sm hover:bg-foreground/90 transition-colors">✕</button>
            </div>
          ) : (
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-lg bg-leaf-light/20 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-body font-medium">{c.addPhoto}</p>
                <p className="text-xs text-muted-foreground font-body">{c.photoFormats}</p>
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageSelect} />
            </label>
          )}

          {type === "exchange" && (
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={c.categoryPlaceholder} className="font-body" />
          )}
          <Button className="w-full" onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {c.publish}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [geoFilter, setGeoFilter] = useState<GeoFilter>("all");
  const [radiusKm, setRadiusKm] = useState(50);
  const [showAll, setShowAll] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const { profile } = useProfile();
  const { t } = useLanguage();
  const c = t.community as any;
  const tabs_i18n = c.tabs as any;

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "all", label: tabs_i18n.all, icon: Users },
    { key: "question", label: tabs_i18n.questions, icon: HelpCircle },
    { key: "exchange", label: tabs_i18n.exchange, icon: Repeat2 },
    { key: "photo", label: tabs_i18n.photos, icon: Camera },
    { key: "recipe", label: tabs_i18n.recipes, icon: ChefHat },
  ];

  const geoOptions: { key: GeoFilter; label: string }[] = [
    { key: "all", label: c.geoAll },
    { key: "city", label: c.geoCity },
    { key: "nearby", label: c.geoNearby },
  ];

  const { posts, loading, createPost, deletePost, toggleLike, uploadImage } = useCommunity(activeTab, showAll ? "all" : geoFilter, radiusKm);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/logoplural.png" className="w-7 h-7 object-contain" alt="Comunidad" />
              <h1 className="text-xl font-semibold">{c.title}</h1>
            </div>
            <Button size="sm" onClick={() => setShowNewPost(true)}>
              <Plus className="w-4 h-4 mr-1" />
              {c.publish}
            </Button>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="container py-4">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {geoOptions.map((opt) => {
            const disabled = (opt.key === "city" && !profile?.city) || (opt.key === "nearby" && !profile?.latitude);
            return (
              <button
                key={opt.key}
                onClick={() => !disabled && setGeoFilter(opt.key)}
                disabled={disabled}
                className={`px-3 py-1 rounded-full text-xs font-body whitespace-nowrap transition-colors ${
                  geoFilter === opt.key ? "bg-secondary text-foreground font-medium" : disabled ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Selector de radio + Ver Todo — solo visible cuando filtro es "Cerca" */}
        {geoFilter === "nearby" && (
          <div className="flex items-center gap-3 mb-4 px-1">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={radiusKm}
              onChange={e => { setRadiusKm(Number(e.target.value)); setShowAll(false); }}
              disabled={showAll}
              className="flex-1 accent-primary disabled:opacity-40"
            />
            <span className={`text-xs font-body whitespace-nowrap w-14 text-right ${showAll ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
              {radiusKm} km
            </span>
            <label className="flex items-center gap-1.5 text-xs font-body text-muted-foreground whitespace-nowrap cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAll}
                onChange={e => setShowAll(e.target.checked)}
                className="accent-primary w-3.5 h-3.5"
              />
              {c.viewAll}
            </label>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🌿</div>
            <p className="font-display font-semibold mb-1">{c.noPosts}</p>
            <p className="text-sm text-muted-foreground font-body">{c.noPostsDesc}</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowNewPost(true)}>
              <Plus className="w-4 h-4 mr-1" />
              {c.createPost}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <AnimatePresence>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onLike={toggleLike} onOpen={setSelectedPost} onDelete={deletePost} currentUserId={user?.id} c={c} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <NewPostDialog open={showNewPost} onClose={() => setShowNewPost(false)} onCreate={createPost} onUploadImage={uploadImage} c={c} />
      <PostDetailDialog post={selectedPost} onClose={() => setSelectedPost(null)} onLike={toggleLike} onDelete={deletePost} currentUserId={user?.id} c={c} />
    </div>
  );
};

export default CommunityPage;
