import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { generateUserInviteCodes } from "@/lib/inviteUtils";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  awaitingInviteCode: boolean;
  claimGoogleInvite: (code: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  awaitingInviteCode: false,
  claimGoogleInvite: async () => false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [awaitingInviteCode, setAwaitingInviteCode] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (!session) {
          setAwaitingInviteCode(false);
          return;
        }

        // Enforce invite code for new Google OAuth users
        if (session.user.app_metadata?.provider === "google") {
          const createdAt = new Date(session.user.created_at);
          const isNewUser = Date.now() - createdAt.getTime() < 120_000;
          if (isNewUser) {
            const pendingCodeId = localStorage.getItem("pendingInviteCode");
            localStorage.removeItem("pendingInviteCode");
            if (pendingCodeId) {
              // Claim the pre-validated invite code
              supabase
                .from("invite_codes")
                .update({ used_by: session.user.id, used_at: new Date().toISOString() })
                .eq("id", pendingCodeId)
                .then(() => {});
            } else {
              // New Google user without invite code — block until they enter one
              setAwaitingInviteCode(true);
            }
          } else {
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

  const claimGoogleInvite = async (code: string): Promise<boolean> => {
    if (!user) return false;
    const normalized = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from("invite_codes")
      .select("id, used_by, is_active, expires_at")
      .eq("code", normalized)
      .single();
    if (error || !data || !data.is_active || data.used_by) return false;
    if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
    const { error: updateError } = await supabase
      .from("invite_codes")
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq("id", data.id);
    if (updateError) return false;
    // Give the new user their 2 invite codes
    await generateUserInviteCodes(user.id);
    setAwaitingInviteCode(false);
    return true;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, awaitingInviteCode, claimGoogleInvite, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
