import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LucideIcon, Sprout, Camera, ChefHat, CalendarDays, TreePine, ArrowRight } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFeed } from "@/hooks/useFeed";
import { format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import { categoryEmoji } from "@/hooks/useNativePlants";
import {
  IllustrationVariedad,
  IllustrationHuerto,
  IllustrationComunidad,
  IllustrationReceta,
  IllustrationCalendario,
  IllustrationNativa,
} from "@/components/illustrations/FeedIllustrations";
import { useHerbario } from "@/hooks/useHerbario";

// ─── Skeleton ────────────────────────────────────────────────

const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="rounded-2xl bg-muted animate-pulse"
    style={{ height: "220px" }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay }}
  />
);

// ─── Magazine card ────────────────────────────────────────────

interface CardProps {
  to: string;
  state?: Record<string, any>;
  image?: string | null;
  bgClass: string;
  emojiBg?: string;
  illustration?: React.ReactNode;
  categoryLabel: string;
  categoryClass: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  delay?: number;
}

const MagCard = ({
  to,
  state,
  image,
  bgClass,
  emojiBg,
  illustration,
  categoryLabel,
  categoryClass,
  icon: Icon,
  title,
  subtitle,
  delay = 0,
}: CardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="rounded-2xl overflow-hidden relative"
    style={{ height: "220px" }}
  >
    <Link to={to} state={state} className="absolute inset-0 block group">
      {/* Background */}
      {image ? (
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className={`absolute inset-0 ${bgClass} overflow-hidden`}>
          {illustration ?? (emojiBg && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl opacity-20 select-none">{emojiBg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gradient overlay for image cards */}
      {image && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      )}

      {/* Category badge */}
      <div className="absolute top-3 left-3">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-body font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${categoryClass}`}
        >
          <Icon className="w-3 h-3" />
          {categoryLabel}
        </span>
      </div>

      {/* Text content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p
          className={`font-display font-bold text-base leading-snug line-clamp-2 ${
            image ? "text-white" : "text-foreground"
          }`}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className={`font-body text-sm mt-1 line-clamp-1 ${
              image ? "text-white/75" : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  </motion.div>
);

// ─── Page ─────────────────────────────────────────────────────

const taskCategoryImage: Record<string, string> = {
  siembra:       "/illustrations/seedlings.jpg",
  cosecha:       "/illustrations/pear-seeds.jpg",
  riego:         "/illustrations/maidenhair-fern.jpg",
  compost:       "/illustrations/red-mushrooms.jpg",
  general:       "/illustrations/delicate-plant.jpg",
  suelo:         "/illustrations/soil-layers.jpg",
  poda:          "/illustrations/garden-tools.jpg",
  plagas:        "/illustrations/dandelion.jpg",
  planificación: "/illustrations/moon-branches.jpg",
};

const FeedPage = () => {
  const { profile } = useProfile();
  const { lang } = useLanguage();
  const { latestVariety, popularPhoto, popularRecipe, seasonTask, nativePlant, myPhoto, loading } =
    useFeed();
  const { count: herbarioCount } = useHerbario();

  const dateLocale = lang === "en" ? enUS : esLocale;
  const today = format(
    new Date(),
    lang === "en" ? "EEEE, MMM d" : "EEEE d 'de' MMM",
    { locale: dateLocale }
  );

  const es = (spa: string, en: string) => (lang === "en" ? en : spa);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHII" />
              <span className="font-brand text-lg">Mulchii</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-body capitalize">{today}</p>
              {profile?.city && (
                <p className="text-xs font-body text-primary">{profile.city}</p>
              )}
            </div>
          </div>
          <p className="text-[10px] font-body text-muted-foreground mt-0.5 uppercase tracking-widest">
            {es("La huerta en tiempo real", "The garden in real time")}
          </p>
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
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* 1 — Mi huerto */}
            <MagCard
              to="/bitacora"
              image={myPhoto || "/illustrations/willow-pattern.jpg"}
              bgClass="bg-[#FAFAF8]"
              categoryLabel={es("Mi huerto", "My garden")}
              categoryClass="bg-earth/80 text-white"
              icon={Sprout}
              title={
                profile?.display_name
                  ? `${es("Hola", "Hello")}, ${profile.display_name.split(" ")[0]}`
                  : es("¡Bienvenida!", "Welcome!")
              }
              subtitle={
                herbarioCount > 0
                  ? es(`${herbarioCount} variedad${herbarioCount === 1 ? "" : "es"} guardada${herbarioCount === 1 ? "" : "s"}`, `${herbarioCount} saved variet${herbarioCount === 1 ? "y" : "ies"}`)
                  : profile?.city || es("Sin ubicación", "No location set")
              }
              delay={0.05}
            />

            {/* 2 — Herbario */}
            {latestVariety ? (
              <MagCard
                to="/variedades"
                image={latestVariety.image_url || latestVariety.image_url_2 || latestVariety.image_url_3}
                bgClass="bg-gradient-to-br from-primary/20 to-leaf-light/40"
                emojiBg="🌱"
                categoryLabel={es("Herbario", "Herbarium")}
                categoryClass="bg-primary/90 text-primary-foreground"
                icon={Sprout}
                title={latestVariety.name}
                subtitle={latestVariety.plant_scientific_name}
                delay={0.1}
              />
            ) : (
              <MagCard
                to="/variedades"
                image="/illustrations/nasturtium.jpg"
                bgClass="bg-[#FAFAF8]"
                categoryLabel={es("Herbario", "Herbarium")}
                categoryClass="bg-primary/90 text-primary-foreground"
                icon={Sprout}
                title={es("¡Agrega tu primera variedad!", "Add your first variety!")}
                delay={0.1}
              />
            )}

            {/* 3 — Foto popular */}
            {popularPhoto ? (
              <MagCard
                to="/comunidad"
                image={popularPhoto.image_url}
                bgClass="bg-gradient-to-br from-blue-100 to-sky-50"
                emojiBg="📸"
                categoryLabel={es("Foto popular", "Popular photo")}
                categoryClass="bg-sky-600/90 text-white"
                icon={Camera}
                title={popularPhoto.title}
                subtitle={popularPhoto.display_name}
                delay={0.15}
              />
            ) : (
              <MagCard
                to="/comunidad"
                image="/illustrations/passionflower.jpg"
                bgClass="bg-[#FAFAF8]"
                categoryLabel={es("Comunidad", "Community")}
                categoryClass="bg-sky-600/90 text-white"
                icon={Camera}
                title={es("¡Comparte una foto de tu huerto!", "Share a photo of your garden!")}
                delay={0.15}
              />
            )}

            {/* 4 — Receta popular */}
            {popularRecipe ? (
              <MagCard
                to="/comunidad"
                image={popularRecipe.image_url}
                bgClass="bg-gradient-to-br from-orange-100 to-amber-50"
                emojiBg="🍳"
                categoryLabel={es("Comunidad", "Community")}
                categoryClass="bg-orange-500/90 text-white"
                icon={ChefHat}
                title={popularRecipe.title}
                subtitle={popularRecipe.display_name}
                delay={0.2}
              />
            ) : (
              <MagCard
                to="/comunidad"
                image="/illustrations/garcinia-fruit.jpg"
                bgClass="bg-[#FAFAF8]"
                categoryLabel={es("Comunidad", "Community")}
                categoryClass="bg-orange-500/90 text-white"
                icon={ChefHat}
                title={es("¡Comparte con otros huerteros!", "Share with other gardeners!")}
                delay={0.2}
              />
            )}

            {/* 5 — Tarea del mes */}
            {seasonTask ? (
              <MagCard
                to="/tareas"
                bgClass="bg-[#FAFAF8]"
                image={taskCategoryImage[seasonTask.category] || "/illustrations/moon-branches.jpg"}
                categoryLabel={es("Este mes", "This month")}
                categoryClass="bg-violet-600/90 text-white"
                icon={CalendarDays}
                title={`${seasonTask.emoji} ${lang === "en" ? seasonTask.title_en || seasonTask.title : seasonTask.title}`}
                subtitle={es("Toca para ver el calendario", "Tap to see the calendar")}
                delay={0.25}
              />
            ) : (
              <MagCard
                to="/tareas"
                bgClass="bg-[#FAFAF8]"
                image="/illustrations/moon-branches.jpg"
                categoryLabel={es("Calendario", "Calendar")}
                categoryClass="bg-violet-600/90 text-white"
                icon={CalendarDays}
                title={es("Ver tareas de temporada", "See seasonal tasks")}
                delay={0.25}
              />
            )}

            {/* 6 — Planta nativa */}
            {nativePlant ? (
              <MagCard
                to="/semillero"
                state={{ tab: "native", openPlant: nativePlant.taxon_id }}
                image={nativePlant.image_url}
                bgClass="bg-gradient-to-br from-emerald-100 to-green-50"
                emojiBg={categoryEmoji[nativePlant.category] || "🌿"}
                categoryLabel={es("Plantas nativas", "Native plants")}
                categoryClass="bg-emerald-700/90 text-white"
                icon={TreePine}
                title={
                  lang === "en"
                    ? nativePlant.common_name_en || nativePlant.common_name || nativePlant.scientific_name
                    : nativePlant.common_name || nativePlant.scientific_name
                }
                subtitle={es("Descubrir →", "Discover →")}
                delay={0.3}
              />
            ) : (
              <MagCard
                to="/semillero"
                state={{ tab: "native" }}
                image="/illustrations/maidenhair-fern.jpg"
                bgClass="bg-[#FAFAF8]"
                categoryLabel={es("Plantas nativas", "Native plants")}
                categoryClass="bg-emerald-700/90 text-white"
                icon={TreePine}
                title={es("Explora plantas nativas", "Explore native plants")}
                delay={0.3}
              />
            )}
          </div>
        )}

        {/* Acceso rápido al calendario */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Link
            to="/tareas"
            className="flex items-center justify-between mt-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-body font-semibold text-sm">
                  {es("Calendario de temporada", "Seasonal calendar")}
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  {es("Tareas y fases lunares", "Tasks and lunar phases")}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default FeedPage;
