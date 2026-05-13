const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INAT_API = "https://api.inaturalist.org/v1";

// Map iNaturalist iconic taxa / rank to our categories
function classifyTaxon(taxon: any): string {
  const rank = taxon.rank || "";
  const ancestorIds = taxon.ancestor_ids || [];
  const name = (taxon.name || "").toLowerCase();
  
  // iNaturalist taxon IDs for major plant groups
  // 47562 = Magnoliopsida (flowering plants), 47163 = Plantae
  // We'll use rank and common heuristics
  
  if (rank === "species" || rank === "subspecies" || rank === "variety") {
    // Check Wikipedia summary or tags if available
    const tags = (taxon.wikipedia_summary || "").toLowerCase();
    const preferred = ((taxon.preferred_common_name || "") + " " + (taxon.english_common_name || "")).toLowerCase();
    
    if (/\b(tree|árbol)\b/.test(preferred) || /\b(tree)\b/.test(tags) && /\bmeters?\b|\btall\b/.test(tags)) {
      return "tree";
    }
    if (/\b(shrub|bush|arbusto)\b/.test(preferred) || /\bshrub\b/.test(tags)) {
      return "shrub";
    }
    if (/\b(ground\s*cover|cubresuelo|mat-forming|creeping|rastrer[oa])\b/.test(preferred) || /\bground.?cover\b|\bcreeping\b|\bmat.forming\b/.test(tags)) {
      return "groundcover";
    }
    if (/\b(fern|helecho)\b/.test(preferred) || /\bfern\b/.test(tags)) {
      return "fern";
    }
    if (/\b(vine|climber|trepadora|enredadera)\b/.test(preferred) || /\bvine\b|\bclimber\b/.test(tags)) {
      return "vine";
    }
    if (/\b(grass|pasto|gramínea)\b/.test(preferred) || /\bgrass\b|\bgraminoid\b/.test(tags)) {
      return "grass";
    }
    if (/\b(flower|flor|wildflower)\b/.test(preferred)) {
      return "wildflower";
    }
  }
  
  return "native_plant";
}

function getEmoji(category: string): string {
  const map: Record<string, string> = {
    tree: "🌳",
    shrub: "🌿",
    groundcover: "☘️",
    fern: "🌿",
    vine: "🌱",
    grass: "🌾",
    wildflower: "🌸",
    native_plant: "🍃",
  };
  return map[category] || "🍃";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, country } = await req.json();

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ success: false, error: "lat and lng are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Round to 1 decimal for cache key (approx 11km resolution)
    const regionKey = `${Math.round(lat * 10) / 10}_${Math.round(lng * 10) / 10}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Check cache (valid for 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await sb
      .from("native_plants_cache")
      .select("*")
      .eq("region_key", regionKey)
      .gte("fetched_at", thirtyDaysAgo);

    if (cached && cached.length > 0) {
      console.log(`Cache hit for ${regionKey}: ${cached.length} plants`);
      return new Response(
        JSON.stringify({ success: true, data: cached, source: "cache" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Cache miss for ${regionKey}, fetching from iNaturalist...`);

    // Fetch native plant species from iNaturalist
    // iconic_taxa=Plantae, native=true, quality_grade=research
    const url = new URL(`${INAT_API}/observations/species_counts`);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lng", String(lng));
    url.searchParams.set("radius", "80"); // 80km radius
    url.searchParams.set("iconic_taxa", "Plantae");
    url.searchParams.set("native", "true");
    url.searchParams.set("quality_grade", "research");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", "1");
    url.searchParams.set("locale", "es");
    url.searchParams.set("rank", "species");

    const inatResponse = await fetch(url.toString(), {
      headers: { "Accept": "application/json" },
    });

    if (!inatResponse.ok) {
      const errorText = await inatResponse.text();
      console.error("iNaturalist API error:", inatResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `iNaturalist API error: ${inatResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inatData = await inatResponse.json();
    const results = inatData.results || [];

    console.log(`Got ${results.length} species from iNaturalist`);

    // Transform and classify
    const plants = results.map((r: any) => {
      const taxon = r.taxon || {};
      const category = classifyTaxon(taxon);
      const defaultPhoto = taxon.default_photo || {};

      return {
        region_key: regionKey,
        taxon_id: taxon.id,
        common_name: taxon.preferred_common_name || taxon.name,
        common_name_en: taxon.english_common_name || null,
        scientific_name: taxon.name,
        category,
        observation_count: r.count || 0,
        image_url: defaultPhoto.medium_url || defaultPhoto.square_url || null,
        inat_url: `https://www.inaturalist.org/taxa/${taxon.id}`,
        wikipedia_url: taxon.wikipedia_url || null,
      };
    });

    // Upsert into cache
    if (plants.length > 0) {
      const { error: upsertError } = await sb
        .from("native_plants_cache")
        .upsert(plants, { onConflict: "region_key,taxon_id" });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
      } else {
        console.log(`Cached ${plants.length} plants for ${regionKey}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: plants, source: "inaturalist" }),
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
