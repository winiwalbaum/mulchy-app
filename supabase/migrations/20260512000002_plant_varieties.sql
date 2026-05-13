-- ─── Plant Species ────────────────────────────────────────────────────────────
-- The base "pattern" (like Ravelry): one entry per species/crop type.
-- Pre-seeded with the existing MULCHY catalog; users can propose new ones.

CREATE TABLE public.plant_species (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,           -- e.g. "tomate", "lechuga"
  name_es         text NOT NULL,
  name_en         text,
  scientific_name text,
  category        text NOT NULL DEFAULT 'hortalizas',
  emoji           text,
  description_es  text,
  description_en  text,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id)  -- NULL = seeded by MULCHY
);

ALTER TABLE public.plant_species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plant species"
  ON public.plant_species FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can propose new species"
  ON public.plant_species FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);


-- ─── Plant Varieties ──────────────────────────────────────────────────────────
-- User-contributed varieties within a species (e.g. "Tomate Cherry Roma").
-- Like the "pattern page" in Ravelry — the shared reference point.

CREATE TABLE public.plant_varieties (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id      uuid NOT NULL REFERENCES public.plant_species(id) ON DELETE CASCADE,
  name            text NOT NULL,                  -- e.g. "Cherry Roma"
  aka             text[],                         -- alternative names
  description     text,
  origin          text,                           -- e.g. "Italia", "Heirloom EE.UU."
  days_to_harvest integer,                        -- approximate days from transplant
  image_url       text,
  tags            text[],                         -- e.g. ["determinada","resistente"]
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  approved        boolean NOT NULL DEFAULT true   -- future moderation hook
);

ALTER TABLE public.plant_varieties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved varieties"
  ON public.plant_varieties FOR SELECT
  TO anon, authenticated
  USING (approved = true);

CREATE POLICY "Authenticated users can add varieties"
  ON public.plant_varieties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update own variety"
  ON public.plant_varieties FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);


-- ─── User Variety Grows ───────────────────────────────────────────────────────
-- The user's "project" linked to a variety (like a Ravelry project on a pattern).
-- Each row = one user's experience growing that variety.

CREATE TABLE public.user_variety_grows (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variety_id      uuid NOT NULL REFERENCES public.plant_varieties(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text,                           -- denormalized for display
  status          text NOT NULL DEFAULT 'growing' CHECK (status IN ('growing','harvested','failed','planned')),
  season          text,                           -- e.g. "Primavera 2026"
  location_city   text,
  notes           text,
  rating          integer CHECK (rating BETWEEN 1 AND 5),
  sow_date        date,
  harvest_date    date,
  image_url       text,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (variety_id, user_id)                   -- one "project" per variety per user
);

ALTER TABLE public.user_variety_grows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read grows"
  ON public.user_variety_grows FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "User can insert own grow"
  ON public.user_variety_grows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own grow"
  ON public.user_variety_grows FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "User can delete own grow"
  ON public.user_variety_grows FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ─── Seed starter species from the existing MULCHY catalog ───────────────────

INSERT INTO public.plant_species (slug, name_es, name_en, scientific_name, category, emoji) VALUES
  ('tomate',       'Tomate',        'Tomato',       'Solanum lycopersicum',       'hortalizas', '🍅'),
  ('lechuga',      'Lechuga',       'Lettuce',       'Lactuca sativa',             'hortalizas', '🥬'),
  ('zapallo',      'Zapallo',       'Squash',        'Cucurbita maxima',           'hortalizas', '🎃'),
  ('pimiento',     'Pimiento',      'Pepper',        'Capsicum annuum',            'hortalizas', '🌶️'),
  ('zanahoria',    'Zanahoria',     'Carrot',        'Daucus carota',             'hortalizas', '🥕'),
  ('cebolla',      'Cebolla',       'Onion',         'Allium cepa',               'hortalizas', '🧅'),
  ('ajo',          'Ajo',           'Garlic',        'Allium sativum',            'hortalizas', '🧄'),
  ('espinaca',     'Espinaca',      'Spinach',       'Spinacia oleracea',         'hortalizas', '🥬'),
  ('pepino',       'Pepino',        'Cucumber',      'Cucumis sativus',           'hortalizas', '🥒'),
  ('berenjena',    'Berenjena',     'Eggplant',      'Solanum melongena',         'hortalizas', '🍆'),
  ('calabacin',    'Calabacín',     'Zucchini',      'Cucurbita pepo',            'hortalizas', '🥒'),
  ('poroto',       'Poroto verde',  'Green bean',    'Phaseolus vulgaris',        'hortalizas', '🫘'),
  ('maiz',         'Maíz',          'Corn',          'Zea mays',                  'hortalizas', '🌽'),
  ('acelga',       'Acelga',        'Swiss chard',   'Beta vulgaris var. cicla',  'hortalizas', '🥬'),
  ('rucula',       'Rúcula',        'Arugula',       'Eruca vesicaria',           'hortalizas', '🌱'),
  ('rabanito',     'Rabanito',      'Radish',        'Raphanus sativus',          'hortalizas', '🔴'),
  ('albahaca',     'Albahaca',      'Basil',         'Ocimum basilicum',          'aromáticas', '🌿'),
  ('lavanda',      'Lavanda',       'Lavender',      'Lavandula angustifolia',    'aromáticas', '💜'),
  ('menta',        'Menta',         'Mint',          'Mentha spicata',            'aromáticas', '🌿'),
  ('romero',       'Romero',        'Rosemary',      'Salvia rosmarinus',         'aromáticas', '🌿'),
  ('frutilla',     'Frutilla',      'Strawberry',    'Fragaria × ananassa',       'frutales',   '🍓'),
  ('limon',        'Limón',         'Lemon',         'Citrus limon',              'frutales',   '🍋'),
  ('manzano',      'Manzano',       'Apple',         'Malus domestica',           'frutales',   '🍎');
