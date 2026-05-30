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
    // Synchronous listener — no async here to avoid blank screen issues
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (!session) {
          setAwaitingInviteCode(false);
          return;
        }

        if (session.user.app_metadata?.provider === "google") {
          const pendingCodeId = localStorage.getItem("pendingInviteCode");
          localStorage.removeItem("pendingInviteCode");
          if (pendingCodeId) {
            // Claim pre-validated code (user went through signup flow)
            supabase.rpc("claim_invite_code", {
              p_code_id: pendingCodeId,
              p_user_id: session.user.id,
            }).then(() => generateUserInviteCodes(session.user.id));
          } else {
            const createdAt = new Date(session.user.created_at);
            const isNewUser = Date.now() - createdAt.getTime() < 10 * 60_000; // 10 min
            if (isNewUser) {
              setAwaitingInviteCode(true);
            }
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

  // Secondary async check: verify existing Google users have a claimed code
  useEffect(() => {
    if (!user || user.app_metadata?.provider !== "google") return;
    if (awaitingInviteCode) return; // already waiting

    supabase
      .from("invite_codes")
      .select("id")
      .eq("used_by", user.id)
      .maybeSingle()
      .then(({ data: codeData }) => {
        if (codeData) return; // has claimed code → fine
        // Fallback: check profiles
        supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data: profileData }) => {
            if (!profileData) setAwaitingInviteCode(true);
          });
      });
  }, [user?.id]);

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
    const { error: rpcError } = await supabase.rpc("claim_invite_code", {
      p_code_id: data.id,
      p_user_id: user.id,
    });
    if (rpcError) return false;
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
