
CREATE TABLE public.native_plants_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_key text NOT NULL,
  taxon_id integer NOT NULL,
  common_name text,
  common_name_en text,
  scientific_name text NOT NULL,
  category text NOT NULL DEFAULT 'tree',
  observation_count integer NOT NULL DEFAULT 0,
  image_url text,
  inat_url text,
  wikipedia_url text,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(region_key, taxon_id)
);

ALTER TABLE public.native_plants_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read native plants cache"
ON public.native_plants_cache
FOR SELECT
TO public
USING (true);

CREATE POLICY "Edge functions can insert native plants"
ON public.native_plants_cache
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Edge functions can update native plants"
ON public.native_plants_cache
FOR UPDATE
TO service_role
USING (true);
