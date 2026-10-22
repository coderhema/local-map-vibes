import { describe, expect, it } from "vitest";
import { selectRouteStops } from "@/lib/route-stops";

describe("Likely nearby route stops", () => {
  it("shows actual bus stops along the route in travel order and excludes distant stops", () => {
    const stops = selectRouteStops([
      { type: "node", id: 2, lon: 3.45, lat: 6.5001, tags: { highway: "bus_stop", name: "Second" } },
      { type: "node", id: 3, lon: 4, lat: 7, tags: { highway: "bus_stop", name: "Far away" } },
      { type: "node", id: 1, lon: 3.4, lat: 6.5, tags: { highway: "bus_stop", name: "First" } },
    ], [[3.38, 6.5], [3.5, 6.5]], "transit");
    expect(stops.map((stop) => stop.name)).toEqual(["First", "Second"]);
    expect(stops[0]?.kind).toBe("Bus stop");
  });
  it("does not invent stops when the source has none", () => {
    expect(selectRouteStops([], [[3.38, 6.5], [3.5, 6.5]], "transit")).toEqual([]);
  });
});