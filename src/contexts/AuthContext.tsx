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

  // Check DB whether this Google user has already claimed an invite code.
  // Returns true if they have one (can proceed), false if they still need one.
  const googleUserHasCode = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("invite_codes")
      .select("id")
      .eq("used_by", userId)
      .maybeSingle();
    return !!data;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session) {
          setAwaitingInviteCode(false);
          setLoading(false);
          return;
        }

        if (session.user.app_metadata?.provider === "google") {
          // Check if there's a pre-validated code waiting from the signup flow
          const pendingCodeId = localStorage.getItem("pendingInviteCode");
          localStorage.removeItem("pendingInviteCode");

          if (pendingCodeId) {
            // Claim the pre-validated code, then let them in
            await supabase.rpc("claim_invite_code", {
              p_code_id: pendingCodeId,
              p_user_id: session.user.id,
            });
            await generateUserInviteCodes(session.user.id);
            setAwaitingInviteCode(false);
          } else {
            // Check DB — if no claimed code exists, block until they enter one
            const hasCode = await googleUserHasCode(session.user.id);
            setAwaitingInviteCode(!hasCode);
          }
        }

        setLoading(false);
      }
    );

    // Also check on initial session load (returning user opening the app)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.app_metadata?.provider === "google") {
        const hasCode = await googleUserHasCode(session.user.id);
        if (!hasCode) setAwaitingInviteCode(true);
      }

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
    // Use SECURITY DEFINER RPC to bypass RLS
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
