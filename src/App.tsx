import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useProfile } from "@/hooks/useProfile";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import BibliotecaPage from "./pages/BibliotecaPage";
import SemilleroPage from "./pages/SemilleroPage";

import BitacoraPage from "./pages/BitacoraPage";
import ProfilePage from "./pages/ProfilePage";
import CommunityPage from "./pages/CommunityPage";
import PestScannerPage from "./pages/PestScannerPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading } = useProfile();
  // Never block rendering while profile is loading — pages handle null profile gracefully.
  // Only redirect to onboarding once we know for sure the profile exists and is incomplete.
  if (!loading && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const showBottomNavRoutes = ["/dashboard", "/semillero", "/biblioteca", "/bitacora", "/comunidad", "/perfil", "/plagas"];

const AppLayout = () => {
  const location = useLocation();
  const showNav = showBottomNavRoutes.includes(location.pathname);

  return (
    <>
      <AppRoutes />
      {showNav && <BottomNav />}
    </>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/auth"
        element={user && !loading ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route
        path="/onboarding"
        element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>}
      />
      <Route
        path="/"
        element={<ProtectedRoute><OnboardingGuard><LandingPage /></OnboardingGuard></ProtectedRoute>}
      />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><OnboardingGuard><DashboardPage /></OnboardingGuard></ProtectedRoute>}
      />
      <Route
        path="/semillero"
        element={<ProtectedRoute><OnboardingGuard><SemilleroPage /></OnboardingGuard></ProtectedRoute>}
      />
      <Route
        path="/biblioteca"
        element={<ProtectedRoute><OnboardingGuard><BibliotecaPage /></OnboardingGuard></ProtectedRoute>}
      />
      <Route
        path="/bitacora"
        element={<ProtectedRoute><OnboardingGuard><BitacoraPage /></OnboardingGuard></ProtectedRoute>}
      />
      <Route
        path="/comunidad"
        element={<ProtectedRoute><OnboardingGuard><CommunityPage /></OnboardingGuard></ProtectedRoute>}
      />
      <Route
        path="/plagas"
        element={<ProtectedRoute><OnboardingGuard><PestScannerPage /></OnboardingGuard></ProtectedRoute>}
      />
      <Route
        path="/perfil"
        element={<ProtectedRoute><OnboardingGuard><ProfilePage /></OnboardingGuard></ProtectedRoute>}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <LanguageProvider>
              <AppLayout />
            </LanguageProvider>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
