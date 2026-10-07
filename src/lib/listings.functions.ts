import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Listing = {
  id: string;
  kind: "Events" | "Jobs";
  title: string;
  place: string;
  date: string;
  category: string;
  attendees: string;
  coordinates: [number, number];
  sourceUrl: string | null;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getListings = createServerFn({ method: "GET" }).handler(async (): Promise<Listing[]> => {
  const { data, error } = await publicClient()
    .from("listings")
    .select("id, kind, title, place, date_label, category, meta, lng, lat, source_url")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    kind: r.kind === "Jobs" ? "Jobs" : "Events",
    title: r.title,
    place: r.place,
    date: r.date_label,
    category: r.category,
    attendees: r.meta,
    coordinates: [r.lng, r.lat],
    sourceUrl: r.source_url,
  }));
});

const COOLDOWN_MS = 6 * 60 * 60 * 1000;

// Public trigger: starts background TinyFish runs, rate-limited so it can't drain the wallet.
export const refreshListings = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: latest } = await supabaseAdmin
    .from("scrape_runs").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (latest && Date.now() - new Date(latest.created_at).getTime() < COOLDOWN_MS) return { started: 0, skipped: true };
  const apiKey = process.env["TINYFISH_API_KEY"];
  if (!apiKey) throw new Error("TinyFish is not configured");
  const { startRuns } = await import("./scrape.server");
  const runs = await startRuns(apiKey);
  const { error } = await supabaseAdmin.from("scrape_runs").insert(runs);
  if (error) throw new Error(error.message);
  return { started: runs.length, skipped: false };
});

// Checks pending runs and saves any finished results. Safe to call repeatedly.
export const collectListings = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const apiKey = process.env["TINYFISH_API_KEY"];
  if (!apiKey) return { pending: 0, added: 0 };
  const { getRun, parseItems } = await import("./scrape.server");
  const { data: pending } = await supabaseAdmin.from("scrape_runs").select("run_id, kind, source").eq("status", "PENDING");
  let added = 0, still = 0;
  for (const run of pending ?? []) {
    const state = await getRun(apiKey, run.run_id).catch(() => null);
    if (!state || !["COMPLETED", "FAILED", "CANCELLED"].includes(state.status)) { still++; continue; }
    const items = state.status === "COMPLETED" ? parseItems(run.kind === "Jobs" ? "Jobs" : "Events", run.source, state.result) : [];
    if (items.length) {
      const { error } = await supabaseAdmin.from("listings").upsert(items.map((l) => ({ ...l, updated_at: new Date().toISOString() })), { onConflict: "kind,title,place" });
      if (error) throw new Error(error.message);
    }
    added += items.length;
    await supabaseAdmin.from("scrape_runs").update({ status: state.status, added: items.length, finished_at: new Date().toISOString() }).eq("run_id", run.run_id);
  }
  return { pending: still, added };
});
