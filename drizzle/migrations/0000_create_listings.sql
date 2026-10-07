CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'Events',
  title text NOT NULL,
  place text NOT NULL DEFAULT '',
  date_label text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Community',
  meta text NOT NULL DEFAULT '',
  lng double precision NOT NULL,
  lat double precision NOT NULL,
  source_url text,
  source text NOT NULL DEFAULT 'seed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, title, place)
);
GRANT SELECT ON public.listings TO anon, authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings are public" ON public.listings FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX listings_kind_idx ON public.listings (kind, created_at DESC);