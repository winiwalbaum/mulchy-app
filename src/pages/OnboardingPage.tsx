import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Thermometer, ChevronRight, ChevronLeft, Check, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import LocationPicker from "@/components/LocationPicker";

const FEATURES = (lang: "es" | "en") => [
  {
    emoji: "📓",
    title: lang === "en" ? "Garden Journal" : "Bitácora",
    desc: lang === "en"
      ? "Log your crops day by day — photos, notes, and personalized tracking based on your climate and location."
      : "Registra tus cultivos día a día — fotos, notas y seguimiento personalizado según tu clima y ubicación.",
    color: "bg-green-50 border-green-100",
  },
  {
    emoji: "🌱",
    title: lang === "en" ? "Seed Library" : "Semillero",
    desc: lang === "en"
      ? "Discover varieties documented by the community. Add your own and share your growing experience."
      : "Descubre variedades documentadas por la propia comunidad. Agrega las tuyas y comparte tu experiencia de cultivo.",
    color: "bg-emerald-50 border-emerald-100",
  },
  {
    emoji: "🤝",
    title: lang === "en" ? "Community" : "Comunidad",
    desc: lang === "en"
      ? "Share photos and learnings with other gardeners. A living collective memory that grows with every user."
      : "Comparte fotos y aprendizajes con otros huerteros. Una memoria colectiva viva que crece con cada usuario.",
    color: "bg-teal-50 border-teal-100",
  },
  {
    emoji: "📅",
    title: lang === "en" ? "Garden Calendar" : "Tareas del mes",
    desc: lang === "en"
      ? "Export your monthly garden tasks to Google Calendar or iCal with one tap. Never forget when to sow, transplant or harvest."
      : "Exporta las tareas de tu huerta a Google Calendar o iCal con un toque. Nunca olvides cuándo sembrar, trasplantar o cosechar.",
    color: "bg-sky-50 border-sky-100",
  },
];


