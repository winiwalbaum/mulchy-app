import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Eres un experto fitopatólogo y entomólogo especializado en huertos urbanos y jardines. 
Analiza la imagen proporcionada e identifica plagas, enfermedades o problemas visibles en la planta.

Responde SIEMPRE con un JSON válido con esta estructura exacta (sin markdown, sin backticks):
{
  "identified": true/false,
  "pest_name": "nombre de la plaga o enfermedad",
  "scientific_name": "nombre científico si aplica",
  "severity": "low" | "medium" | "high",
  "description": "descripción breve del problema identificado",
  "symptoms": ["síntoma 1", "síntoma 2"],
  "treatment": ["tratamiento orgánico 1", "tratamiento 2"],
  "prevention": ["medida preventiva 1", "medida 2"],
  "plant_health": "healthy" | "stressed" | "damaged" | "critical"
}

Si no puedes identificar una plaga o la imagen no muestra una planta, responde:
{
  "identified": false,
  "pest_name": null,
  "description": "Explicación de por qué no se pudo identificar",
  "plant_health": "unknown"
}`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analiza esta imagen de mi huerto/jardín e identifica cualquier plaga, enfermedad o problema visible.",
                },
                {
                  type: "image_url",
                  image_url: { url: image },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes, intenta en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response from the AI
    let result;
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      result = {
        identified: false,
        pest_name: null,
        description: content || "No se pudo procesar la respuesta",
        plant_health: "unknown",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("identify-pest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
