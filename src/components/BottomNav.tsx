import { NavLink, useLocation } from "react-router-dom";
import { CalendarDays, Leaf, User, Users, Sprout } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const BottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const n = t.nav as any;

  const navItems = [
    { to: "/dashboard", icon: CalendarDays, label: n.home },
    { to: "/semillero", icon: Sprout, label: n.seeds },
    { to: "/bitacora", icon: Leaf, label: n.journal },
    { to: "/comunidad", icon: Users, label: n.community },
    { to: "/perfil", icon: User, label: n.profile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to} className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full">
              {isActive && (
                <motion.div layoutId="bottomnav-indicator" className="absolute -top-px left-2 right-2 h-0.5 bg-primary rounded-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <item.icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} style={{ width: "1.125rem", height: "1.125rem" }} />
              <span className={`text-[9px] font-body font-medium transition-colors leading-none ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
