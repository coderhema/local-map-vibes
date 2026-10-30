// SAMPLE DATA — NOT REAL LISTINGS.
// Placeholder events and jobs around Yaba and the rest of Lagos so the default
// (Lagos) market is never empty while real Lagos sources are being scraped.
// Titles are generic on purpose and do not name real organisers, venues or
// employers; places are neighbourhoods only. Every item is flagged `sample: true`
// and the UI labels it "Sample". Set SHOW_SAMPLE_LISTINGS=false to hide them.
import type { Listing, WorkMode } from "./listings.functions";
import { to12h } from "./listing-cleanup";

type SampleSeed = {
  slug: string;
  kind: "Events" | "Jobs";
  title: string;
  place: string;
  category: string;
  meta: string;
  coordinates: [number, number];
  /** Days from today (Lagos time) and local start time. Jobs use this as the application deadline. */
  inDays: number;
  hour: number;
  minute?: number;
  type?: string;
  workMode?: WorkMode;
};

const SEEDS: SampleSeed[] = [
  {
    slug: "yaba-ai-meetup",
    kind: "Events",
    title: "Campus Tech Meetup: Build with AI",
    place: "Yaba, Lagos",
    category: "Technology",
    meta: "Sample · student meetup",
    coordinates: [3.3711, 6.5095],
    inDays: 2,
    hour: 16,
  },
  {
    slug: "lekki-afrobeats-night",
    kind: "Events",
    title: "Afrobeats Live Night",
    place: "Lekki Phase 1, Lagos",
    category: "Music",
    meta: "Sample · live music",
    coordinates: [3.4723, 6.4474],
    inDays: 3,
    hour: 20,
  },
  {
    slug: "akoka-pitch-night",
    kind: "Events",
    title: "Student Startup Pitch Night",
    place: "Akoka, Yaba, Lagos",
    category: "Technology",
    meta: "Sample · pitch event",
    coordinates: [3.3897, 6.5158],
    inDays: 5,
    hour: 17,
    minute: 30,
  },
  {
    slug: "surulere-food-crawl",
    kind: "Events",
    title: "Street Food Crawl",
    place: "Surulere, Lagos",
    category: "Food",
    meta: "Sample · food walk",
    coordinates: [3.354, 6.4969],
    inDays: 6,
    hour: 13,
  },
  {
    slug: "onikan-culture-day",
    kind: "Events",
    title: "Art & Culture Open Day",
    place: "Onikan, Lagos Island",
    category: "Culture",
    meta: "Sample · exhibition",
    coordinates: [3.4046, 6.4442],
    inDays: 8,
    hour: 11,
  },
  {
    slug: "ikeja-five-a-side",
    kind: "Events",
    title: "5-a-side Football Tournament",
    place: "Ikeja, Lagos",
    category: "Sports",
    meta: "Sample · sports",
    coordinates: [3.3515, 6.6018],
    inDays: 9,
    hour: 9,
  },
  {
    slug: "sabo-product-workshop",
    kind: "Events",
    title: "Design & Product Workshop",
    place: "Sabo, Yaba, Lagos",
    category: "Technology",
    meta: "Sample · workshop",
    coordinates: [3.3784, 6.5059],
    inDays: 11,
    hour: 10,
  },
  {
    slug: "vi-spoken-word",
    kind: "Events",
    title: "Comedy & Spoken Word Evening",
    place: "Victoria Island, Lagos",
    category: "Culture",
    meta: "Sample · open mic",
    coordinates: [3.4219, 6.4281],
    inDays: 12,
    hour: 19,
  },
  {
    slug: "yaba-frontend-dev",
    kind: "Jobs",
    title: "Junior Frontend Developer",
    place: "Yaba, Lagos",
    category: "Technology",
    meta: "Sample employer",
    coordinates: [3.3765, 6.5122],
    inDays: 14,
    hour: 23,
    minute: 59,
    type: "Full-time",
    workMode: "Hybrid",
  },
  {
    slug: "ikeja-design-intern",
    kind: "Jobs",
    title: "Product Design Intern",
    place: "Ikeja, Lagos",
    category: "Design",
    meta: "Sample employer",
    coordinates: [3.3486, 6.5966],
    inDays: 10,
    hour: 23,
    minute: 59,
    type: "Internship",
    workMode: "In-person",
  },
  {
    slug: "akoka-community-lead",
    kind: "Jobs",
    title: "Campus Community Lead",
    place: "Akoka, Yaba, Lagos",
    category: "Community",
    meta: "Sample employer",
    coordinates: [3.3925, 6.5185],
    inDays: 12,
    hour: 23,
    minute: 59,
    type: "Part-time",
    workMode: "Hybrid",
  },
  {
    slug: "vi-data-intern",
    kind: "Jobs",
    title: "Data Analyst Intern",
    place: "Victoria Island, Lagos",
    category: "Technology",
    meta: "Sample employer",
    coordinates: [3.4246, 6.4302],
    inDays: 16,
    hour: 23,
    minute: 59,
    type: "Internship",
    workMode: "In-person",
  },
  {
    slug: "lekki-social-designer",
    kind: "Jobs",
    title: "Social Media Designer",
    place: "Remote · based in Lekki, Lagos",
    category: "Design",
    meta: "Sample employer",
    coordinates: [3.4755, 6.4441],
    inDays: 18,
    hour: 23,
    minute: 59,
    type: "Contract",
    workMode: "Remote",
  },
];

const LAGOS_UTC_OFFSET_H = 1; // WAT, no daylight saving
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Dates are generated relative to `now` so the sample market is always upcoming. */
export function sampleLagosListings(now = Date.now()): Listing[] {
  const lagosNow = new Date(now + LAGOS_UTC_OFFSET_H * 36e5);
  return SEEDS.map((seed): Listing => {
    const minute = seed.minute ?? 0;
    const startsUtc = Date.UTC(
      lagosNow.getUTCFullYear(),
      lagosNow.getUTCMonth(),
      lagosNow.getUTCDate() + seed.inDays,
      seed.hour - LAGOS_UTC_OFFSET_H,
      minute,
    );
    const local = new Date(startsUtc + LAGOS_UTC_OFFSET_H * 36e5);
    const day = `${WEEKDAYS[local.getUTCDay()]}, ${MONTHS[local.getUTCMonth()]} ${local.getUTCDate()}`;
    return {
      id: `sample-lagos-${seed.slug}`,
      kind: seed.kind,
      title: seed.title,
      place: seed.place,
      date:
        seed.kind === "Jobs"
          ? [seed.type, seed.workMode].filter(Boolean).join(" · ")
          : `${day} · ${to12h(seed.hour, minute)}`,
      category: seed.category,
      attendees: seed.meta,
      coordinates: seed.coordinates,
      sourceUrl: null,
      workMode: seed.kind === "Jobs" ? (seed.workMode ?? "In-person") : null,
      startsAt: new Date(startsUtc).toISOString(),
      sample: true,
      onMap: true,
    };
  });
}
