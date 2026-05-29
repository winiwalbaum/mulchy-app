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
    const minTempParam = url.searchParams.get('min_temp');
    const maxTempParam = url.searchParams.get('max_temp');
    const frostType = url.searchParams.get('frost_type') || 'heladas_ocasionales';

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

    // User's declared extreme temperatures (optional)
    const userMinTemp = minTempParam ? parseFloat(minTempParam) : null;
    const userMaxTemp = maxTempParam ? parseFloat(maxTempParam) : null;

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

    // Process alerts — personalized with user's microclimate data
    const alerts: Array<{ type: string; message: string; severity: string }> = [];
    const temp = current.main.temp;

    // ── Frost thresholds — adapted to user's climate ──────────────
    // If user declared frost-prone zone or has a low min_temp → warn earlier
    const isFrostProne = frostType === 'heladas_frecuentes';
    const isFrostOccasional = frostType === 'heladas_ocasionales';
    const frostHighThreshold = isFrostProne ? 1 : 2;
    const frostMediumThreshold = isFrostProne ? 5 : (isFrostOccasional ? 4 : 3);

    // Also lower thresholds if user declared a very cold min_temp
    const effectiveFrostHigh = (userMinTemp !== null && userMinTemp < -2) ? 3 : frostHighThreshold;
    const effectiveFrostMedium = (userMinTemp !== null && userMinTemp < -2) ? 7 : frostMediumThreshold;

    if (temp <= effectiveFrostHigh) {
      const extra = userMinTemp !== null
        ? ` Tu zona alcanza hasta ${userMinTemp}°C en invierno.`
        : '';
      alerts.push({
        type: 'frost',
        message: `⚠️ Riesgo de helada: ${temp.toFixed(1)}°C. Protege tus plantas sensibles.${extra}`,
        severity: 'high',
      });
    } else if (temp <= effectiveFrostMedium && frostType !== 'sin_heladas') {
      const extra = userMinTemp !== null ? ` (tu mínima histórica: ${userMinTemp}°C)` : '';
      alerts.push({
        type: 'frost',
        message: `🌡️ Temperatura baja: ${temp.toFixed(1)}°C${extra}. Vigila los trasplantes recientes.`,
        severity: 'medium',
      });
    }

    // ── Rain alert ────────────────────────────────────────────────
    if (current.rain && current.rain['1h'] && current.rain['1h'] > 5) {
      alerts.push({
        type: 'rain',
        message: `🌧️ Lluvia intensa: ${current.rain['1h']}mm/h. No es necesario regar hoy.`,
        severity: 'medium',
      });
    }

    // ── Wind alert ────────────────────────────────────────────────
    if (current.wind && current.wind.speed > 10) {
      alerts.push({
        type: 'wind',
        message: `💨 Viento fuerte: ${(current.wind.speed * 3.6).toFixed(0)} km/h. Asegura tutores y plantas altas.`,
        severity: 'medium',
      });
    }

    // ── Heat alert — adapted to user's declared max temp ──────────
    // If user's max_temp is low, they're less adapted to heat → warn earlier
    const heatThreshold = (userMaxTemp !== null && userMaxTemp < 32) ? 28
      : (userMaxTemp !== null && userMaxTemp > 38) ? 38
      : 35;

    if (temp >= heatThreshold) {
      const extra = userMaxTemp !== null
        ? ` Tu zona puede llegar hasta ${userMaxTemp}°C.`
        : '';
      const severity = temp >= 38 ? 'high' : 'medium';
      alerts.push({
        type: 'heat',
        message: `🔥 Calor${temp >= 38 ? ' extremo' : ' intenso'}: ${temp.toFixed(1)}°C.${extra} Riega temprano y da sombra.`,
        severity,
      });
    }

    // ── Upcoming frost forecast ───────────────────────────────────
    const frostForecastThreshold = frostType === 'sin_heladas' ? 3 : (isFrostProne ? 4 : 2);
    const upcomingFrost = forecast.list?.find(
      (f: any) => f.main.temp_min <= frostForecastThreshold
    );
    if (upcomingFrost && temp > effectiveFrostHigh) {
      const frostDate = new Date(upcomingFrost.dt * 1000);
      alerts.push({
        type: 'frost_forecast',
        message: `❄️ Helada prevista para el ${frostDate.toLocaleDateString('es-CL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}. Prepara coberturas.`,
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
