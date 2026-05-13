
-- Create journal_entries table for persisting notes with photos
CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  text text NOT NULL DEFAULT '',
  image_url text,
  color text NOT NULL DEFAULT 'bg-leaf-light/30 border-leaf/30',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal entries"
  ON public.journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON public.journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON public.journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for journal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true);

-- Storage RLS: users can upload their own images
CREATE POLICY "Users can upload journal images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'journal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: anyone can view journal images (public bucket)
CREATE POLICY "Anyone can view journal images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'journal-images');

-- Storage RLS: users can delete their own images
CREATE POLICY "Users can delete own journal images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'journal-images' AND (storage.foldername(name))[1] = auth.uid()::text);
