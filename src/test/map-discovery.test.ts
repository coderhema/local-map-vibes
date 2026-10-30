import { describe, expect, it } from "vitest";
import { groupDirections, MAP_VIEWS } from "@/lib/map-discovery";
import type { Listing } from "@/lib/listings.functions";

const listing = (id: string, category = "Music", kind: "Events" | "Jobs" = "Events"): Listing => ({ id, category, kind, title: id, place: id, coordinates: [3, 6], date: "", attendees: "", sourceUrl: null, startsAt: null, workMode: null, sample: false, onMap: true });
describe("Map discovery", () => {
  it("groups similar events in different locations with an additional-count badge", () => {
    const groups = groupDirections([{ item: listing("Lagos"), side: "left" }, { item: listing("Berlin"), side: "left" }, { item: listing("Tokyo"), side: "left" }]);
    expect(groups).toHaveLength(1);
    expect((groups[0]?.items.length ?? 0) - 1).toBe(2);
  });
  it("keeps categories, listing types and directions separate", () => {
    expect(groupDirections([{ item: listing("a"), side: "left" }, { item: listing("b", "Food"), side: "left" }, { item: listing("c", "Music", "Jobs"), side: "left" }, { item: listing("d"), side: "right" }])).toHaveLength(4);
  });
  it("starts each focus view at the requested 45 degree tilt", () => {
    expect(Object.values(MAP_VIEWS).map((v) => v.pitch)).toEqual([45, 45, 45, 45]);
  });
  it("allows deeper building focus than city and regional views", () => {
    expect(MAP_VIEWS.street.zoom).toBe(17);
    expect(MAP_VIEWS.street.zoom).toBeGreaterThan(MAP_VIEWS.city.zoom);
    expect(MAP_VIEWS.city.zoom).toBeGreaterThan(MAP_VIEWS.region.zoom);
  });
});