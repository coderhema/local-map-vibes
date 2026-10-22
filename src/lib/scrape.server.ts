// TinyFish web-agent scraping for real events and job listings.
import { isCurrentListing } from "./listing-visibility";
export type ScrapedListing = {
  kind: "Events" | "Jobs";
  title: string;
  place: string;
  date_label: string;
  category: string;
  meta: string;
  lng: number;
  lat: number;
  source_url: string | null;
  source: string;
  work_mode: string | null;
  starts_at: string | null;
};

const EVENT_CATS = "Music, Culture, Technology, Food, Sports";
const JOB_CATS = "Design, Technology, Community";

const SOURCES: { kind: "Events" | "Jobs"; url: string; label: string }[] = [
  { kind: "Events", url: "https://lu.ma/discover", label: "Luma" },
  { kind: "Events", url: "https://www.eventbrite.com/d/online/all-events/", label: "Eventbrite" },
  { kind: "Jobs", url: "https://remoteok.com/", label: "RemoteOK" },
  { kind: "Jobs", url: "https://weworkremotely.com/", label: "We Work Remotely" },
];

function goalFor(kind: "Events" | "Jobs") {
  const cats = kind === "Events" ? EVENT_CATS : JOB_CATS;
  const what = kind === "Events"
    ? `up to 8 current or upcoming in-person events as of ${new Date().toISOString()}. Never include past events or invent dates; skip events without a confirmed date. For each: title, place (venue/neighbourhood, City), date_label (short like 'Oct 12 · 20:00'), meta (e.g. '120 going' or the organiser), starts_at (ISO 8601 start date-time)`
    : "up to 8 job listings. For each: title, place (Neighbourhood or company HQ, City — never just 'Remote'), date_label (e.g. 'Full-time · Remote'), meta (company name), work_mode (exactly one of: Remote, Hybrid, In-person), starts_at (ISO date of the application deadline or start date; if none shown, about 2 weeks from today)";
  return `Extract ${what}, url (absolute link), category (exactly one of: ${cats}), and lat and lng as decimal numbers for the real city location. Return JSON {"items":[...]} only.`;
}

export { SOURCES };

export async function startRuns(apiKey: string) {
  return Promise.all(SOURCES.map(async (source) => {
    const res = await fetch("https://agent.tinyfish.ai/v1/automation/run-async", {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ url: source.url, goal: goalFor(source.kind) }),
    });
    if (!res.ok) throw new Error(`TinyFish ${source.label}: ${res.status}`);
    const body = (await res.json()) as { run_id: string };
    return { run_id: body.run_id, kind: source.kind, source: source.label };
  }));
}

export async function getRun(apiKey: string, runId: string) {
  const res = await fetch(`https://agent.tinyfish.ai/v1/runs/${runId}`, { headers: { "X-API-Key": apiKey } });
  if (!res.ok) throw new Error(`TinyFish run ${res.status}`);
  return (await res.json()) as { status: string; result?: unknown };
}

export function parseItems(kind: "Events" | "Jobs", label: string, resultIn: unknown): ScrapedListing[] {
  let result = resultIn as { items?: Record<string, unknown>[] } | string | undefined;
  if (typeof result === "string") { try { result = JSON.parse(result); } catch { result = undefined; } }
  const items = (typeof result === "object" && result?.items) || [];
  const allowed = (kind === "Events" ? EVENT_CATS : JOB_CATS).split(", ");
  return items.flatMap((raw) => {
    const lat = Number(raw["lat"]), lng = Number(raw["lng"]);
    const title = String(raw["title"] ?? "").trim();
    if (!title || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
    const cat = String(raw["category"] ?? "");
    const startsAt = Number.isFinite(Date.parse(String(raw["starts_at"] ?? ""))) ? new Date(String(raw["starts_at"])).toISOString() : null;
    if (!isCurrentListing({ kind, startsAt, date: String(raw["date_label"] ?? "") })) return [];
    return [{
      kind,
      title: title.slice(0, 140),
      place: String(raw["place"] ?? "").slice(0, 140),
      date_label: String(raw["date_label"] ?? "").slice(0, 60),
      category: allowed.includes(cat) ? cat : (allowed[0] ?? "Community"),
      meta: String(raw["meta"] ?? "").slice(0, 80),
      lat, lng,
      source_url: typeof raw["url"] === "string" ? raw["url"] : null,
      source: label,
      work_mode: kind === "Jobs" ? (["Remote", "Hybrid", "In-person"].find((m) => m.toLowerCase() === String(raw["work_mode"] ?? "").toLowerCase()) ?? "Remote") : null,
      starts_at: startsAt,
    }];
  });
}
