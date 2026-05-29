import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Ticket, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { generateUserInviteCodes } from "@/lib/inviteUtils";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const a = t.auth as any;
  const { awaitingInviteCode, claimGoogleInvite, signOut } = useAuth();

  const validateInviteCode = async (code: string): Promise<string | null> => {
    const normalized = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from("invite_codes")
      .select("id, used_by, is_active, expires_at")
      .eq("code", normalized)
      .single();
    if (error || !data) return null;
    if (!data.is_active) return null;
    if (data.used_by) return null;
    if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
    return data.id;
  };

  const claimInviteCode = async (codeId: string, userId: string) => {
    await supabase
      .from("invite_codes")
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq("id", codeId);
    // Give the new user their 2 invite codes
    await generateUserInviteCodes(userId);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(a.welcomeBackToast);
        navigate("/");
      } else {
        const codeId = await validateInviteCode(inviteCode);
        if (!codeId) {
          toast.error(a.invalidInviteCode);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.user) await claimInviteCode(codeId, data.user.id);
        toast.success(a.accountCreated);
      }
    } catch (error: any) {
      toast.error(error.message || a.authError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (!isLogin) {
        if (!inviteCode.trim()) {
          toast.error(a.invalidInviteCode);
          return;
        }
        const codeId = await validateInviteCode(inviteCode);
        if (!codeId) {
          toast.error(a.invalidInviteCode);
          return;
        }
        localStorage.setItem("pendingInviteCode", codeId);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) toast.error(a.authError);
    } catch {
      toast.error(a.authError);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimGoogleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setClaimLoading(true);
    const ok = await claimGoogleInvite(inviteCode);
    setClaimLoading(false);
    if (!ok) {
      toast.error(a.invalidInviteCode);
    }
    // On success, awaitingInviteCode becomes false and App.tsx routes normally
  };

  if (awaitingInviteCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" className="w-20 h-20 object-contain" alt="MULCHII" />
            </div>
            <h1 className="text-2xl font-bold font-display mb-2">🌱 {a.inviteCode}</h1>
            <p className="text-muted-foreground font-body text-sm">{a.inviteOnlyNotice}</p>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <form onSubmit={handleClaimGoogleInvite} className="space-y-4">
              <div>
                <Label htmlFor="claimCode" className="font-body text-sm">{a.inviteCode}</Label>
                <div className="relative mt-1">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="claimCode"
                    type="text"
                    placeholder="MULCHII-BETA-001"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="pl-10 font-mono tracking-widest"
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={claimLoading || !inviteCode.trim()}>
                {claimLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (t.common as any).next}
              </Button>
            </form>
            <button onClick={() => signOut()} className="w-full mt-3 text-sm text-muted-foreground font-body hover:text-foreground text-center">
              {(t.common as any).back}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-36 h-36 flex items-center justify-center">
              <img src="/logo.png" className="w-full h-full object-contain" alt="MULCHII" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display mb-2">
            {isLogin ? a.welcomeBack : a.createAccount}
          </h1>
          <p className="text-muted-foreground font-body">
            {isLogin ? a.loginSubtitle : a.signupSubtitle}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          {!isLogin && (
            <div className="mb-5 bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-sm font-body text-muted-foreground text-center">
                🌱 {a.inviteOnlyNotice}
              </p>
            </div>
          )}

          {!isLogin && (
            <div className="mb-4">
              <Label htmlFor="inviteCode" className="font-body text-sm">{a.inviteCode}</Label>
              <div className="relative mt-1">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="MULCHII-BETA-001"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="pl-10 font-mono tracking-widest"
                />
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full mb-4 h-12 font-body text-base"
            onClick={handleGoogleLogin}
            disabled={loading || (!isLogin && !inviteCode.trim())}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {a.continueGoogle}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground font-body">{a.orEmail}</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-body text-sm">{a.email}</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 font-body" required />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="font-body text-sm">{a.password}</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 font-body" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? ((t.common as any).loading) : isLogin ? a.login : a.signup}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground font-body mt-4">
            {isLogin ? a.noAccount : a.hasAccount}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? a.register : a.signIn}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
