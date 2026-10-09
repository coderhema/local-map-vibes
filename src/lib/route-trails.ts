import type { Map as LibreMap } from "maplibre-gl";

export type RouteMode = "flight" | "transit" | "drive" | "walk";
export type RouteCoordinate = [number, number];
export const ROUTE_LABELS: Record<RouteMode, string> = { flight: "Flight", transit: "Train", drive: "Drive", walk: "Walk" };

export function routeDistanceKm(points: RouteCoordinate[]) {
  const r = Math.PI / 180;
  let km = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (!a || !b) continue;
    const h = Math.sin((b[1] - a[1]) * r / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin((b[0] - a[0]) * r / 2) ** 2;
    km += 12742 * Math.asin(Math.sqrt(Math.min(1, h)));
  }
  return km;
}

// Great-circle centerline, with an endpoint-tapered cross-track wave for flight.
export function routePath(a: RouteCoordinate, b: RouteCoordinate, mode: RouteMode, steps = 192): RouteCoordinate[] {
  const r = Math.PI / 180;
  const vector = ([lng, lat]: RouteCoordinate) => [Math.cos(lat * r) * Math.cos(lng * r), Math.cos(lat * r) * Math.sin(lng * r), Math.sin(lat * r)];
  const u = vector(a), v = vector(b);
  const ux = u[0] ?? 0, uy = u[1] ?? 0, uz = u[2] ?? 0;
  const vx = v[0] ?? 0, vy = v[1] ?? 0, vz = v[2] ?? 0;
  const angle = Math.acos(Math.max(-1, Math.min(1, ux * vx + uy * vy + uz * vz)));
  if (angle < 1e-6) return [a, b];
  const normal = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  const length = Math.hypot(...normal);
  if (length < 1e-6) {
    const midpoint: RouteCoordinate = [a[0] + 90, 0];
    return [...routePath(a, midpoint, mode, steps / 2), ...routePath(midpoint, b, mode, steps / 2).slice(1)];
  }
  const points: RouteCoordinate[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const A = Math.sin((1 - t) * angle) / Math.sin(angle), B = Math.sin(t * angle) / Math.sin(angle);
    const wave = mode === "flight" ? Math.sin(t * Math.PI * 8) * Math.sin(t * Math.PI) ** 2 * Math.min(angle * 0.055, 0.08) : 0;
    const x = A * ux + B * vx + (normal[0] ?? 0) / length * wave;
    const y = A * uy + B * vy + (normal[1] ?? 0) / length * wave;
    const z = A * uz + B * vz + (normal[2] ?? 0) / length * wave;
    points.push([Math.atan2(y, x) / r, Math.atan2(z, Math.hypot(x, y)) / r]);
  }
  points[0] = a;
  points[points.length - 1] = b;
  return points;
}

// Small locally generated, seamless textures: no downloads or per-frame DOM work.
export function installRouteTrails(map: LibreMap) {
  const palette = getComputedStyle(document.documentElement);
  const color = palette.getPropertyValue("--route-color").trim();
  for (const mode of ["transit", "drive", "walk"] as const) {
    const canvas = document.createElement("canvas");
    canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.scale(2, 2);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = "round";
    if (mode === "transit") {
      ctx.lineWidth = 2.4;
      for (const y of [9, 23]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(64, y); ctx.stroke(); }
      ctx.lineWidth = 3;
      for (let x = 8; x < 64; x += 16) { ctx.beginPath(); ctx.moveTo(x, 5); ctx.lineTo(x, 27); ctx.stroke(); }
    } else if (mode === "drive") {
      ctx.lineWidth = 1.2;
      for (const y of [8, 24]) {
        for (const offset of [-3, 3]) { ctx.beginPath(); ctx.moveTo(0, y + offset); ctx.lineTo(64, y + offset); ctx.stroke(); }
        ctx.lineWidth = 2;
        for (let x = 4; x < 64; x += 8) { ctx.beginPath(); ctx.moveTo(x - 2, y - 2); ctx.lineTo(x + 1, y); ctx.lineTo(x - 2, y + 2); ctx.stroke(); }
        ctx.lineWidth = 1.2;
      }
    } else {
      for (const [x, y, tilt] of [[14, 9, -0.18], [46, 23, 0.18]]) {
        if (x === undefined || y === undefined || tilt === undefined) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
        ctx.beginPath(); ctx.ellipse(-2, 0, 5.5, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(5, 0, 2.3, 3.1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    map.addImage(`route-${mode}`, ctx.getImageData(0, 0, 128, 64), { pixelRatio: 2 });
  }
  map.addSource("event-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({ id: "event-route-shadow", type: "line", source: "event-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": palette.getPropertyValue("--route-shadow").trim(), "line-width": 10, "line-opacity": 0.1, "line-blur": 4 } });
  map.addLayer({ id: "event-route", type: "line", source: "event-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": color, "line-width": 5, "line-opacity": 0.95 } });
  map.addLayer({ id: "event-route-hit", type: "line", source: "event-route", paint: { "line-width": 32, "line-opacity": 0 } });
}

export function setRouteTrail(map: LibreMap, mode: RouteMode) {
  if (!map.getLayer("event-route")) return;
  map.setPaintProperty("event-route", "line-pattern", mode === "flight" ? undefined : `route-${mode}`);
  map.setPaintProperty("event-route", "line-width", mode === "flight" ? 5 : 32);
  map.setPaintProperty("event-route-shadow", "line-opacity", mode === "flight" ? 0.1 : 0);
}