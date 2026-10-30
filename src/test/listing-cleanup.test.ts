import { describe, expect, it } from "vitest";
import {
  cleanJobPlace,
  dedupeListings,
  formatEventLabel,
  formatJobLabel,
  hasMapLocation,
} from "@/lib/listing-cleanup";
import { sampleLagosListings } from "@/lib/sample-listings";

const SAN_JOSE: [number, number] = [-121.89, 37.33];

describe("event time labels use one 12-hour format", () => {
  it("converts 24-hour source times", () => {
    expect(formatEventLabel("Oct 31 · 21:30", "2026-11-01T04:30:00Z", SAN_JOSE)).toBe(
      "Sat, Oct 31 · 9:30 PM",
    );
  });
  it("keeps 12-hour source times the same", () => {
    expect(formatEventLabel("Oct 31 · 9:30 PM", "2026-11-01T04:30:00Z", SAN_JOSE)).toBe(
      "Sat, Oct 31 · 9:30 PM",
    );
    expect(formatEventLabel("Sat, Nov 7 · 12:00 PM", "2026-11-07T20:00:00Z", SAN_JOSE)).toBe(
      "Sat, Nov 7 · 12:00 PM",
    );
  });
  it("is stable when formatted twice", () => {
    const once = formatEventLabel("Oct 25 · 09:00", "2026-10-25T16:00:00Z", SAN_JOSE);
    expect(formatEventLabel(once, "2026-10-25T16:00:00Z", SAN_JOSE)).toBe(once);
  });
  it("replaces relative or empty labels with the start date in local (Lagos) time", () => {
    expect(formatEventLabel("Tomorrow · 7:00 PM", "2026-11-03T18:00:00Z", [3.37, 6.5])).toBe(
      "Tue, Nov 3 · 7:00 PM",
    );
    expect(formatEventLabel("", "2026-11-03T18:00:00Z", [3.37, 6.5])).toBe("Tue, Nov 3 · 7:00 PM");
  });
});

describe("job labels and places", () => {
  it("normalises employment type casing", () => {
    expect(formatJobLabel("Full Time · Remote", "Remote")).toBe("Full-time · Remote");
    expect(formatJobLabel("Full-Time · Remote", "Remote")).toBe("Full-time · Remote");
  });
  it("cleans guessed and company-prefixed locations", () => {
    expect(cleanJobPlace("Probably worldwide (Remote)", "Aprio", "Remote")).toBe(
      "Remote · Worldwide",
    );
    expect(cleanJobPlace("Lemon.io — New York, NY", "Lemon.io", "Remote")).toBe(
      "Remote · based in New York, NY",
    );
    expect(cleanJobPlace("San Francisco, CA — Contra HQ", "Contra", "Remote")).toBe(
      "Remote · based in San Francisco, CA",
    );
    expect(cleanJobPlace("Remote — Cribl HQ, Remote", "Cribl", "Remote")).toBe(
      "Remote · Worldwide",
    );
    expect(cleanJobPlace("Remote, United States — Calm.com HQ", "Calm.com", "Remote")).toBe(
      "Remote · United States",
    );
    expect(cleanJobPlace("Toptal HQ", "Toptal", "Remote")).toBe("Remote · Worldwide");
    expect(cleanJobPlace("Yaba, Lagos", "Acme", "Hybrid")).toBe("Yaba, Lagos");
  });
  it("is stable when cleaned twice", () => {
    const once = cleanJobPlace("Lemon.io — New York, NY", "Lemon.io", "Remote");
    expect(cleanJobPlace(once, "Lemon.io", "Remote")).toBe(once);
  });
  it("treats 0,0 as no map location", () => {
    expect(hasMapLocation([0, 0])).toBe(false);
    expect(hasMapLocation([3.37, 6.5])).toBe(true);
  });
});

describe("duplicates", () => {
  it("merges the same event scraped with different venue strings and time formats", () => {
    const items = [
      {
        id: "a",
        kind: "Events",
        title: "PERREO HALLOWEEN @The Glasshouse San Jose!",
        attendees: "4.8k",
        startsAt: "2026-11-01T04:30:00Z",
      },
      {
        id: "b",
        kind: "Events",
        title: "PERREO HALLOWEEN @The Glasshouse San Jose!",
        attendees: "",
        startsAt: "2026-11-01T04:30:00+00:00",
      },
      {
        id: "c",
        kind: "Events",
        title: "PERREO HALLOWEEN @The Glasshouse San Jose!",
        attendees: "",
        startsAt: "2026-11-08T04:30:00Z",
      },
    ];
    expect(dedupeListings(items).map((i) => i.id)).toEqual(["a", "c"]);
  });
  it("merges a job repeated with different location strings", () => {
    const items = [
      {
        id: "a",
        kind: "Jobs",
        title: "Accounting & Finance Manager",
        attendees: "Aprio",
        startsAt: "2026-11-06T00:00:00Z",
      },
      {
        id: "b",
        kind: "Jobs",
        title: "Accounting & Finance Manager",
        attendees: "Aprio",
        startsAt: "2026-10-25T00:00:00Z",
      },
      {
        id: "c",
        kind: "Jobs",
        title: "Accounting & Finance Manager",
        attendees: "Other Co",
        startsAt: null,
      },
    ];
    expect(dedupeListings(items).map((i) => i.id)).toEqual(["a", "c"]);
  });
});

describe("sample Lagos market", () => {
  const now = Date.parse("2026-10-30T10:00:00Z");
  const samples = sampleLagosListings(now);
  it("is clearly flagged as sample data and upcoming", () => {
    expect(samples.length).toBeGreaterThan(5);
    expect(samples.every((s) => s.sample && s.id.startsWith("sample-"))).toBe(true);
    expect(samples.every((s) => s.startsAt && Date.parse(s.startsAt) > now)).toBe(true);
  });
  it("sits in Lagos with Lagos-time labels", () => {
    expect(
      samples.every(
        (s) =>
          s.coordinates[0] > 3 &&
          s.coordinates[0] < 3.7 &&
          s.coordinates[1] > 6.3 &&
          s.coordinates[1] < 6.7,
      ),
    ).toBe(true);
    const meetup = samples.find((s) => s.id === "sample-lagos-yaba-ai-meetup");
    expect(meetup?.date).toBe("Sun, Nov 1 · 4:00 PM");
    expect(meetup?.startsAt).toBe("2026-11-01T15:00:00.000Z");
  });
  it("drops repeated place parts", () => {
    expect(cleanJobPlace("United States — United States", "Acme", "Remote")).toBe(
      "Remote · United States",
    );
  });
});
