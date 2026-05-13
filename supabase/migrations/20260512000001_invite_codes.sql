-- ─── Invite Codes ────────────────────────────────────────────────────────────
-- Only users with a valid invite code can create an account in MULCHY.
-- Admins insert codes manually (or via the Supabase dashboard).

CREATE TABLE public.invite_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  expires_at  timestamp with time zone,
  used_by     uuid REFERENCES auth.users(id),
  used_at     timestamp with time zone,
  is_active   boolean NOT NULL DEFAULT true,
  note        text  -- optional label for admin (e.g. "for María")
);

-- Allow anyone (anon) to read codes so the signup page can validate before creating the account
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can validate invite codes"
  ON public.invite_codes FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users (the new user) can mark a code as used
CREATE POLICY "Authenticated user can claim invite code"
  ON public.invite_codes FOR UPDATE
  TO authenticated
  USING (used_by IS NULL AND is_active = true)
  WITH CHECK (used_by = auth.uid());

-- Seed a few starter codes for testing
INSERT INTO public.invite_codes (code, note) VALUES
  ('MULCHY-BETA-001', 'Beta tester 1'),
  ('MULCHY-BETA-002', 'Beta tester 2'),
  ('MULCHY-BETA-003', 'Beta tester 3');
