import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type WorkMode = "Remote" | "Hybrid" | "In-person";
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
  workMode: WorkMode | null;
  startsAt: string | null;
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

const MODES: WorkMode[] = ["Remote", "Hybrid", "In-person"];

export const getListings = createServerFn({ method: "GET" }).handler(async (): Promise<Listing[]> => {
  const { data, error } = await publicClient()
    .from("listings")
    .select("id, kind, title, place, date_label, category, meta, lng, lat, source_url, work_mode, starts_at")
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
    workMode: r.kind === "Jobs" ? (MODES.find((m) => m === r.work_mode) ?? "In-person") : null,
    startsAt: r.starts_at,
  }));
});

// Public trigger: rate-limited to once an hour so it can't drain the TinyFish wallet.
export const refreshListings = createServerFn({ method: "POST" }).handler(async () => {
  const { startRefresh } = await import("./listings.server");
  return startRefresh();
});

// Checks pending runs and saves any finished results. Safe to call repeatedly.
export const collectListings = createServerFn({ method: "POST" }).handler(async () => {
  const { collectPending } = await import("./listings.server");
  return collectPending();
});
