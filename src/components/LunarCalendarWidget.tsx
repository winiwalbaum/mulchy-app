import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import {
  getLunarPeriodsForMonth,
  getCurrentLunarPeriod,
  moonPhaseInfo,
  SOURCE_URL,
  SOURCE_NAME,
  MOON_PHASES_SOURCE_URL,
  MOON_PHASES_SOURCE_NAME,
  type LunarPeriod,
} from "@/data/lunarCalendar";
import { useLanguage } from "@/i18n/LanguageContext";

interface LunarCalendarWidgetProps {
  month: number;
  isSouthernHemisphere?: boolean;
  compact?: boolean;
}

const LunarCalendarWidget = ({ month, isSouthernHemisphere = true, compact = false }: LunarCalendarWidgetProps) => {
  const { t, lang } = useLanguage();
  const lunar = t.lunar as any;
  const d = t.dashboard as any;
  const monthsShort = (d.monthsShort || d.months) as string[];
  const [expanded, setExpanded] = useState(!compact);

  const periods = useMemo(() => getLunarPeriodsForMonth(month + 1), [month]);
  const currentPeriod = getCurrentLunarPeriod();

  const l = <T,>(es: T, en: T): T => lang === "en" ? en : es;

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start + "T12:00:00");
    const e = new Date(end + "T12:00:00");
    const mo = monthsShort.map(m => m.slice(0, 3));
    if (s.getMonth() === e.getMonth() && s.getDate() === e.getDate()) {
      return `${s.getDate()} ${mo[s.getMonth()]}`;
    }
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()}–${e.getDate()} ${mo[s.getMonth()]}`;
    }
    return `${s.getDate()} ${mo[s.getMonth()]} – ${e.getDate()} ${mo[e.getMonth()]}`;
  };

  if (periods.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
          <Moon className="w-5 h-5 text-violet-700 dark:text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold font-display text-sm">{lunar.title}</p>
          <p className="text-xs text-muted-foreground font-body">
            {currentPeriod
              ? `${currentPeriod.emoji} ${l(currentPeriod.recommendation, currentPeriod.recommendation_en)}`
              : `${periods.length} ${lunar.periodsThisMonth}`}
          </p>
        </div>
        {compact && (
          expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={compact ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {periods.map((period) => {
                const phaseInfo = moonPhaseInfo[period.phase];
                const isActive = currentPeriod?.id === period.id;

                return (
                  <LunarPeriodCard
                    key={period.id}
                    period={period}
                    phaseInfo={phaseInfo}
                    isActive={isActive}
                    isSouthernHemisphere={isSouthernHemisphere}
                    lang={lang}
                    southernHemLabel={d.southernHem}
                    formatDateRange={formatDateRange}
                  />
                );
              })}

              <div className="flex flex-wrap gap-3 pt-2">
                <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-body">
                  <ExternalLink className="w-3 h-3" />
                  {SOURCE_NAME}
                </a>
                <a href={MOON_PHASES_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-body">
                  <ExternalLink className="w-3 h-3" />
                  {MOON_PHASES_SOURCE_NAME}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LunarPeriodCard = ({
  period,
  phaseInfo,
  isActive,
  isSouthernHemisphere,
  lang,
  southernHemLabel,
  formatDateRange,
}: {
  period: LunarPeriod;
  phaseInfo: typeof moonPhaseInfo.nueva;
  isActive: boolean;
  isSouthernHemisphere: boolean;
  lang: string;
  southernHemLabel: string;
  formatDateRange: (start: string, end: string) => string;
}) => {
  const [showDetails, setShowDetails] = useState(isActive);
  const l = <T,>(es: T, en: T): T => lang === "en" ? en : es;
  const today = lang === "en" ? "TODAY" : "HOY";

  return (
    <div
      className={`rounded-xl border transition-all ${
        isActive ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border/50 bg-background"
      }`}
    >
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-start gap-3 p-3 text-left"
      >
        <span className="text-xl mt-0.5">{period.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium font-body text-muted-foreground">
              {formatDateRange(period.startDate, period.endDate)}
            </span>
            {isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-body font-medium">
                {today}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold mt-0.5">{l(period.label, period.label_en)}</p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">{l(period.recommendation, period.recommendation_en)}</p>
        </div>
        {showDetails ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground mt-1 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mt-1 shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              <div className={`text-xs px-2.5 py-1.5 rounded-lg ${phaseInfo.color} font-body`}>
                {l(phaseInfo.description, phaseInfo.description_en)}
              </div>

              <ul className="space-y-1">
                {l(period.activities, period.activities_en).map((activity, i) => (
                  <li key={i} className="text-xs font-body text-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    {activity}
                  </li>
                ))}
              </ul>

              {isSouthernHemisphere && period.southernHemisphereNote && (
                <div className="text-xs font-body bg-accent/10 text-accent-foreground px-2.5 py-1.5 rounded-lg border border-accent/20">
                  🌍 <strong>{southernHemLabel}</strong> {l(period.southernHemisphereNote, period.southernHemisphereNote_en)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LunarCalendarWidget;
