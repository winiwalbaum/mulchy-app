import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Camera, Upload, Loader2, Bug, ShieldCheck, AlertTriangle,
  RotateCcw, Sprout, Pill, Shield, Scan,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

type ScanMode = "pest" | "plant";

interface ScanResult {
  identified: boolean;
  pest_name: string | null;
  scientific_name?: string;
  severity?: "low" | "medium" | "high";
  description: string;
  symptoms?: string[];
  treatment?: string[];
  prevention?: string[];
  plant_health: "healthy" | "stressed" | "damaged" | "critical" | "unknown";
}

const PestScannerPage = () => {
  const { t } = useLanguage();
  const p = t.pest as any;
  const sev = p.severity as any;
  const health = p.health as any;

  const [scanMode, setScanMode] = useState<ScanMode>("pest");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const severityConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    low: { label: sev.low, color: "text-primary", bg: "bg-leaf-light/20", icon: ShieldCheck },
    medium: { label: sev.medium, color: "text-earth", bg: "bg-secondary", icon: AlertTriangle },
    high: { label: sev.high, color: "text-destructive", bg: "bg-destructive/10", icon: Bug },
  };

  const healthConfig: Record<string, { label: string; emoji: string }> = {
    healthy: health.healthy,
    stressed: health.stressed,
    damaged: health.damaged,
    critical: health.critical,
    unknown: health.unknown,
  };

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(p.imageTooLarge);
      return;
    }
    setResult(null);
    setImagePreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const analyze = async () => {
    if (!imageBase64) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/identify-pest`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ image: imageBase64, mode: scanMode }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 429) toast.error(p.tooManyRequests);
        else if (res.status === 402) toast.error(p.creditsExhausted);
        else toast.error(errData.error || p.analyzeError);
        return;
      }
      const data: ScanResult = await res.json();
      setResult(data);
    } catch {
      toast.error(p.connectionError);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => { setImagePreview(null); setImageBase64(null); setResult(null); };

  const isPestMode = scanMode === "pest";
  const currentTitle = isPestMode ? p.scannerTitle : p.plantScannerTitle;
  const currentDesc = isPestMode ? p.scannerDesc : p.plantScannerDesc;
  const currentTips = isPestMode
    ? [p.tip1, p.tip2, p.tip3, p.tip4]
    : [p.plantTip1, p.plantTip2, p.plantTip3, p.plantTip4];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center gap-3 py-4">
          <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHY" />
          <h1 className="text-xl font-semibold font-display">{p.title}</h1>
        </div>
      </header>

      <div className="container py-6 max-w-lg mx-auto">
        {/* Mode toggle */}
        <div className="flex bg-muted rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setScanMode("pest"); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold font-display transition-all ${
              isPestMode ? "bg-white shadow-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            <Bug className="w-4 h-4" />
            {p.pestMode}
          </button>
          <button
            onClick={() => { setScanMode("plant"); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold font-display transition-all ${
              !isPestMode ? "bg-white shadow-soft text-foreground" : "text-muted-foreground"
            }`}
          >
            <Sprout className="w-4 h-4" />
            {p.plantMode}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!imagePreview ? (
            <motion.div key={`upload-${scanMode}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-leaf-light/20 flex items-center justify-center mx-auto mb-3">
                  {isPestMode ? <Bug className="w-8 h-8 text-primary" /> : <Scan className="w-8 h-8 text-primary" />}
                </div>
                <h2 className="text-lg font-bold font-display">{currentTitle}</h2>
                <p className="text-sm text-muted-foreground font-body mt-1">{currentDesc}</p>
              </div>

              <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-leaf-light/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Camera className="w-6 h-6 text-primary" /></div>
                <div className="text-left">
                  <p className="font-semibold font-display text-sm">{p.takePhoto}</p>
                  <p className="text-xs text-muted-foreground font-body">{p.takePhotoDesc}</p>
                </div>
              </button>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />

              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border hover:border-primary/40 bg-card transition-colors">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0"><Upload className="w-6 h-6 text-muted-foreground" /></div>
                <div className="text-left">
                  <p className="font-semibold font-display text-sm">{p.uploadImage}</p>
                  <p className="text-xs text-muted-foreground font-body">{p.uploadImageDesc}</p>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileInput} />

              <div className="bg-card rounded-2xl p-4 border border-border mt-6">
                <p className="text-xs font-semibold font-display mb-2">{p.tips}</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground font-body">
                  {currentTips.map((tip: string, i: number) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="relative">
                <img src={imagePreview} alt="Plant" className="w-full rounded-2xl object-cover max-h-72" />
                {analyzing && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-body font-medium">{p.analyzing}</p>
                  </div>
                )}
              </div>

              {!result && !analyzing && (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={reset}><RotateCcw className="w-4 h-4 mr-2" />{p.changePhoto}</Button>
                  <Button className="flex-1" onClick={analyze}>
                    {isPestMode ? <Bug className="w-4 h-4 mr-2" /> : <Scan className="w-4 h-4 mr-2" />}
                    {p.analyze}
                  </Button>
                </div>
              )}

              {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {result.identified ? (
                    <>
                      <div className="bg-card rounded-2xl p-5 border border-border shadow-soft">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            {/* In plant mode, pest_name holds the plant name */}
                            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-0.5">
                              {isPestMode ? "" : p.plantName}
                            </p>
                            <h3 className="font-bold font-display text-lg">{result.pest_name}</h3>
                            {result.scientific_name && <p className="text-xs text-muted-foreground font-body italic">{result.scientific_name}</p>}
                          </div>
                          {result.severity && isPestMode && (
                            <span className={`text-xs px-3 py-1 rounded-full font-body font-medium ${severityConfig[result.severity].bg} ${severityConfig[result.severity].color}`}>
                              {severityConfig[result.severity].label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-body leading-relaxed">{result.description}</p>
                        <div className="mt-3 flex items-center gap-2 text-sm font-body">
                          <span>{healthConfig[result.plant_health]?.emoji}</span>
                          <span className="text-muted-foreground">{p.status} <strong>{healthConfig[result.plant_health]?.label}</strong></span>
                        </div>
                      </div>

                      {/* Symptoms (pest mode) */}
                      {isPestMode && result.symptoms && result.symptoms.length > 0 && (
                        <div className="bg-card rounded-2xl p-4 border border-border">
                          <div className="flex items-center gap-2 mb-2"><Sprout className="w-4 h-4 text-earth" /><h4 className="font-semibold font-display text-sm">{p.symptoms}</h4></div>
                          <ul className="space-y-1">{result.symptoms.map((s, i) => <li key={i} className="text-sm font-body text-muted-foreground flex gap-2"><span className="text-earth">•</span> {s}</li>)}</ul>
                        </div>
                      )}

                      {/* Treatment / Care */}
                      {result.treatment && result.treatment.length > 0 && (
                        <div className="bg-leaf-light/10 rounded-2xl p-4 border border-leaf/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Pill className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold font-display text-sm">
                              {isPestMode ? p.treatment : p.careTips}
                            </h4>
                          </div>
                          <ul className="space-y-1.5">{result.treatment.map((t, i) => <li key={i} className="text-sm font-body text-muted-foreground flex gap-2"><span className="text-primary font-bold">{i + 1}.</span> {t}</li>)}</ul>
                        </div>
                      )}

                      {/* Prevention (pest mode only) */}
                      {isPestMode && result.prevention && result.prevention.length > 0 && (
                        <div className="bg-card rounded-2xl p-4 border border-border">
                          <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-violet" /><h4 className="font-semibold font-display text-sm">{p.prevention}</h4></div>
                          <ul className="space-y-1">{result.prevention.map((pr, i) => <li key={i} className="text-sm font-body text-muted-foreground flex gap-2"><span className="text-violet">•</span> {pr}</li>)}</ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-card rounded-2xl p-5 border border-border text-center">
                      <div className="text-3xl mb-2">{isPestMode ? "🌿" : "🔍"}</div>
                      <h3 className="font-semibold font-display mb-1">
                        {isPestMode ? p.noPests : p.noPlantIdentified}
                      </h3>
                      <p className="text-sm text-muted-foreground font-body">{result.description}</p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full" onClick={reset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {isPestMode ? p.scanAnotherPest : p.scanAnotherPlant}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PestScannerPage;
