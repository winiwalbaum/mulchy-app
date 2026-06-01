import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, MoreVertical } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const STORAGE_KEY = "pwa_banner_dismissed";

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isInStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true;

const PWAInstallBanner = () => {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Never show if already installed or previously dismissed
    if (isInStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Catch Android/Chrome native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show banner after 5 seconds
    const timer = setTimeout(() => setVisible(true), 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        dismiss();
      }
      setDeferredPrompt(null);
    }
  };

  const ios = isIOS();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-20 left-3 right-3 z-50 max-w-md mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl shadow-lg p-4 flex gap-3">
            <img src="/logo.png" alt="Mulchii" className="w-10 h-10 object-contain shrink-0 mt-0.5" />

            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm">
                {lang === "en" ? "Add Mulchii to your home screen" : "Agrega Mulchii a tu pantalla de inicio"}
              </p>

              {ios ? (
                <p className="text-xs text-muted-foreground font-body mt-1 leading-relaxed">
                  {lang === "en"
                    ? <>Tap <Share className="inline w-3.5 h-3.5 align-text-bottom" /> then <strong>"Add to Home Screen"</strong></>
                    : <>Toca <Share className="inline w-3.5 h-3.5 align-text-bottom" /> y luego <strong>"Añadir a pantalla de inicio"</strong></>
                  }
                </p>
              ) : deferredPrompt ? (
                <button
                  onClick={handleInstall}
                  className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-body font-semibold rounded-lg"
                >
                  {lang === "en" ? "Install app" : "Instalar app"}
                </button>
              ) : (
                <p className="text-xs text-muted-foreground font-body mt-1 leading-relaxed">
                  {lang === "en"
                    ? <>Tap <MoreVertical className="inline w-3.5 h-3.5 align-text-bottom" /> then <strong>"Add to Home Screen"</strong></>
                    : <>Toca <MoreVertical className="inline w-3.5 h-3.5 align-text-bottom" /> y luego <strong>"Añadir a pantalla de inicio"</strong></>
                  }
                </p>
              )}
            </div>

            <button
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 self-start"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
