import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, ChevronLeft, ChevronRight,
  CalendarPlus, Download, ExternalLink, Moon, ChevronDown, ChevronUp, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import { toast } from "sonner";
import WeatherWidget from "@/components/WeatherWidget";
import { useWeather } from "@/hooks/useWeather";
import { gardenTasks, seasonConfig, taskCategories, type GardenTask, type Season } from "@/data/gardenTasks";
import {
  getLunarPeriodsForMonth, getCurrentLunarPeriod, moonPhaseInfo,
  SOURCE_URL, SOURCE_NAME, MOON_PHASES_SOURCE_URL, MOON_PHASES_SOURCE_NAME,
  type LunarPeriod,
} from "@/data/lunarCalendar";

// ─── Types ────────────────────────────────────────────────────

type SchedulableItem = {
  id: string;
  type: "task" | "lunar";
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  category?: string;
  categoryLabel?: string;
  badge?: { label: string; className: string };
  suggestedStart?: string;
  suggestedEnd?: string;
  sourceUrl?: string;
  sourceName?: string;
  shNote?: string;
};

// ─── Constants ────────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  suelo: "bg-secondary text-earth",
  siembra: "bg-leaf-light/40 text-primary",
  cosecha: "bg-accent/20 text-foreground",
  poda: "bg-accent/20 text-violet",
  riego: "bg-blue-100 text-blue-700",
  plagas: "bg-rose-old/20 text-rose-old",
  "planificación": "bg-muted text-muted-foreground",
  compost: "bg-secondary text-earth",
  general: "bg-muted text-muted-foreground",
  lunar: "bg-violet-100 text-violet-800",
};

// Build a category key → localized label map
const categoryLabelMap = (lang: string): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const cat of taskCategories) {
    if (cat.value !== "todas") {
      map[cat.value] = lang === "en" ? cat.label_en.replace(/^[^\s]+\s/, '') : cat.label.replace(/^[^\s]+\s/, '');
    }
  }
  map["lunar"] = lang === "en" ? "Lunar" : "Lunar";
  return map;
};

// ─── Calendar Export Utilities ─────────────────────────────────

const formatDateICS = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
};

const buildReturnUrl = () => `${window.location.origin}/dashboard`;

