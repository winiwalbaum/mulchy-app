import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import es, { type Translations } from "./es";
import en from "./en";
import { useProfile } from "@/hooks/useProfile";

type Language = "es" | "en";

interface LanguageContextType {
  lang: Language;
  t: Translations;
  setLang: (lang: Language) => void;
}

const translations: Record<Language, Translations> = { es, en };

const LanguageContext = createContext<LanguageContextType>({
  lang: "es",
  t: es,
  setLang: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useProfile();
  const [lang, setLang] = useState<Language>("es");

  // Sync from profile once loaded
  useEffect(() => {
    if (profile?.language && (profile.language === "es" || profile.language === "en")) {
      setLang(profile.language);
    }
  }, [profile?.language]);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
