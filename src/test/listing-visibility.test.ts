import { describe, expect, it } from "vitest";
import { isCurrentListing } from "@/lib/listing-visibility";

const now = Date.parse("2026-10-22T06:00:00Z");
describe("Present and upcoming events only", () => {
  it("removes events with old dates", () => {
    expect(isCurrentListing({ kind: "Events", startsAt: "2026-10-21T23:59:59Z" }, now)).toBe(false);
  });
  it("retains present-day events", () => {
    expect(isCurrentListing({ kind: "Events", startsAt: "2026-10-22T00:00:00Z" }, now)).toBe(true);
  });
  it("retains upcoming events", () => {
    expect(isCurrentListing({ kind: "Events", startsAt: "2026-10-23T12:00:00Z" }, now)).toBe(true);
  });
  it("does not treat missing or invalid event dates as upcoming", () => {
    expect(isCurrentListing({ kind: "Events", startsAt: null }, now)).toBe(false);
    expect(isCurrentListing({ kind: "Events", startsAt: "invalid" }, now)).toBe(false);
  });
  it("leaves job availability unchanged", () => {
    expect(isCurrentListing({ kind: "Jobs", startsAt: "2026-10-21T12:00:00Z" }, now)).toBe(true);
  });
});