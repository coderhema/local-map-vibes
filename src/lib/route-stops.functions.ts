import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { routeDistanceKm } from "./route-trails";
import { selectRouteStops, type RouteStop, type StopElement } from "./route-stops";

const input = z.object({ points: z.array(z.tuple([z.number().min(-180).max(180), z.number().min(-85).max(85)])).min(2).max(12), mode: z.enum(["flight", "transit", "drive", "walk"]) });
const cache = new Map<string, { expires: number; stops: RouteStop[] }>();
export const getRouteStops = createServerFn({ method: "POST" })
  .inputValidator((data) => input.parse(data))
  .handler(async ({ data }): Promise<{ stops: RouteStop[]; status: "ok" | "unavailable" | "long-distance" }> => {
    if (data.mode !== "flight" && routeDistanceKm(data.points) > 150) return { stops: [], status: "long-distance" };
    const key = JSON.stringify(data);
    const saved = cache.get(key);
    if (saved && saved.expires > Date.now()) return { stops: saved.stops, status: "ok" };
    const samples: [number, number][] = [];
    for (let i = 0; i < data.points.length - 1; i++) {
      const a = data.points[i], b = data.points[i + 1];
      if (!a || !b) continue;
      if (data.mode === "flight") { samples.push(a, b); continue; }
      for (let t = 0; t <= 1; t += 0.125) samples.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    const around = `${data.mode === "flight" ? 20000 : 1200},${samples.map(([lng, lat]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join(",")}`;
    const filters = data.mode === "flight" ? ['["aeroway"="aerodrome"]'] : data.mode === "transit" ? ['["highway"="bus_stop"]', '["amenity"="bus_station"]', '["railway"~"^(station|halt|tram_stop)$"]'] : data.mode === "drive" ? ['["amenity"="fuel"]'] : ['["amenity"="cafe"]'];
    const query = `[out:json][timeout:12];(${filters.map((filter) => `nwr${filter}(around:${around});`).join("")});out center tags 250;`;
    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(15000) });
      if (!response.ok) return { stops: [], status: "unavailable" };
      const body = await response.json() as { elements?: StopElement[] };
      const stops = selectRouteStops(body.elements ?? [], data.points, data.mode);
      if (cache.size >= 100) cache.clear();
      cache.set(key, { stops, expires: Date.now() + 30 * 60 * 1000 });
      return { stops, status: "ok" };
    } catch { return { stops: [], status: "unavailable" }; }
  });