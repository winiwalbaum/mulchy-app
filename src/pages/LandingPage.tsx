import { motion } from "framer-motion";
import { CalendarDays, BookOpen, Sprout, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

// Simple decorative leaf SVG
const LeafMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 170" className={className} fill="none" aria-hidden>
    <path
      d="M50 4 C72 4 90 28 90 72 C90 120 68 158 50 166 C32 158 10 120 10 72 C10 28 28 4 50 4Z"
      fill="#6aad6a"
      opacity="0.22"
    />
    <line x1="50" y1="4" x2="50" y2="166" stroke="#6aad6a" strokeWidth="1.2" opacity="0.18" />
    <path d="M50 50 Q34 65 26 80" stroke="#6aad6a" strokeWidth="0.9" opacity="0.14" />
    <path d="M50 75 Q32 94 24 112" stroke="#6aad6a" strokeWidth="0.9" opacity="0.14" />
    <path d="M50 100 Q34 118 28 136" stroke="#6aad6a" strokeWidth="0.9" opacity="0.14" />
    <path d="M50 50 Q66 65 74 80" stroke="#6aad6a" strokeWidth="0.9" opacity="0.14" />
    <path d="M50 75 Q68 94 76 112" stroke="#6aad6a" strokeWidth="0.9" opacity="0.14" />
    <path d="M50 100 Q66 118 72 136" stroke="#6aad6a" strokeWidth="0.9" opacity="0.14" />
  </svg>
);

const HeroSection = () => {
  const { t } = useLanguage();
  const l = t.landing as any;

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #f4f8f2 0%, #eef5eb 60%, #f0f6ee 100%)" }}
    >
      {/* Leaf watermarks — scattered around the edges */}
      <LeafMark className="absolute -top-8 -left-8 w-52 h-52 rotate-[-20deg] pointer-events-none select-none" />
      <LeafMark className="absolute top-4 -right-10 w-44 h-44 rotate-[30deg] pointer-events-none select-none" />
      <LeafMark className="absolute top-1/3 -left-14 w-60 h-60 rotate-[-35deg] pointer-events-none select-none" />
      <LeafMark className="absolute top-1/2 -right-12 w-48 h-48 rotate-[50deg] pointer-events-none select-none" />
      <LeafMark className="absolute bottom-10 -left-6 w-56 h-56 rotate-[15deg] pointer-events-none select-none" />
      <LeafMark className="absolute -bottom-10 right-4 w-52 h-52 rotate-[-25deg] pointer-events-none select-none" />
      <LeafMark className="absolute bottom-1/3 right-10 w-36 h-36 rotate-[40deg] pointer-events-none select-none" />
      <LeafMark className="absolute top-20 left-1/3 w-28 h-28 rotate-[10deg] pointer-events-none select-none opacity-60" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 py-16 max-w-sm mx-auto">
        {/* Large Polaroid logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-8"
        >
          <img
            src="/logo.png"
            alt="MULCHY"
            className="w-52 h-52 object-contain drop-shadow-2xl"
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="font-display font-bold text-4xl text-gray-800 tracking-tight leading-tight">
            {l.title1}
          </h1>
          <p className="font-display italic text-lg text-gray-400 mt-1 mb-3">
            {l.title2}
          </p>
          <p className="font-body text-sm text-gray-500 leading-relaxed max-w-xs mx-auto mb-8">
            {l.subtitle}
          </p>
          <Button size="lg" asChild className="rounded-full px-10 font-body font-medium">
            <Link to="/dashboard">{l.startNow}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const { t } = useLanguage();
  const f = t.landing as any;
  const ff = f.features as any;
  const features = [
    { icon: CalendarDays, ...ff.calendar },
    { icon: Sprout, ...ff.library },
    { icon: BookOpen, ...ff.journal },
    { icon: Leaf, ...ff.alerts },
  ];
  return (
    <section className="py-24 bg-gradient-earth">
      <div className="container">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{ff.title}</h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">{ff.subtitle}</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div key={feature.title} className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow duration-300" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <div className="w-12 h-12 rounded-lg bg-leaf-light/40 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SeasonBanner = () => {
  const { t } = useLanguage();
  const s = (t.landing as any).seasonBanner as any;
  return (
    <section className="py-16">
      <div className="container">
        <div className="rounded-2xl p-10 md:p-16 text-center border border-border bg-card">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-sm uppercase tracking-widest text-earth-light font-body mb-3">{s.month}</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{s.title}</h2>
            <p className="text-muted-foreground font-body max-w-md mx-auto mb-8">{s.desc}</p>
            <Button variant="hero" size="lg" asChild><Link to="/dashboard">{s.cta}</Link></Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const { t } = useLanguage();
  const l = t.landing as any;
  return (
    <footer className="border-t border-border py-10">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHY" />
          <span className="font-display font-semibold text-lg">{l.title1} {l.title2}</span>
        </div>
        <p className="text-sm text-muted-foreground font-body">{l.footer}</p>
      </div>
    </footer>
  );
};

const LandingPage = () => (
  <main>
    <HeroSection />
    <FeaturesSection />
    <SeasonBanner />
    <Footer />
  </main>
);

export default LandingPage;
