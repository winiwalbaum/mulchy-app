-- ─── Fix plant_varieties: agregar columnas que espera el frontend ─────────────

-- 1. species_id era NOT NULL pero el frontend no lo provee → hacerlo nullable
ALTER TABLE public.plant_varieties
  ALTER COLUMN species_id DROP NOT NULL;

-- 2. Columnas extra que usa el hook insertVariety / Variety interface
ALTER TABLE public.plant_varieties
  ADD COLUMN IF NOT EXISTS plant_scientific_name  text,
  ADD COLUMN IF NOT EXISTS image_url_2            text,
  ADD COLUMN IF NOT EXISTS image_url_3            text,
  ADD COLUMN IF NOT EXISTS color                  text,
  ADD COLUMN IF NOT EXISTS shape                  text,
  ADD COLUMN IF NOT EXISTS size_weight            text,
  ADD COLUMN IF NOT EXISTS location               text,
  ADD COLUMN IF NOT EXISTS years_cultivated       integer,
  ADD COLUMN IF NOT EXISTS seed_origin            text,
  ADD COLUMN IF NOT EXISTS personal_experience    text,
  ADD COLUMN IF NOT EXISTS difficulty             text,
  ADD COLUMN IF NOT EXISTS info_score             numeric  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS info_ratings_count     integer  NOT NULL DEFAULT 0;

-- 3. Tabla variety_ratings (valoraciones de fichas)
CREATE TABLE IF NOT EXISTS public.variety_ratings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variety_id     uuid    NOT NULL REFERENCES public.plant_varieties(id) ON DELETE CASCADE,
  user_id        uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_quality  integer CHECK (photo_quality  BETWEEN 1 AND 5),
  detail_quality integer CHECK (detail_quality BETWEEN 1 AND 5),
  story_quality  integer CHECK (story_quality  BETWEEN 1 AND 5),
  created_at     timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (variety_id, user_id)
);

ALTER TABLE public.variety_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read variety ratings"
  ON public.variety_ratings FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "User can insert own rating"
  ON public.variety_ratings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own rating"
  ON public.variety_ratings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);
