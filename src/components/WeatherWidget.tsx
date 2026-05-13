import { motion } from "framer-motion";
import { useWeather } from "@/hooks/useWeather";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/i18n/LanguageContext";
import { Cloud, Droplets, Wind, Thermometer, AlertTriangle, Loader2, CloudOff, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const severityStyles: Record<string, string> = {
  high: "bg-destructive/10 border-destructive/30 text-destructive",
  medium: "bg-secondary border-earth-light/30 text-earth",
  low: "bg-leaf-light/20 border-leaf/20 text-primary",
};

const WeatherWidget = () => {
  const { weather, loading, error } = useWeather();
  const { profile } = useProfile();
  const { t, lang } = useLanguage();
  const w = t.weather as any;
  const p = t.profile as any;

  if (!profile?.latitude || !profile?.longitude) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border shadow-soft">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-body font-medium">{p.locationNotSet}</p>
            <p className="text-xs text-muted-foreground font-body">
              {(p.locationNotSetDesc as string).split("{link}")[0]}
              <Link to="/perfil" className="text-primary underline">{p.yourProfile}</Link>
              {(p.locationNotSetDesc as string).split("{link}")[1]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-body">{w.loading}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CloudOff className="w-4 h-4" />
          <span className="text-sm font-body">{w.unavailable}</span>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const { current, alerts, forecast } = weather;
  const iconUrl = current.icon ? `https://openweathermap.org/img/wn/${current.icon}@2x.png` : null;

  return (
    <motion.div className="space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="bg-card rounded-2xl p-5 border border-border shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {iconUrl ? <img src={iconUrl} alt={current.description} className="w-12 h-12 -ml-1" /> : <Cloud className="w-8 h-8 text-muted-foreground" />}
            <div>
              <p className="text-2xl font-bold font-display">{current.temp.toFixed(0)}°C</p>
              <p className="text-sm text-muted-foreground font-body capitalize">{current.description}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
              <Thermometer className="w-3 h-3" />
              {w.feelsLike} {current.feels_like.toFixed(0)}°
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
              <Droplets className="w-3 h-3" />
              {current.humidity}%
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
              <Wind className="w-3 h-3" />
              {(current.wind_speed * 3.6).toFixed(0)} km/h
            </div>
          </div>
        </div>

        {forecast.length > 0 && (
          <div className="flex gap-2 pt-3 border-t border-border overflow-x-auto">
            {forecast.map((f) => {
              const time = new Date(f.dt * 1000);
              const fIcon = f.icon ? `https://openweathermap.org/img/wn/${f.icon}.png` : null;
              return (
                <div key={f.dt} className="flex flex-col items-center min-w-[56px] py-1">
                  <span className="text-[10px] text-muted-foreground font-body">
                    {time.toLocaleTimeString(lang === "en" ? "en-US" : "es-CL", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {fIcon && <img src={fIcon} alt={f.description} className="w-8 h-8" />}
                  <span className="text-xs font-body font-medium">{f.temp.toFixed(0)}°</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div key={`${alert.type}-${i}`} className={`rounded-xl p-4 border ${severityStyles[alert.severity]}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm font-body">{alert.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default WeatherWidget;
