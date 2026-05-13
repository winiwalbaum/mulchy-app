import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taxon_id, scientific_name, common_name, wikipedia_url } = await req.json();

    if (!taxon_id || !scientific_name) {
      return new Response(
        JSON.stringify({ success: false, error: "taxon_id and scientific_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Check if description already exists in cache
    const { data: cached } = await sb
      .from("native_plants_cache")
      .select("description, description_en")
      .eq("taxon_id", taxon_id)
      .not("description", "is", null)
      .limit(1)
      .single();

    if (cached?.description) {
      return new Response(
        JSON.stringify({ success: true, description: cached.description, description_en: cached.description_en }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch Wikipedia summary if URL available
    let wikiSummary = "";
    if (wikipedia_url) {
      try {
        // Extract title from Wikipedia URL
        const urlParts = wikipedia_url.split("/wiki/");
        if (urlParts.length > 1) {
          const title = decodeURIComponent(urlParts[1]);
          const lang = wikipedia_url.includes("es.wikipedia") ? "es" : "en";
          const apiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
          const wikiResp = await fetch(apiUrl, {
            headers: { "Accept": "application/json", "User-Agent": "MiBitacoraDeHuerta/1.0" },
          });
          if (wikiResp.ok) {
            const wikiData = await wikiResp.json();
            wikiSummary = wikiData.extract || "";
          } else {
            await wikiResp.text(); // consume body
          }
        }
      } catch (e) {
        console.error("Wikipedia fetch error:", e);
      }
    }

    // Also try iNaturalist taxon detail for extra info
    let inatInfo = "";
    try {
      const inatResp = await fetch(`https://api.inaturalist.org/v1/taxa/${taxon_id}`, {
        headers: { "Accept": "application/json" },
      });
      if (inatResp.ok) {
        const inatData = await inatResp.json();
        const taxon = inatData.results?.[0];
        if (taxon?.wikipedia_summary) {
          inatInfo = taxon.wikipedia_summary.replace(/<[^>]*>/g, "");
        }
      } else {
        await inatResp.text();
      }
    } catch (e) {
      console.error("iNaturalist fetch error:", e);
    }

    const context = [wikiSummary, inatInfo].filter(Boolean).join("\n\n");

    if (!context) {
      return new Response(
        JSON.stringify({ success: true, description: null, description_en: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate descriptions via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Based on this information about the plant "${scientific_name}" (common name: ${common_name || "unknown"}):

${context}

Write TWO short descriptions (3-4 sentences each) focused on gardening relevance:
1. In SPANISH: describe the plant's characteristics, growing conditions, and how it can be used in a native garden.
2. In ENGLISH: same content translated to English.

Format your response EXACTLY as:
ES: [Spanish description]
EN: [English description]`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a botanist and native gardening expert. Write concise, practical descriptions for gardeners. Always respond in the exact format requested.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);

      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse ES/EN from response
    let description = "";
    let description_en = "";

    const esMatch = content.match(/ES:\s*([\s\S]*?)(?=\nEN:|$)/i);
    const enMatch = content.match(/EN:\s*([\s\S]*?)$/i);

    if (esMatch) description = esMatch[1].trim();
    if (enMatch) description_en = enMatch[1].trim();

    // Fallback: if parsing failed, use the whole thing as both
    if (!description && content) {
      description = content;
      description_en = content;
    }

    // Save to cache
    const { error: updateError } = await sb
      .from("native_plants_cache")
      .update({ description, description_en })
      .eq("taxon_id", taxon_id);

    if (updateError) {
      console.error("Cache update error:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, description, description_en }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
