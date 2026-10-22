import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bus, MapPin } from "@phosphor-icons/react";
import { Button } from "./ui/button";
import { getRouteStops } from "@/lib/route-stops.functions";
import type { RouteMode } from "@/lib/route-trails";
import type { RouteStop } from "@/lib/route-stops";

export function RouteStops({ route, map }: { route: { points: [number, number][]; mode: RouteMode }; map: import("maplibre-gl").Map | null }) {
  const fetchStops = useServerFn(getRouteStops);
  const [result, setResult] = useState<{ stops: RouteStop[]; status: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setResult(null);
    void fetchStops({ data: route }).then((value) => { if (!cancelled) setResult(value); }).catch(() => { if (!cancelled) setResult({ stops: [], status: "unavailable" }); });
    return () => { cancelled = true; };
  }, [route, fetchStops]);
  useEffect(() => {
    if (!map || !result?.stops.length) return;
    let cancelled = false;
    const markers: import("maplibre-gl").Marker[] = [];
    void import("maplibre-gl").then(({ Marker, Popup }) => {
      if (cancelled) return;
      result.stops.forEach((stop, index) => {
        const node = document.createElement("div");
        node.className = "grid size-6 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground text-[10px] font-bold";
        node.textContent = String(index + 1);
        const popup = new Popup({ offset: 15 }).setText(`${stop.name} · ${stop.kind} · Suggested nearby stop`);
        markers.push(new Marker({ element: node }).setLngLat(stop.coordinates).setPopup(popup).addTo(map));
      });
    });
    return () => { cancelled = true; markers.forEach((marker) => marker.remove()); };
  }, [map, result]);
  return <div className="mt-3 border-t border-border pt-3" aria-live="polite">
    <p className="flex items-center gap-2 text-xs font-semibold"><Bus className="size-4 text-primary" weight="fill" />Suggested stops</p>
    {!result ? <p className="breathe-shimmer mt-2 text-xs">Checking stops along the way…</p> : <>
      <div className="mt-2 max-h-28 overflow-y-auto space-y-1">{result.stops.map((stop, index) => <Button key={stop.id} variant="ghost" className="h-auto w-full justify-start rounded-lg px-2 py-2 text-left" onClick={() => map?.flyTo({ center: stop.coordinates, zoom: 15, pitch: 45, duration: 1000 })}><span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[10px]">{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs">{stop.name}</span><span className="block text-[10px] text-muted-foreground">{stop.kind}</span></span><MapPin className="size-3 shrink-0" weight="fill" /></Button>)}</div>
      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{result.status === "unavailable" ? "Stop lookup is unavailable. Try Show route again." : result.status === "long-distance" ? "Stop suggestions are available for local routes up to 150 km." : result.stops.length ? "Near the estimated path, not a confirmed service itinerary. © OpenStreetMap contributors." : "No mapped stops found near this estimated path."}</p>
    </>}
  </div>;
}