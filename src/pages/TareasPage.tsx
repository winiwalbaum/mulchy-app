import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { gardenTasks, seasonConfig, taskCategories, type Season, type GardenTask } from "@/data/gardenTasks";
import { ExternalLink, ArrowLeft, CalendarArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import LunarCalendarWidget from "@/components/LunarCalendarWidget";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/i18n/LanguageContext";

// ── Mapeo categoría → imagen botánica ────────────────────────────────────────
const categoryImage: Record<GardenTask["category"], string> = {
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

// ── Fondo por estación (header band) ──────────────────────────────────────────
const seasonBand: Record<Season, string> = {
  otoño:     "bg-amber-50",
  invierno:  "bg-sky-50",
  primavera: "bg-green-50",
  verano:    "bg-yellow-50",
};

const seasonMonths: Record<Season, number[]> = {
  otoño: [3, 4, 5],
  invierno: [6, 7, 8],
  primavera: [9, 10, 11],
  verano: [12, 1, 2],
};

const TareasPage = () => {
  const { profile } = useProfile();
  const { t, lang } = useLanguage();
  const tr = t.tareas as any;
  const d = t.dashboard as any;
  const monthNames = d.months as string[];
  const [activeSeason, setActiveSeason] = useState<Season | "todas">("todas");
  const [activeMonth, setActiveMonth] = useState<number | "todos">("todos");
  const [activeCategory, setActiveCategory] = useState("todas");

  const l = <T,>(es: T, en: T): T => lang === "en" ? en : es;

  const isSouthernHemisphere = useMemo(() => {
    if (profile?.latitude != null) return profile.latitude < 0;
    return true;
  }, [profile?.latitude]);

  const availableMonths = useMemo(() => {
    if (activeSeason === "todas") return Array.from({ length: 12 }, (_, i) => i + 1);
    return seasonMonths[activeSeason];
  }, [activeSeason]);

  const filtered = useMemo(() => {
    return gardenTasks.filter((task) => {
      const matchSeason = activeSeason === "todas" || task.season === activeSeason;
      const matchMonth = activeMonth === "todos" || task.months.includes(activeMonth);
      const matchCat = activeCategory === "todas" || task.category === activeCategory;
      return matchSeason && matchMonth && matchCat;
    });
  }, [activeSeason, activeMonth, activeCategory]);

  const handleSeasonChange = (s: Season | "todas") => {
    setActiveSeason(s);
    setActiveMonth("todos");
  };

  const exportToCalendar = () => {
    const year = new Date().getFullYear();
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mulchii//Garden Tasks//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:Mulchii — ${lang === "en" ? "Garden Tasks" : "Tareas de Huerta"}`,
    ];
    filtered.forEach((task) => {
      const title = l(task.title, task.title_en);
      const desc = l(task.description, task.description_en).replace(/\n/g, "\\n");
      const months = activeMonth !== "todos"
        ? task.months.filter((m) => m === activeMonth)
        : task.months;
      months.forEach((month) => {
        const taskYear = month < new Date().getMonth() + 1 ? year + 1 : year;
        const pad = (n: number) => String(n).padStart(2, "0");
        const dtStart = `${taskYear}${pad(month)}01`;
        const dtEnd   = `${taskYear}${pad(month)}02`;
        lines.push(
          "BEGIN:VEVENT",
          `DTSTART;VALUE=DATE:${dtStart}`,
          `DTEND;VALUE=DATE:${dtEnd}`,
          `SUMMARY:${task.emoji} ${title}`,
          `DESCRIPTION:${desc}`,
          `CATEGORIES:HUERTA`,
          `UID:mulchii-${task.id}-${month}-${taskYear}@mulchii.com`,
          "END:VEVENT",
        );
      });
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mulchii-tareas.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(lang === "en" ? "Calendar file downloaded!" : "¡Archivo descargado! Ábrelo para importar.");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHII" />
          <h1 className="text-xl font-semibold">{tr.title}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-body">{filtered.length} {d.tasks}</span>
            <button
              onClick={exportToCalendar}
              title={lang === "en" ? "Export to calendar" : "Exportar al calendario"}
              className="flex items-center gap-1.5 text-xs font-body font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <CalendarArrowDown className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === "en" ? "Export" : "Exportar"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => handleSeasonChange("todas")} className={`shrink-0 px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${activeSeason === "todas" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            {tr.allSeasons}
          </button>
          {(Object.entries(seasonConfig) as [Season, typeof seasonConfig.otoño][]).map(([key, cfg]) => (
            <button key={key} onClick={() => handleSeasonChange(key)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${activeSeason === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
              {cfg.emoji} {l(cfg.label, cfg.label_en)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveMonth("todos")} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${activeMonth === "todos" ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:bg-muted border border-border"}`}>
            {tr.allMonths}
          </button>
          {availableMonths.map((m) => (
            <button key={m} onClick={() => setActiveMonth(m)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${activeMonth === m ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:bg-muted border border-border"}`}>
              {monthNames[m - 1]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {taskCategories.map((cat) => (
            <button key={cat.value} onClick={() => setActiveCategory(cat.value)} className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${activeCategory === cat.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted border border-border"}`}>
              {l(cat.label, cat.label_en)}
            </button>
          ))}
        </div>

        {activeMonth !== "todos" && (
          <LunarCalendarWidget month={activeMonth - 1} isSouthernHemisphere={isSouthernHemisphere} compact={false} />
        )}
        {activeMonth === "todos" && (
          <LunarCalendarWidget month={new Date().getMonth()} isSouthernHemisphere={isSouthernHemisphere} compact={true} />
        )}

        <div className="space-y-4 pt-2">
          {filtered.map((task, i) => {
            const cfg = seasonConfig[task.season];
            const title = l(task.title, task.title_en);
            const description = l(task.description, task.description_en);
            const seasonLabel = l(cfg.label, cfg.label_en);
            const monthLabel = task.months.length <= 3
              ? task.months.map(m => monthNames[m - 1].slice(0, 3)).join(", ")
              : l(cfg.months, cfg.months_en);
            return (
              <motion.div key={task.id} className="bg-card rounded-xl shadow-soft border border-border/50 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}>
                {/* Banda ilustrada superior */}
                <div className="relative h-[96px] overflow-hidden">
                  <img
                    src={categoryImage[task.category]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Gradient para legibilidad del texto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  {/* Badge estación */}
                  <div className="absolute bottom-2 left-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-sm">
                      {cfg.emoji} {seasonLabel}
                    </span>
                  </div>
                  {/* Emoji tarea — esquina derecha */}
                  <div className="absolute top-2 right-3 text-2xl drop-shadow-sm select-none">
                    {task.emoji}
                  </div>
                </div>
                {/* Contenido */}
                <div className="p-4 pt-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-sm leading-snug flex-1">{title}</h3>
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-body shrink-0">
                      📅 {monthLabel}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">{description}</p>
                  <a href={task.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline font-body">
                    <ExternalLink className="w-3 h-3" />
                    {task.sourceName}
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-body">{(t.biblioteca as any).noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TareasPage;
