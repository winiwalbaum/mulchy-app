import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileContextType {
  profile: any;
  loading: boolean;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: false,
  refetch: async () => {},
});

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  // Start false — ProtectedRoute (auth) already handles the initial loading gate.
  // This way OnboardingGuard never blocks on profile loading.
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setProfile(data);
      } else if (error) {
        console.warn("Profile fetch error:", error.message);
      }
    } catch (e) {
      console.warn("Profile fetch exception:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for auth to finish before acting
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refetch: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => useContext(ProfileContext);
