ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS work_mode text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS starts_at timestamptz;
UPDATE public.listings SET work_mode = CASE WHEN date_label ILIKE '%hybrid%' THEN 'Hybrid' WHEN date_label ILIKE '%remote%' OR place ILIKE '%remote%' THEN 'Remote' ELSE 'In-person' END WHERE kind = 'Jobs' AND work_mode IS NULL;
UPDATE public.listings SET starts_at = date_trunc('hour', now()) + make_interval(days => (abs(hashtext(id::text)) % 40) + 1, hours => abs(hashtext(title)) % 12) WHERE starts_at IS NULL;
CREATE INDEX IF NOT EXISTS listings_starts_at_idx ON public.listings (starts_at);
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;