const OnboardingPage = () => {
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0: Language
  const [selectedLang, setSelectedLang] = useState<"es" | "en">(lang);

  // Step 1: Identity
  const [displayName, setDisplayName] = useState("");
  const [pronoun, setPronoun] = useState("");

  // Step 2: Location
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [city, setCity] = useState("");

  // Step 3: Climate
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [frostType, setFrostType] = useState("heladas_ocasionales");


  const [featureSlide, setFeatureSlide] = useState(0);

  const totalSteps = 5;
  const ob = t.onboarding as any;
  const frostOpts = ob.frostOptions as { value: string; label: string; emoji: string; desc: string }[];
  const pronounOpts = ob.pronounOptions as string[];

  const handleLangSelect = (l: "es" | "en") => {
    setSelectedLang(l);
    setLang(l);
  };

  const handleLocationChange = (lat: number, lon: number, cityName: string) => {
    setLatitude(lat);
    setLongitude(lon);
    setCity(cityName);
  };


  const canProceed = () => {
    switch (step) {
      case 0: return true; // language always selected
      case 1: return displayName.trim().length > 0;
      case 4: return featureSlide === FEATURES(lang).length - 1;
      default: return true;
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          pronoun,
          latitude,
          longitude,
          city,
          min_temp: minTemp ? parseFloat(minTemp) : null,
          max_temp: maxTemp ? parseFloat(maxTemp) : null,
          wind_exposure: frostType,
          has_valley_effect: false,
          onboarding_completed: true,
          language: selectedLang,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast.success(ob.gardenReady as string);
      // Use full reload so ProfileContext re-fetches the updated profile
      // (with onboarding_completed: true) before OnboardingGuard runs.
      // A simple navigate("/") has a race where the guard still sees the
      // old cached profile and loops back to /onboarding.
      window.location.replace("/dashboard");
    } catch (error: any) {
      toast.error(error.message || (ob.saveError as string));
    } finally {
      setSaving(false);
    }
  };

  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHII" />
          <span className="font-display font-semibold">{ob.setup as string}</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground font-body mt-2">
          {(ob.stepOf as string).replace("{step}", String(step + 1)).replace("{total}", String(totalSteps))}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* Step 0: Language */}
            {step === 0 && (
              <motion.div key="step-0" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold font-display">{ob.chooseLang as string}</h2>
                </div>
                <p className="text-muted-foreground font-body mb-6">{ob.chooseLangDesc as string}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleLangSelect("es")}
                    className={`p-5 rounded-xl text-center transition-all border ${
                      selectedLang === "es"
                        ? "bg-primary text-primary-foreground border-primary shadow-soft"
                        : "bg-card border-border hover:bg-muted"
                    }`}
                  >
                    <span className="text-3xl block mb-2">🇪🇸</span>
                    <span className="font-body text-sm font-medium">Español</span>
                  </button>
                  <button
                    onClick={() => handleLangSelect("en")}
                    className={`p-5 rounded-xl text-center transition-all border ${
                      selectedLang === "en"
                        ? "bg-primary text-primary-foreground border-primary shadow-soft"
                        : "bg-card border-border hover:bg-muted"
                    }`}
                  >
                    <span className="text-3xl block mb-2">🇬🇧</span>
                    <span className="font-body text-sm font-medium">English</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 1: Identity */}
            {step === 1 && (
              <motion.div key="step-1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <h2 className="text-2xl font-bold font-display mb-2">{ob.whatsYourName as string}</h2>
                <p className="text-muted-foreground font-body mb-6">{ob.nameDesc as string}</p>
                <div className="space-y-4">
                  <div>
                    <Label className="font-body">{ob.yourName as string}</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={ob.namePlaceholder as string}
                      className="mt-1 font-body"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="font-body mb-2 block">{ob.pronoun as string}</Label>
                    <div className="flex gap-2">
                      {pronounOpts.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPronoun(p)}
                          className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${
                            pronoun === p
                              ? "bg-primary text-primary-foreground"
                              : "bg-card text-muted-foreground hover:bg-muted border border-border"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <motion.div key="step-2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold font-display">{ob.yourLocation as string}</h2>
                </div>
                <p className="text-muted-foreground font-body mb-4">{ob.locationDesc as string}</p>
                <LocationPicker latitude={latitude} longitude={longitude} city={city} onLocationChange={handleLocationChange} />
              </motion.div>
            )}

            {/* Step 3: Climate */}
            {step === 3 && (
              <motion.div key="step-3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold font-display">{ob.microclimate as string}</h2>
                </div>
                <p className="text-muted-foreground font-body mb-6">{ob.microclimateDesc as string}</p>
                <div className="space-y-5">
                  {/* Tipo de invierno */}
                  <div>
                    <Label className="font-body text-sm font-medium mb-3 block">{ob.frostType as string}</Label>
                    <div className="space-y-2">
                      {frostOpts.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFrostType(opt.value)}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all border ${
                            frostType === opt.value
                              ? "bg-primary text-primary-foreground border-primary shadow-soft"
                              : "bg-card text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          <span className="text-2xl">{opt.emoji}</span>
                          <div>
                            <span className="font-body text-sm font-semibold block">{opt.label}</span>
                            <span className={`font-body text-xs ${frostType === opt.value ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                              {opt.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Temperaturas extremas (opcionales) */}
                  <div>
                    <Label className="font-body text-sm font-medium mb-3 block">
                      {lang === "en" ? "Extreme temperatures (optional)" : "Temperaturas extremas (opcional)"}
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="font-body text-xs text-muted-foreground">{ob.minTemp as string}</Label>
                        <div className="flex mt-1 gap-1">
                          <button
                            type="button"
                            onClick={() => setMinTemp(v => v.startsWith("-") ? v.slice(1) : v ? "-" + v : "-")}
                            className="px-3 rounded-md border border-input bg-muted text-sm font-mono hover:bg-muted/80 flex-shrink-0"
                            title="Cambiar signo"
                          >±</button>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={minTemp}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, "");
                              setMinTemp(prev => (prev.startsWith("-") ? "-" : "") + raw);
                            }}
                            placeholder="3"
                            className="font-body"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-body mt-1">{ob.minTempHint as string}</p>
                      </div>
                      <div>
                        <Label className="font-body text-xs text-muted-foreground">{ob.maxTemp as string}</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={maxTemp}
                          onChange={(e) => setMaxTemp(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="35"
                          className="mt-1 font-body"
                        />
                        <p className="text-[10px] text-muted-foreground font-body mt-1">{ob.maxTempHint as string}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {/* Step 4: Feature tour */}
            {step === 4 && (() => {
              const features = FEATURES(lang);
              const f = features[featureSlide];
              return (
                <motion.div key="step-4" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className="text-2xl font-bold font-display mb-1">
                    {lang === "en" ? "What can you do?" : "¿Qué puedes hacer?"}
                  </h2>
                  <p className="text-muted-foreground font-body mb-6 text-sm">
                    {lang === "en" ? "Explore the main features" : "Explora las funciones principales"}
                  </p>

                  <div className={`rounded-2xl border p-6 min-h-[200px] flex flex-col items-center justify-center text-center transition-colors ${f.color}`}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={featureSlide}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center"
                      >
                        <span className="text-6xl mb-4 select-none">{f.emoji}</span>
                        <h3 className="font-display font-bold text-xl mb-2">{f.title}</h3>
                        <p className="text-muted-foreground font-body text-sm leading-relaxed max-w-xs">{f.desc}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Arrows + dots */}
                  <div className="flex items-center justify-between mt-5">
                    <button
                      onClick={() => setFeatureSlide(s => Math.max(0, s - 1))}
                      disabled={featureSlide === 0}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex gap-2">
                      {features.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setFeatureSlide(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === featureSlide ? "bg-primary w-5" : "bg-muted-foreground/30"}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setFeatureSlide(s => Math.min(features.length - 1, s + 1))}
                      disabled={featureSlide === features.length - 1}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8">
        <div className="flex gap-3 max-w-md mx-auto">
          {step > 0 && (
            <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)} className="flex-1">
              <ChevronLeft className="w-4 h-4" />
              {(t.common as any).back}
            </Button>
          )}
          {step < totalSteps - 1 ? (
            <Button variant="hero" size="lg" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="flex-1">
              {step === 4 - 1 ? (lang === "en" ? "See features" : "Ver funciones") : (t.common as any).next}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="hero" size="lg" onClick={handleFinish} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {ob.saving as string}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {ob.finish as string}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
