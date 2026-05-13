import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
    if (!OPENWEATHER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENWEATHER_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'lat and lon parameters are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate lat/lon are valid numbers
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return new Response(
        JSON.stringify({ error: 'Invalid lat/lon values' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current weather + forecast
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lonNum}&units=metric&lang=es&appid=${OPENWEATHER_API_KEY}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latNum}&lon=${lonNum}&units=metric&lang=es&cnt=8&appid=${OPENWEATHER_API_KEY}`
      ),
    ]);

    if (!currentRes.ok) {
      const errorBody = await currentRes.text();
      throw new Error(`OpenWeather current API error [${currentRes.status}]: ${errorBody}`);
    }
    if (!forecastRes.ok) {
      const errorBody = await forecastRes.text();
      throw new Error(`OpenWeather forecast API error [${forecastRes.status}]: ${errorBody}`);
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    // Process alerts
    const alerts: Array<{ type: string; message: string; severity: string }> = [];

    // Frost alert
    if (current.main.temp <= 2) {
      alerts.push({
        type: 'frost',
        message: `⚠️ Riesgo de helada: ${current.main.temp.toFixed(1)}°C. Protege tus plantas sensibles.`,
        severity: 'high',
      });
    } else if (current.main.temp <= 5) {
      alerts.push({
        type: 'frost',
        message: `🌡️ Temperatura baja: ${current.main.temp.toFixed(1)}°C. Vigila plantas delicadas.`,
        severity: 'medium',
      });
    }

    // Rain alert
    if (current.rain && current.rain['1h'] && current.rain['1h'] > 5) {
      alerts.push({
        type: 'rain',
        message: `🌧️ Lluvia intensa: ${current.rain['1h']}mm/h. No es necesario regar hoy.`,
        severity: 'medium',
      });
    }

    // Wind alert
    if (current.wind && current.wind.speed > 10) {
      alerts.push({
        type: 'wind',
        message: `💨 Viento fuerte: ${(current.wind.speed * 3.6).toFixed(0)} km/h. Asegura tutores y plantas altas.`,
        severity: 'medium',
      });
    }

    // Heat alert
    if (current.main.temp >= 35) {
      alerts.push({
        type: 'heat',
        message: `🔥 Calor extremo: ${current.main.temp.toFixed(1)}°C. Riega temprano y da sombra.`,
        severity: 'high',
      });
    }

    // Check forecast for upcoming frost
    const upcomingFrost = forecast.list?.find(
      (f: any) => f.main.temp_min <= 2
    );
    if (upcomingFrost && current.main.temp > 2) {
      const frostDate = new Date(upcomingFrost.dt * 1000);
      alerts.push({
        type: 'frost_forecast',
        message: `❄️ Helada prevista para ${frostDate.toLocaleDateString('es-CL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}. Prepara coberturas.`,
        severity: 'medium',
      });
    }

    const result = {
      current: {
        temp: current.main.temp,
        feels_like: current.main.feels_like,
        humidity: current.main.humidity,
        description: current.weather?.[0]?.description || '',
        icon: current.weather?.[0]?.icon || '',
        wind_speed: current.wind?.speed || 0,
        rain_1h: current.rain?.['1h'] || 0,
      },
      alerts,
      forecast: forecast.list?.slice(0, 4).map((f: any) => ({
        dt: f.dt,
        temp: f.main.temp,
        temp_min: f.main.temp_min,
        description: f.weather?.[0]?.description || '',
        icon: f.weather?.[0]?.icon || '',
      })) || [],
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Weather error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
