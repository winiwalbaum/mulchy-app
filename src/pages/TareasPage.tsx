import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { gardenTasks, seasonConfig, taskCategories, type Season } from "@/data/gardenTasks";
import { ExternalLink, Leaf, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import LunarCalendarWidget from "@/components/LunarCalendarWidget";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/i18n/LanguageContext";

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHY" />
          <h1 className="text-xl font-semibold">{tr.title}</h1>
          <span className="ml-auto text-xs text-muted-foreground font-body">{filtered.length} {d.tasks}</span>
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
              <motion.div key={task.id} className="bg-card rounded-xl p-5 shadow-soft border border-border/50" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}>
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl">{task.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        {cfg.emoji} {seasonLabel}
                      </span>
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        📅 {monthLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-body mt-2 leading-relaxed">{description}</p>
                <a href={task.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline font-body">
                  <ExternalLink className="w-3 h-3" />
                  {task.sourceName}
                </a>
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
