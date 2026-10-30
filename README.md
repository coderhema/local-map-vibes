# Backyrd

A map-first way to find events and early-career jobs around you. Lagos (Yaba) is the default market.

- **Stack:** TanStack Start (React 19, SSR) + Vite, MapLibre, Supabase (Postgres), Vercel AI SDK.
- **Listings:** scraped hourly by a TinyFish web agent (Luma Lagos, Eventbrite Lagos, Jobberman Lagos, RemoteOK) into the Supabase `listings` table. They're cleaned at ingest and again at read time: duplicates removed, times shown as `Sat, Oct 31 · 9:30 PM`, and job places shown as `Remote · based in …` instead of strings like "Probably worldwide".
- **Sample data:** `src/lib/sample-listings.ts` holds a small set of **clearly marked sample** Lagos/Yaba listings, so the map is never empty. Every one shows a "Sample" badge. Set `SHOW_SAMPLE_LISTINGS=false` to hide them.

## Run locally

Requires **Node 22+**. On Node 20, supabase-js fails with "native WebSocket not found".

```sh
cp .env.example .env      # fill in values
bun install               # or npm install
bun run dev               # http://localhost:3000
bun run test              # vitest
bun run build:node && PORT=3000 bun run start   # production server
```

## Deploy on Render

`render.yaml` is a Render Blueprint. In Render, choose **New → Blueprint** and select this repo. It creates a Node web service with:

- **Build:** `bun install --frozen-lockfile && bun run build:node`. This runs `vite build` with `NITRO_PRESET=node-server` and produces `.output/server/index.mjs`.
- **Start:** `node .output/server/index.mjs`. Render sets `PORT` itself.
- **Health check:** `GET /api/health`
- **Node:** 22, set by `NODE_VERSION`, `.node-version` and `engines`.

## Environment variables

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `SUPABASE_URL` | server | yes | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | server | yes | Supabase anon/publishable key, used to read listings |
| `SUPABASE_SERVICE_ROLE_KEY` | server | for refresh | Writes `listings` and `scrape_runs`. **Keep secret.** |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | build (browser) | yes | Browser copies, inlined at build time. A change needs a redeploy. |
| `TINYFISH_API_KEY` | server | for refresh | TinyFish scraping agent |
| `CRON_SECRET` | server | recommended | When set, `POST /api/public/hooks/refresh-listings` requires `Authorization: Bearer $CRON_SECRET` |
| `OPENAI_API_KEY` | server | for Yard Guide | Any OpenAI-compatible key |
| `OPENAI_BASE_URL` | server | no | e.g. `https://openrouter.ai/api/v1`. Defaults to OpenAI. |
| `AI_MODEL` | server | no | Defaults to `gpt-5-mini` |
| `SHOW_SAMPLE_LISTINGS` | server | no | `false` hides the sample Lagos listings |
| `NITRO_PRESET` | build | yes on Render | `node-server` |
| `LOVABLE_API_KEY` | server | legacy | Only used if `OPENAI_API_KEY` is empty (Lovable AI gateway) |

If Supabase is not configured or can't be reached, the app still renders and shows the sample listings.

## Listing refresh (cron)

`POST /api/public/hooks/refresh-listings` collects finished scrapes and starts a new one. A 55-minute cooldown caps spend. Call it hourly with either of these:

- **pg_cron on your Supabase:** `select cron.schedule('refresh-listings', '7 * * * *', $$ select net.http_post(url := 'https://YOUR-APP.onrender.com/api/public/hooks/refresh-listings', headers := '{"Authorization":"Bearer YOUR_CRON_SECRET"}'::jsonb) $$);`
- **Render Cron Job:** see the commented block in `render.yaml`. This is a paid service.

## Database

Migrations live in `drizzle/migrations/`. Apply them in order to a fresh Postgres/Supabase project (`psql "$DATABASE_URL" -f …`). Restore data with `pg_restore`.

## Leaving Lovable Cloud

Lovable deletes the database, backups and storage when you remove Cloud or delete the project. Export first:

1. Lovable → More → Database → Manage → Settings → **Export data**. Then download the `.backup` file from More → Storage.
2. Create your own Supabase project, apply `drizzle/migrations/` in order, then `pg_restore --data-only --no-owner -d "$DATABASE_URL" backup.backup`.
3. Put the new project's URL and keys into Render. Secrets, cron jobs and API keys are **not** included in Lovable's export.
4. Re-create the hourly cron against the Render URL, as described above.
