import { describe, expect, it } from "vitest";
import { routeDistanceKm, routePath } from "@/lib/route-trails";

describe("Transport route geometry", () => {
  it("makes flights swirly while retaining both exact destinations", () => {
    const flight = routePath([0, 0], [20, 0], "flight");
    expect(flight[0]).toEqual([0, 0]);
    expect(flight.at(-1)).toEqual([20, 0]);
    expect(Math.max(...flight.map((p) => p[1]))).toBeGreaterThan(0.5);
    expect(Math.min(...flight.map((p) => p[1]))).toBeLessThan(-0.5);
  });
  for (const mode of ["transit", "drive", "walk"] as const) {
    it(`keeps ${mode} on the original geographic centerline`, () => {
      expect(routePath([0, 0], [20, 0], mode).every((p) => p[1] === 0)).toBe(true);
    });
  }
  it("calculates hover distance in kilometres and adds tour segments", () => {
    expect(routeDistanceKm([[0, 0], [1, 0]])).toBeCloseTo(111.195, 2);
    expect(routeDistanceKm([[0, 0], [1, 0], [2, 0]])).toBeCloseTo(222.39, 2);
    expect(routeDistanceKm([[3, 6], [3, 6]])).toBe(0);
  });
  it("keeps date-line flights finite and takes the short crossing", () => {
    const path = routePath([179, 10], [-179, 10], "flight");
    expect(path.flat().every(Number.isFinite)).toBe(true);
    expect(routeDistanceKm(path)).toBeLessThan(300);
  });
});