import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, MapPin, Thermometer, Wind, Navigation, Globe, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import LocationPicker from "@/components/LocationPicker";
import { useLanguage } from "@/i18n/LanguageContext";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { profile, loading, refetch } = useProfile();
  const navigate = useNavigate();
  const [showMap, setShowMap] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { t, lang, setLang } = useLanguage();
  const p = t.profile as any;

  const handleSignOut = async () => {
    await signOut();
    toast.success(p.signedOut);
    navigate("/auth");
  };

  const handleLocationChange = async (lat: number, lon: number, cityName: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ latitude: lat, longitude: lon, city: cityName })
      .eq("id", user!.id);

    if (error) {
      toast.error(p.locationError);
    } else {
      toast.success(`${p.locationUpdated}${cityName ? `: ${cityName}` : ""}`);
      refetch();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(p.avatarFileTooLarge);
      return;
    }
    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      // Remove old avatar first (upsert)
      await supabase.storage.from("avatars").remove([path]);
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;
      toast.success(p.avatarUpdated);
      refetch();
    } catch (err: any) {
      toast.error(err.message || p.avatarUploadError);
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center gap-4 py-4">
          <img src="/logo.png" className="w-7 h-7 object-contain" alt="MULCHY" />
          <h1 className="text-xl font-semibold">{p.title}</h1>
        </div>
      </header>

      <div className="container py-8 max-w-md mx-auto space-y-6">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center">
          {/* Avatar — clickable */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="relative w-20 h-20 mx-auto mb-3 block focus:outline-none"
          >
            {/* Avatar circle — overflow-hidden solo aquí */}
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-card">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <img src="/logo.png" className="w-4/5 h-4/5 object-contain" alt="MULCHY" />
                </div>
              )}
            </div>
            {/* Camera badge — fuera del clip, siempre visible */}
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-sm">
              {avatarUploading
                ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                : <Camera className="w-3 h-3 text-white" />
              }
            </div>
          </button>

          <h2 className="text-xl font-bold font-display">
            {profile?.display_name || p.defaultName}
          </h2>
          {profile?.pronoun && (
            <span className="text-sm text-muted-foreground font-body">({profile.pronoun})</span>
          )}
          <p className="text-sm text-muted-foreground font-body mt-1">{user?.email}</p>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border space-y-3">
          <h3 className="font-semibold font-display flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {p.locationClimate}
          </h3>

          {!showMap && profile?.city && (
            <p className="text-sm font-body text-muted-foreground">📍 {profile.city}</p>
          )}
          {!showMap && profile?.latitude && profile?.longitude && (
            <p className="text-xs text-muted-foreground font-body">
              {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
            </p>
          )}

          {showMap ? (
            <div className="space-y-2">
              <LocationPicker latitude={profile?.latitude ?? null} longitude={profile?.longitude ?? null} city={profile?.city ?? ""} onLocationChange={handleLocationChange} />
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowMap(false)}>
                {p.closeMap}
              </Button>
            </div>
          ) : (
            <Button variant={profile?.latitude ? "outline" : "default"} className="w-full" onClick={() => setShowMap(true)}>
              <Navigation className="w-4 h-4 mr-2" />
              {profile?.latitude ? p.changeLocation : p.selectLocation}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            {profile?.min_temp != null && (
              <div className="bg-muted rounded-lg p-3">
                <Thermometer className="w-4 h-4 text-primary mb-1" />
                <p className="text-xs text-muted-foreground font-body">{p.min}</p>
                <p className="font-semibold font-body">{profile.min_temp}°C</p>
              </div>
            )}
            {profile?.max_temp != null && (
              <div className="bg-muted rounded-lg p-3">
                <Thermometer className="w-4 h-4 text-destructive mb-1" />
                <p className="text-xs text-muted-foreground font-body">{p.max}</p>
                <p className="font-semibold font-body">{profile.max_temp}°C</p>
              </div>
            )}
          </div>
          {profile?.wind_exposure && profile.wind_exposure !== "none" && (
            <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
              <Wind className="w-4 h-4" />
              {p.wind} {profile.wind_exposure}
            </div>
          )}
        </div>

        {/* Language selector */}
        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border space-y-3">
          <h3 className="font-semibold font-display flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            {p.language}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {([["es", "🇪🇸", "Español"], ["en", "🇬🇧", "English"]] as const).map(([code, flag, label]) => (
              <button
                key={code}
                onClick={async () => {
                  setLang(code);
                  const { error } = await supabase
                    .from("profiles")
                    .update({ language: code })
                    .eq("id", user!.id);
                  if (!error) {
                    toast.success(code === "es" ? "Idioma actualizado" : "Language updated");
                    refetch();
                  }
                }}
                className={`p-4 rounded-xl text-center transition-all border ${
                  lang === code
                    ? "bg-primary text-primary-foreground border-primary shadow-soft"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                <span className="text-2xl block mb-1">{flag}</span>
                <span className="font-body text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          {p.signOut}
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
