import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface WeatherAlert {
  type: string;
  message: string;
  severity: "high" | "medium" | "low";
}

interface ForecastItem {
  dt: number;
  temp: number;
  temp_min: number;
  description: string;
  icon: string;
}

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    description: string;
    icon: string;
    wind_speed: number;
    rain_1h: number;
  };
  alerts: WeatherAlert[];
  forecast: ForecastItem[];
}

export const useWeather = () => {
  const { profile } = useProfile();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.latitude || !profile?.longitude) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-weather?lat=${profile.latitude}&lon=${profile.longitude}`;
        
        const res = await fetch(url, {
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${res.status}`);
        }

        const weatherData = await res.json();
        setWeather(weatherData);
      } catch (err: any) {
        setError(err.message || "Error al obtener clima");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [profile?.latitude, profile?.longitude]);

  return { weather, loading, error };
};
