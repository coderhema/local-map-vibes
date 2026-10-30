import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { isCurrentListing } from "./listing-visibility";
import { cleanJobPlace, dedupeListings, formatEventLabel, formatJobLabel, hasMapLocation } from "./listing-cleanup";
import { sampleLagosListings } from "./sample-listings";

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
  /** Placeholder data (see sample-listings.ts); shown with a "Sample" badge. */
  sample: boolean;
  /** False for remote jobs scraped without a real location (stored at 0,0). */
  onMap: boolean;
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

function showSamples() {
  return (process.env["SHOW_SAMPLE_LISTINGS"] ?? "true").toLowerCase() !== "false";
}

async function databaseListings(): Promise<Listing[]> {
  if (!process.env["SUPABASE_URL"] || !(process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"])) {
    console.warn("[listings] Supabase is not configured; showing sample listings only.");
    return [];
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const { data, error } = await publicClient()
    .from("listings")
    .select("id, kind, title, place, date_label, category, meta, lng, lat, source_url, work_mode, starts_at")
    .or(`kind.eq.Jobs,starts_at.gte.${today.toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r): Listing => {
    const kind = r.kind === "Jobs" ? "Jobs" : "Events";
    const coordinates: [number, number] = [r.lng, r.lat];
    const workMode = kind === "Jobs" ? (MODES.find((m) => m === r.work_mode) ?? "In-person") : null;
    return {
      id: r.id,
      kind,
      title: r.title.trim(),
      place: kind === "Jobs" ? cleanJobPlace(r.place, r.meta, workMode) : r.place.trim(),
      date: kind === "Jobs" ? formatJobLabel(r.date_label, workMode) : formatEventLabel(r.date_label, r.starts_at, coordinates),
      category: r.category,
      attendees: r.meta,
      coordinates,
      sourceUrl: r.source_url,
      workMode,
      startsAt: r.starts_at,
      sample: false,
      onMap: hasMapLocation(coordinates),
    };
  });
}

export const getListings = createServerFn({ method: "GET" }).handler(async (): Promise<Listing[]> => {
  let scraped: Listing[] = [];
  try {
    scraped = await databaseListings();
  } catch (error) {
    // Keep the app usable (with sample Lagos listings) if the database is unreachable.
    console.error("[listings] Could not load listings from Supabase", error);
  }
  const samples = showSamples() ? sampleLagosListings() : [];
  // Newest-first rows mean the freshest copy of a duplicate survives.
  return dedupeListings([...scraped, ...samples]).filter((item) => isCurrentListing(item));
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
