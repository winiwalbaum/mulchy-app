import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Enforce invite code for new Google OAuth users
        if (session?.user && session.user.app_metadata?.provider === "google") {
          const createdAt = new Date(session.user.created_at);
          const isNewUser = Date.now() - createdAt.getTime() < 120_000; // 2 min window
          if (isNewUser) {
            const pendingCodeId = localStorage.getItem("pendingInviteCode");
            localStorage.removeItem("pendingInviteCode");
            if (pendingCodeId) {
              // Claim the validated invite code
              supabase
                .from("invite_codes")
                .update({ used_by: session.user.id, used_at: new Date().toISOString() })
                .eq("id", pendingCodeId)
                .then(() => {});
            } else {
              // New Google user with no invite code — revoke access
              setTimeout(() => supabase.auth.signOut(), 100);
            }
          } else {
            // Returning user — clear any stale pending code
            localStorage.removeItem("pendingInviteCode");
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
