import { routeDistanceKm, type RouteMode } from "./route-trails";

export type RouteStop = { id: string; name: string; kind: string; coordinates: [number, number] };
export type StopElement = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

export function stopKind(tags: Record<string, string>) {
  if (tags["aeroway"]) return "Airport";
  if (tags["amenity"] === "fuel") return "Fuel station";
  if (tags["amenity"] === "cafe") return "Café";
  if (tags["railway"]) return "Rail stop";
  return "Bus stop";
}

export function selectRouteStops(elements: StopElement[], points: [number, number][], mode: RouteMode): RouteStop[] {
  const found: { stop: RouteStop; progress: number }[] = [];
  for (const element of elements) {
    const lat = element.lat ?? element.center?.lat, lng = element.lon ?? element.center?.lon;
    if (lat === undefined || lng === undefined) continue;
    const coords: [number, number] = [lng, lat];
    let nearest = Infinity, progress = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      if (!a || !b) continue;
      const scale = Math.cos(a[1] * Math.PI / 180);
      const dx = (b[0] - a[0]) * scale, dy = b[1] - a[1];
      const t = Math.max(0, Math.min(1, (((lng - a[0]) * scale * dx) + (lat - a[1]) * dy) / (dx * dx + dy * dy || 1)));
      const projected: [number, number] = [a[0] + (b[0] - a[0]) * t, a[1] + dy * t];
      const distance = mode === "flight" ? Math.min(routeDistanceKm([a, coords]), routeDistanceKm([b, coords])) : routeDistanceKm([projected, coords]);
      if (distance < nearest) { nearest = distance; progress = i + t; }
    }
    if (nearest > (mode === "flight" ? 20 : 1.2)) continue;
    const tags = element.tags ?? {}, kind = stopKind(tags);
    const stop = { id: `${element.type}/${element.id}`, name: tags["name"] ?? tags["ref"] ?? `Unnamed ${kind.toLowerCase()}`, kind, coordinates: coords };
    if (found.some((other) => other.stop.name === stop.name && routeDistanceKm([other.stop.coordinates, coords]) < 0.15)) continue;
    found.push({ stop, progress });
  }
  return found.sort((a, b) => a.progress - b.progress).slice(0, 10).map(({ stop }) => stop);
}