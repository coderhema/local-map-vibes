CREATE TABLE public.scrape_runs (
  run_id text PRIMARY KEY,
  kind text NOT NULL,
  source text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  added integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT ALL ON public.scrape_runs TO service_role;
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;