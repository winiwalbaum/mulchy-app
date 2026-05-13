import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  city: string;
  onLocationChange: (lat: number, lon: number, city: string) => void;
}

const LocationPicker = ({ latitude, longitude, city, onLocationChange }: LocationPickerProps) => {
  const { t, lang } = useLanguage();
  const lp = (t as any).locationPicker;
  const nominatimLang = lang === "en" ? "en" : "es";
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const defaultLat = latitude ?? -33.45;
  const defaultLng = longitude ?? -70.65;

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${nominatimLang}`
      );
      const data = await res.json();
      return data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || "";
    } catch {
      return "";
    }
  };

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: latitude ? 13 : 4,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude]).addTo(map);
    }

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
      const cityName = await reverseGeocode(lat, lng);
      onLocationChange(lat, lng, cityName);
    });

    mapRef.current = map;

    // Fix map size after render
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker/view when coordinates change externally
  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;
    mapRef.current.setView([latitude, longitude], 13);
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current);
    }
  }, [latitude, longitude]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=${nominatimLang}`
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const cityName = await reverseGeocode(lat, lon);
        onLocationChange(lat, lon, cityName || data[0].display_name.split(",")[0]);
      } else {
        toast.error(lp.notFound);
      }
    } catch {
      toast.error(lp.searchError);
    } finally {
      setSearching(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error(lp.noGeolocation);
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const cityName = await reverseGeocode(lat, lon);
        onLocationChange(lat, lon, cityName);
        setGeoLoading(false);
        toast.success(lp.detected);
      },
      () => {
        setGeoLoading(false);
        toast.error(lp.geoError);
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lp.searchPlaceholder}
          className="font-body"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button variant="outline" size="icon" onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={handleGeolocate} disabled={geoLoading} title={lp.useMyLocation}>
          {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        </Button>
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-border shadow-soft"
        style={{ height: 250 }}
      />

      {/* Location info */}
      {latitude && longitude && (
        <div className="bg-leaf-light/20 rounded-xl p-3 border border-leaf/20 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0">
            {city && <p className="text-sm font-body font-medium truncate">{city}</p>}
            <p className="text-xs text-muted-foreground font-body">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground font-body text-center">{lp.mapHint}</p>
    </div>
  );
};

export default LocationPicker;
