// Shared refresh/collect logic used by the Refresh button and the hourly job.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRun, parseItems, startRuns } from "./scrape.server";

export const REFRESH_COOLDOWN_MS = 55 * 60 * 1000; // pull new listings at most once an hour

export async function startRefresh() {
  const { data: latest } = await supabaseAdmin
    .from("scrape_runs").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (latest && Date.now() - new Date(latest.created_at).getTime() < REFRESH_COOLDOWN_MS) return { started: 0, skipped: true };
  const apiKey = process.env["TINYFISH_API_KEY"];
  if (!apiKey) throw new Error("TinyFish is not configured");
  const runs = await startRuns(apiKey);
  const { error } = await supabaseAdmin.from("scrape_runs").insert(runs);
  if (error) throw new Error(error.message);
  return { started: runs.length, skipped: false };
}

export async function collectPending() {
  const apiKey = process.env["TINYFISH_API_KEY"];
  if (!apiKey) return { pending: 0, added: 0 };
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
}
