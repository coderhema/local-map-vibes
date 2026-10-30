// Browser-safe helpers that tidy scraped listings before they reach the UI:
// one time format, readable job locations, and no duplicate cards.

export const LAGOS: [number, number] = [3.3792, 6.5244];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function distanceKm(a: [number, number], b: [number, number]) {
  const r = Math.PI / 180;
  const h =
    Math.sin(((b[1] - a[1]) * r) / 2) ** 2 +
    Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(((b[0] - a[0]) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** Rough local UTC offset for a point, used only when a source label has no date. */
export function guessUtcOffsetHours(lng: number, lat: number) {
  // Nigeria (and the rest of WAT) is UTC+1 even though its longitude rounds to 0.
  if (lng >= 2.5 && lng <= 15 && lat >= 4 && lat <= 14) return 1;
  return Math.round(lng / 15);
}

/** "21:30" / "9:30 pm" / "9:30PM" -> "9:30 PM". */
export function to12h(hours: number, minutes: number) {
  const suffix = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return `${h}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function parseLabelTime(label: string) {
  const m = label.match(/\b(\d{1,2})(?::(\d{2}))?\s*([AaPp]\.?[Mm]\.?)?(?=$|[^\d])/g);
  if (!m) return null;
  for (const token of m) {
    const t = token.match(/(\d{1,2})(?::(\d{2}))?\s*([AaPp])?/);
    if (!t) continue;
    const hasMinutes = t[2] !== undefined;
    const meridiem = t[3]?.toLowerCase();
    // A bare number like the "31" in "Oct 31" is a day, not a time.
    if (!hasMinutes && !meridiem) continue;
    let hours = Number(t[1]);
    const minutes = hasMinutes ? Number(t[2]) : 0;
    if (hours > 23 || minutes > 59) continue;
    if (meridiem === "p" && hours < 12) hours += 12;
    if (meridiem === "a" && hours === 12) hours = 0;
    return { hours, minutes };
  }
  return null;
}

function parseLabelDate(label: string) {
  const m = label.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})\b/i,
  );
  if (!m?.[1] || !m[2]) return null;
  const month = MONTHS.findIndex((name) => name.toLowerCase() === m[1]!.slice(0, 3).toLowerCase());
  return month < 0 ? null : { month, day: Number(m[2]) };
}

/**
 * One event time format everywhere: "Sat, Oct 31 · 9:30 PM" in the event's local time.
 * The source label is trusted for local date/time; startsAt fills whatever the label lacks
 * (e.g. stale "Tomorrow" labels or empty ones).
 */
export function formatEventLabel(
  label: string,
  startsAt: string | null,
  coordinates: [number, number],
) {
  const text = (label ?? "").trim();
  const starts = startsAt ? Date.parse(startsAt) : NaN;
  const local = Number.isFinite(starts)
    ? new Date(starts + guessUtcOffsetHours(coordinates[0], coordinates[1]) * 36e5)
    : null;
  const date =
    parseLabelDate(text) ??
    (local ? { month: local.getUTCMonth(), day: local.getUTCDate() } : null);
  const time =
    parseLabelTime(text) ??
    (local ? { hours: local.getUTCHours(), minutes: local.getUTCMinutes() } : null);
  if (!date) return text;
  let year = local?.getUTCFullYear() ?? new Date().getUTCFullYear();
  // A December label for a January timestamp belongs to the previous year, and vice versa.
  if (local && date.month - local.getUTCMonth() > 6) year -= 1;
  if (local && local.getUTCMonth() - date.month > 6) year += 1;
  const weekday = WEEKDAYS[new Date(Date.UTC(year, date.month, date.day)).getUTCDay()];
  const day = `${weekday}, ${MONTHS[date.month]} ${date.day}`;
  return time ? `${day} · ${to12h(time.hours, time.minutes)}` : day;
}

const EMPLOYMENT: [RegExp, string][] = [
  [/full[\s-]?time\s*\/\s*part[\s-]?time/i, "Full-time/Part-time"],
  [/full[\s-]?time/i, "Full-time"],
  [/part[\s-]?time/i, "Part-time"],
  [/contract/i, "Contract"],
  [/intern(ship)?/i, "Internship"],
  [/freelance/i, "Freelance"],
];

/** "Full-Time · Remote" / "Full Time · Remote" -> "Full-time · Remote", using the stored work mode. */
export function formatJobLabel(label: string, workMode: string | null) {
  const type = EMPLOYMENT.find(([re]) => re.test(label ?? ""))?.[1];
  return [type, workMode].filter(Boolean).join(" · ") || (label ?? "").trim();
}

const REGION_WORDS =
  /^(worldwide|global|anywhere|europe|emea|apac|americas|latin america|north america|south america|africa|asia|oceania|usa|us|united states|canada|uk|united kingdom|multiple|multiple regions|n\/a|remote)$/i;

function tidyRegion(part: string) {
  return part
    .replace(/\(remote\)/gi, "")
    .replace(/^probably\s+/i, "")
    .replace(/\bHQ\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;—–-]+|[\s,;—–-]+$/g, "")
    .trim();
}

/**
 * Turn scraped job locations ("Probably worldwide (Remote)", "Lemon.io — New York, NY",
 * "Remote — Cribl HQ, Remote") into something a student can read at a glance.
 */
export function cleanJobPlace(place: string, company: string, workMode: string | null) {
  const companyKey = company.trim().toLowerCase();
  const companyPrefix = new RegExp(
    `^${companyKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*,?\\s*`,
    "i",
  );
  // Already-cleaned values ("Remote · based in X") stay stable when cleaned again.
  const parts = (place ?? "")
    .replace(/^remote\s*·\s*(based in\s+)?/i, "")
    .split(/\s+[—–]\s+|\s+-\s+/)
    .map(tidyRegion)
    .map((p) => (companyKey ? p.replace(companyPrefix, "") : p))
    .map((p) =>
      p
        .replace(/^remote\s*,\s*/i, "")
        .replace(/\s*,\s*(remote|n\/a)$/i, "")
        .trim(),
    )
    .filter((p) => p && !/^(remote|n\/a)$/i.test(p));
  // "Helsinki — Finland" reads better as "Helsinki, Finland".
  let where = parts.join(", ");
  if (where.includes(";")) {
    const regions = where
      .split(";")
      .map((r) => r.trim())
      .filter(Boolean);
    where =
      regions.length > 3
        ? `${regions.slice(0, 3).join(", ")} +${regions.length - 3} more`
        : regions.join(", ");
  }
  // Drop repeated parts: "United States, United States" → "United States".
  where = [...new Map(where.split(",").map((p) => [p.trim().toLowerCase(), p.trim()])).values()]
    .filter(Boolean)
    .join(", ");
  if (!where || /^(worldwide|global|anywhere|multiple( regions)?)$/i.test(where))
    where = "Worldwide";
  if (workMode !== "Remote") return where;
  // "City, Region" is where the employer is based; a bare region is who can apply.
  const isCity =
    where.includes(",") &&
    !/\+\d+ more$/.test(where) &&
    !where.split(",").every((p) => REGION_WORDS.test(p.trim()));
  return isCity ? `Remote · based in ${where}` : `Remote · ${where}`;
}

/** Remote jobs scraped without a real location arrive at 0,0 ("Null Island"). */
export function hasMapLocation(coordinates: [number, number]) {
  return (
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1]) &&
    !(Math.abs(coordinates[0]) < 0.01 && Math.abs(coordinates[1]) < 0.01)
  );
}

const normTitle = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .slice(0, 48);

type Dedupable = { kind: string; title: string; attendees: string; startsAt: string | null };

/** Key that treats the same event/job scraped twice (different venue or location strings) as one. */
export function dedupeKey(item: Dedupable) {
  if (item.kind === "Jobs") return `J|${normTitle(item.title)}|${normTitle(item.attendees)}`;
  const hour = item.startsAt ? Math.round(Date.parse(item.startsAt) / 36e5) : "";
  return `E|${normTitle(item.title)}|${hour}`;
}

/** Keeps the first occurrence; callers pass listings newest-first so the freshest copy wins. */
export function dedupeListings<T extends Dedupable>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = dedupeKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
