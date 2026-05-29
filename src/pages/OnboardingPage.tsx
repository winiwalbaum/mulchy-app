import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
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


const OnboardingPage = () => {
  const { user } = useAuth();
  const { refetch: refetchProfile } = useProfile();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
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


  const totalSteps = 4;
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

      await refetchProfile();
      toast.success(ob.gardenReady as string);
      navigate("/");
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
          <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHY" />
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
                        <Input
                          type="number"
                          value={minTemp}
                          onChange={(e) => setMinTemp(e.target.value)}
                          placeholder="-3"
                          className="mt-1 font-body"
                        />
                        <p className="text-[10px] text-muted-foreground font-body mt-1">{ob.minTempHint as string}</p>
                      </div>
                      <div>
                        <Label className="font-body text-xs text-muted-foreground">{ob.maxTemp as string}</Label>
                        <Input
                          type="number"
                          value={maxTemp}
                          onChange={(e) => setMaxTemp(e.target.value)}
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
              {(t.common as any).next}
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
