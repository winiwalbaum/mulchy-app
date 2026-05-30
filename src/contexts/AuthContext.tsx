import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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
  const checkedRef = useRef<Set<string>>(new Set());

  // Async check: does this Google user have a claimed invite code or profile?
  // Called outside onAuthStateChange callback to avoid async-in-listener issues.
  const checkGoogleAccess = async (userId: string) => {
    if (checkedRef.current.has(userId)) return; // already checked this session
    checkedRef.current.add(userId);

    // 1. Check invite_codes where used_by = userId
    const { data: codeData } = await supabase
      .from("invite_codes")
      .select("id")
      .eq("used_by", userId)
      .maybeSingle();
    if (codeData) return; // has claimed code → allow

    // 2. Fallback: check profiles (completed onboarding = had valid invite)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (profileData) return; // has profile → allow

    // No code and no profile → block
    setAwaitingInviteCode(true);
  };

  useEffect(() => {
    // Single source of truth: onAuthStateChange handles everything
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (!session) {
          setAwaitingInviteCode(false);
          checkedRef.current.clear();
          return;
        }

        if (session.user.app_metadata?.provider === "google") {
          const pendingCodeId = localStorage.getItem("pendingInviteCode");
          if (pendingCodeId) {
            localStorage.removeItem("pendingInviteCode");
            // Claim pre-validated code asynchronously (non-blocking)
            supabase.rpc("claim_invite_code", {
              p_code_id: pendingCodeId,
              p_user_id: session.user.id,
            }).then(() => generateUserInviteCodes(session.user.id));
          } else {
            // Run async check outside the synchronous callback
            setTimeout(() => checkGoogleAccess(session.user.id), 0);
          }
        }
      }
    );

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
    const { error: rpcError } = await supabase.rpc("claim_invite_code", {
      p_code_id: data.id,
      p_user_id: user.id,
    });
    if (rpcError) return false;
    await generateUserInviteCodes(user.id);
    checkedRef.current.delete(user.id); // allow re-check after claiming
    setAwaitingInviteCode(false);
    return true;
  };

  const signOut = async () => {
    checkedRef.current.clear();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, awaitingInviteCode, claimGoogleInvite, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