const generateICSContent = (title: string, description: string, date: Date, lang: string) => {
  const startDate = new Date(date);
  startDate.setHours(9, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setHours(10, 0, 0, 0);
  const returnUrl = buildReturnUrl();
  const appName = lang === "en" ? "MULCHII" : "MULCHII";
  const returnLabel = lang === "en" ? "Back to MULCHII" : "Volver a MULCHII";
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${appName}//ES`,
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `DTSTART:${formatDateICS(startDate)}`, `DTEND:${formatDateICS(endDate)}`,
    `SUMMARY:🌱 ${title}`,
    `DESCRIPTION:${description}\\n\\n🔗 ${returnLabel}: ${returnUrl}`,
    `URL:${returnUrl}`, "STATUS:CONFIRMED",
    `UID:mulchii-${Date.now()}@mulchii`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
};

const downloadICS = (title: string, description: string, date: Date, lang: string) => {
  const content = generateICSContent(title, description, date, lang);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `huerta-${title.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getGoogleCalendarUrl = (title: string, description: string, date: Date, lang: string) => {
  const startDate = new Date(date);
  startDate.setHours(9, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setHours(10, 0, 0, 0);
  const returnUrl = buildReturnUrl();
  const returnLabel = lang === "en" ? "Back to MULCHII" : "Volver a MULCHII";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `🌱 ${title}`,
    details: `${description}\n\n🔗 ${returnLabel}: ${returnUrl}`,
    dates: `${formatDateICS(startDate)}/${formatDateICS(endDate)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// ─── Build Unified Timeline ───────────────────────────────────

const buildTimeline = (month: number, isSH: boolean, lang: string): SchedulableItem[] => {
  const m = month + 1;
  const items: SchedulableItem[] = [];
  const l = <T,>(es: T, en: T | undefined): T => lang === "en" && en !== undefined ? en as T : es;
  const catLabels = categoryLabelMap(lang);
  const shLabel = lang === "en" ? "Southern Hemisphere" : "Hemisferio Sur";
  const activitiesLabel = lang === "en" ? "Activities" : "Actividades";

  // Add lunar periods
  const lunarPeriods = getLunarPeriodsForMonth(m);
  for (const lp of lunarPeriods) {
    const phaseInfo = moonPhaseInfo[lp.phase];
    const label = l(lp.label, lp.label_en);
    const recommendation = l(lp.recommendation, lp.recommendation_en);
    const activities = l(lp.activities, lp.activities_en);
    const phaseDesc = l(phaseInfo.description, phaseInfo.description_en);
    const shNote = isSH ? l(lp.southernHemisphereNote, lp.southernHemisphereNote_en) : undefined;

    items.push({
      id: `lunar-${lp.id}`,
      type: "lunar",
      title: `${lp.emoji} ${label}`,
      subtitle: recommendation,
      description: `${phaseDesc}\n\n${activitiesLabel}:\n${activities.map(a => `• ${a}`).join("\n")}${shNote ? `\n\n🌍 ${shLabel}: ${shNote}` : ""}`,
      emoji: lp.emoji,
      category: "lunar",
      categoryLabel: catLabels["lunar"],
      badge: { label: l(phaseInfo.label, phaseInfo.label_en), className: phaseInfo.color },
      suggestedStart: lp.startDate,
      suggestedEnd: lp.endDate,
      sourceUrl: SOURCE_URL,
      sourceName: SOURCE_NAME,
      shNote,
    });
  }

  // Add garden tasks
  const tasks = gardenTasks.filter(t => t.months.includes(m));
  for (const t of tasks) {
    const title = l(t.title, t.title_en);
    const desc = l(t.description, t.description_en);
    items.push({
      id: `task-${t.id}`,
      type: "task",
      title,
      subtitle: desc.slice(0, 100) + (desc.length > 100 ? "…" : ""),
      description: desc,
      emoji: t.emoji,
      category: t.category,
      categoryLabel: catLabels[t.category] || t.category,
      sourceUrl: t.sourceUrl,
      sourceName: t.sourceName,
    });
  }

  items.sort((a, b) => {
    if (a.type === "lunar" && b.type === "task") return -1;
    if (a.type === "task" && b.type === "lunar") return 1;
    if (a.suggestedStart && b.suggestedStart) return a.suggestedStart.localeCompare(b.suggestedStart);
    return 0;
  });

  return items;
};

// ─── Component ────────────────────────────────────────────────

const DashboardPage = () => {
  const { profile } = useProfile();
  const { t, lang } = useLanguage();
  const { weather } = useWeather();
  const d = t.dashboard as any;
  const dateLocale = lang === "en" ? enUS : esLocale;
  const monthsShort = (d.monthsShort || d.months) as string[];
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [deletedItems, setDeletedItems] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("mulchii-deleted") || "{}"); } catch { return {}; }
  });
  const [scheduledItems, setScheduledItems] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("mulchii-scheduled") || "{}"); } catch { return {}; }
  });
  const [exportItem, setExportItem] = useState<SchedulableItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const markScheduled = (id: string, date: Date) => {
    const label = date.toLocaleDateString(lang === "en" ? "en-US" : "es-CL", { day: "numeric", month: "short" });
    setScheduledItems(prev => {
      const next = { ...prev, [id]: label };
      localStorage.setItem("mulchii-scheduled", JSON.stringify(next));
      return next;
    });
  };

  const todayLabel = lang === "en" ? "Today" : "Hoy";
  const scheduleTooltip = d.scheduleCalendar;
  const dateFormatStr = lang === "en" ? "EEEE, MMMM d, yyyy" : "EEEE d 'de' MMMM, yyyy";

  const isSouthernHemisphere = useMemo(() => {
    if (profile?.latitude != null) return profile.latitude < 0;
    return true;
  }, [profile?.latitude]);

  const timeline = useMemo(
    () => buildTimeline(currentMonth, isSouthernHemisphere, lang),
    [currentMonth, isSouthernHemisphere, lang]
  );

  const lunarItems = timeline.filter(i => i.type === "lunar");
  const taskItems = timeline.filter(i => i.type === "task").filter(i => !deletedItems[i.id]);
  const completedCount = taskItems.filter(i => scheduledItems[i.id]).length;

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletedItems(prev => {
      const next = { ...prev, [id]: true };
      localStorage.setItem("mulchii-deleted", JSON.stringify(next));
      return next;
    });
  };

  const openExportDialog = (item: SchedulableItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.suggestedStart) {
      setSelectedDate(new Date(item.suggestedStart + "T12:00:00"));
    } else {
      const now = new Date();
      setSelectedDate(new Date(now.getFullYear(), currentMonth, 15));
    }
    setExportItem(item);
  };

  const handleGoogleExport = () => {
    if (!exportItem || !selectedDate) return;
    window.open(getGoogleCalendarUrl(exportItem.title, exportItem.description, selectedDate, lang), "_blank");
    markScheduled(exportItem.id, selectedDate);
    toast.success(d.openingGoogle);
    setExportItem(null);
  };

  const handleICSExport = () => {
    if (!exportItem || !selectedDate) return;
    downloadICS(exportItem.title, exportItem.description, selectedDate, lang);
    markScheduled(exportItem.id, selectedDate);
    toast.success(d.icsDownloaded);
    setExportItem(null);
  };

  const currentPeriod = getCurrentLunarPeriod();

  // Weather-to-task tip: derive a contextual gardening tip from current alerts
  const weatherTip = useMemo(() => {
    if (!weather?.alerts?.length) return null;
    const alert = weather.alerts[0]; // use the most important alert
    const es = (spa: string, en: string) => lang === "en" ? en : spa;
    if (alert.type === "frost" || alert.type === "frost_forecast") {
      return {
        emoji: "❄️",
        tip: es(
          "Cubre trasplantes recientes con agrovelo o tela. Riega en la mañana, nunca al anochecer.",
          "Cover recent transplants with fleece. Water in the morning, never at dusk."
        ),
        bg: "bg-blue-50 border-blue-200 text-blue-900",
      };
    }
    if (alert.type === "heat") {
      return {
        emoji: "🔥",
        tip: es(
          "Riega antes de las 9am. Da sombra a lechugas, espinacas y apio. Aplica mulch para retener humedad.",
          "Water before 9am. Shade lettuce, spinach and celery. Apply mulch to retain moisture."
        ),
        bg: "bg-orange-50 border-orange-200 text-orange-900",
      };
    }
    if (alert.type === "rain") {
      return {
        emoji: "🌧️",
        tip: es(
          "No necesitas regar hoy. Momento ideal para sembrar directo o trasplantar — la lluvia hace el resto. También puedes aplicar compost en superficie.",
          "No need to water today. Perfect time for direct sowing or transplanting — the rain does the rest. Also great for applying surface compost."
        ),
        bg: "bg-sky-50 border-sky-200 text-sky-900",
      };
    }
    if (alert.type === "wind") {
      return {
        emoji: "💨",
        tip: es(
          "Asegura tutores, mallas y plantas altas. Evita trasplantar hoy — el viento estrés a las raíces.",
          "Secure stakes, nets and tall plants. Avoid transplanting today — wind stresses new roots."
        ),
        bg: "bg-gray-50 border-gray-200 text-gray-800",
      };
    }
    return null;
  }, [weather?.alerts, lang]);

  const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return "";
    const s = new Date(start + "T12:00:00");
    const e = new Date(end + "T12:00:00");
    const mo = monthsShort.map(m => m.slice(0, 3));
    if (s.getMonth() === e.getMonth() && s.getDate() === e.getDate()) return `${s.getDate()} ${mo[s.getMonth()]}`;
    if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${mo[s.getMonth()]}`;
    return `${s.getDate()} ${mo[s.getMonth()]} – ${e.getDate()} ${mo[e.getMonth()]}`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center gap-3 py-4">
          <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHII" />
          <h1 className="text-xl font-semibold">{d.title}</h1>
        </div>
      </header>

      <div className="container py-6">
        {/* Weather */}
        <div className="max-w-2xl mx-auto mb-8">
          <WeatherWidget />
        </div>

        {/* Divider */}
        <div className="max-w-2xl mx-auto border-t border-border mb-8" />

        {/* Weather → Task tip banner */}
        {weatherTip && (
          <motion.div
            className={`max-w-2xl mx-auto mb-6 flex items-start gap-3 p-4 rounded-2xl border ${weatherTip.bg}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <span className="text-xl shrink-0">{weatherTip.emoji}</span>
            <p className="text-sm font-body leading-relaxed">{weatherTip.tip}</p>
          </motion.div>
        )}

        {/* Month selector */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(p => (p === 0 ? 11 : p - 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h2 className="text-3xl font-bold font-display tracking-tight">{(d.months as string[])[currentMonth]}</h2>
              <p className="text-sm text-muted-foreground font-body mt-0.5">
                {completedCount}/{taskItems.length} {d.tasks} · {lunarItems.length} {d.lunarPhases}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(p => (p === 11 ? 0 : p + 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-muted rounded-full mt-4">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${taskItems.length > 0 ? (completedCount / taskItems.length) * 100 : 0}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-2xl mx-auto border-t border-border mb-8" />

        <div className="max-w-2xl mx-auto space-y-10">
          {/* ═══ Lunar Planting Section ═══ */}
          {lunarItems.length > 0 && (
            <section className="bg-violet-50/60 border border-violet-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-violet-100">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Moon className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="font-bold font-display text-foreground text-lg">{d.lunarPlanting}</h3>
                {currentPeriod && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-primary text-primary-foreground font-body font-medium ml-auto">
                    {todayLabel}: {currentPeriod.emoji} {lang === "en" ? currentPeriod.recommendation_en : currentPeriod.recommendation}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {lunarItems.map((item, i) => {
                  const isActive = currentPeriod && item.id === `lunar-${currentPeriod.id}`;
                  const isExpanded = expandedItem === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isActive
                          ? "border-primary/50 bg-primary/5 shadow-sm"
                          : "border-border/50 bg-card"
                      }`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                    >
                      <div className="flex items-start gap-3 p-3">
                        <span className="text-xl mt-0.5">{item.emoji}</span>
                        <button
                          className="flex-1 min-w-0 text-left"
                          onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium font-body text-muted-foreground">
                              {formatDateRange(item.suggestedStart, item.suggestedEnd)}
                            </span>
                            {isActive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-body font-medium">
                                {(t.common as any).today}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold mt-0.5">{item.title}</p>
                          <p className="text-xs text-muted-foreground font-body mt-0.5">{item.subtitle}</p>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => openExportDialog(item, e)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                            title={scheduleTooltip}
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                            className="p-1.5"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 space-y-2 ml-9">
                              {item.badge && (
                                <div className={`text-xs px-2.5 py-1.5 rounded-lg ${item.badge.className} font-body`}>
                                  {item.description.split(/\n\n(Actividades|Activities):/)[0]}
                                </div>
                              )}
                              <ul className="space-y-1">
                                {item.description
                                  .match(/• .+/g)
                                  ?.map((act, j) => (
                                    <li key={j} className="text-xs font-body text-foreground flex items-start gap-1.5">
                                      <span className="text-primary mt-0.5">•</span>
                                      {act.replace("• ", "")}
                                    </li>
                                  ))}
                              </ul>
                              {item.shNote && (
                                <div className="text-xs font-body bg-accent/10 text-accent-foreground px-2.5 py-1.5 rounded-lg border border-accent/20">
                                  🌍 <strong>{d.southernHem}</strong> {item.shNote}
                                </div>
                              )}
                              {item.sourceUrl && (
                                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-body">
                                  <ExternalLink className="w-3 h-3" /> {item.sourceName}
                                </a>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* Sources */}
              <div className="flex flex-wrap gap-3 mt-2">
                <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary font-body">
                  <ExternalLink className="w-2.5 h-2.5" /> {SOURCE_NAME}
                </a>
                <a href={MOON_PHASES_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary font-body">
                  <ExternalLink className="w-2.5 h-2.5" /> {MOON_PHASES_SOURCE_NAME}
                </a>
              </div>
            </section>
          )}

          {/* ═══ Garden Tasks Section ═══ */}
          <section className="bg-leaf-light/20 border border-leaf/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-leaf/20">
              <div className="w-9 h-9 rounded-xl bg-leaf-light/60 flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold font-display text-foreground text-lg">{d.gardenTasks}</h3>
            </div>

            <div className="space-y-2">
              {taskItems.map((item, i) => {
                const scheduled = scheduledItems[item.id];
                return (
                  <motion.div
                    key={item.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                      scheduled
                        ? "bg-[#d4e8d4] border-[#9dc49d] shadow-soft"
                        : "bg-card border-border/50 shadow-soft hover:shadow-card"
                    }`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-lg">{item.emoji}</span>
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        {item.category && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-body ${categoryColors[item.category] || "bg-muted text-muted-foreground"}`}>
                            {item.categoryLabel || item.category}
                          </span>
                        )}
                        {scheduled && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-body font-medium flex items-center gap-1">
                            📅 {scheduled}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-body leading-relaxed text-muted-foreground">
                        {item.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => openExportDialog(item, e)}
                        className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${scheduled ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        title={scheduleTooltip}
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => deleteItem(item.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-400"
                        title={d.deleteTask}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* ═══ Export Dialog ═══ */}
      <Dialog open={!!exportItem} onOpenChange={(open) => !open && setExportItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-primary" />
              {d.scheduleCalendar}
            </DialogTitle>
            <DialogDescription className="font-body">
              {exportItem?.emoji} {exportItem?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {exportItem?.suggestedStart && (
              <div className="text-xs font-body bg-violet-50 dark:bg-violet-900/20 text-violet-800 dark:text-violet-200 px-3 py-2 rounded-lg border border-violet-200 dark:border-violet-800">
                🌙 {d.lunarRecommended} <strong>{formatDateRange(exportItem.suggestedStart, exportItem.suggestedEnd)}</strong>
              </div>
            )}

            <div>
              <label className="text-sm font-body font-medium text-foreground block mb-2">
                {d.whatDay}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal font-body",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, dateFormatStr, { locale: dateLocale }) : d.pickDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={dateLocale}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleGoogleExport}
                disabled={!selectedDate}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="font-body font-medium text-sm block">{d.googleCalendar}</span>
                  <span className="font-body text-xs text-muted-foreground">{d.googleDesc}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={handleICSExport}
                disabled={!selectedDate}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <span className="font-body font-medium text-sm block">{d.appleCalendar}</span>
                  <span className="font-body text-xs text-muted-foreground">{d.appleDesc}</span>
                </div>
                <Download className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground font-body text-center">
              {d.returnLink}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
