import { createFileRoute } from "@tanstack/react-router";
import {
  BellRinging,
  CalendarBlank,
  CaretRight,
  CompassRose,
  Crosshair,
  ArrowRight,
  List,
  MagnifyingGlass,
  MapPin,
  Minus,
  NavigationArrow,
  Plus,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas — Discover events around the world" },
      { name: "description", content: "Explore live music, culture, technology and community events near you or anywhere on Earth." },
      { property: "og:title", content: "Atlas — Global Event Finder" },
      { property: "og:description", content: "Your world, happening now. Discover events by map, region and interest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type EventItem = {
  id: number;
  title: string;
  place: string;
  date: string;
  category: string;
  attendees: string;
  coordinates: [number, number];
};

const initialEvent: EventItem = { id: 1, title: "Lagos Art & Culture Week", place: "Victoria Island, Lagos", date: "Oct 10 · 18:00", category: "Culture", attendees: "2.4k", coordinates: [3.4219, 6.4281] };

const events: EventItem[] = [
  initialEvent,
  { id: 2, title: "Cape Town Jazz Nights", place: "Waterfront, Cape Town", date: "Oct 12 · 20:00", category: "Music", attendees: "860", coordinates: [18.4241, -33.9249] },
  { id: 3, title: "Berlin Future Forum", place: "Kreuzberg, Berlin", date: "Oct 16 · 09:00", category: "Technology", attendees: "1.1k", coordinates: [13.405, 52.52] },
  { id: 4, title: "Rio Street Food Festival", place: "Copacabana, Rio", date: "Oct 19 · 12:00", category: "Food", attendees: "3.8k", coordinates: [-43.1729, -22.9068] },
  { id: 5, title: "Tokyo Design Assembly", place: "Shibuya, Tokyo", date: "Oct 24 · 10:30", category: "Design", attendees: "940", coordinates: [139.6917, 35.6895] },
  { id: 6, title: "New York Run Club", place: "Central Park, New York", date: "Oct 26 · 07:00", category: "Sports", attendees: "530", coordinates: [-73.9654, 40.7829] },
];

const categories = ["All events", "Music", "Culture", "Technology", "Food", "Sports"];

function Index() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const [category, setCategory] = useState("All events");
  const [selected, setSelected] = useState<EventItem>(initialEvent);
  const [query, setQuery] = useState("");
  const [alerts, setAlerts] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [showBrowse, setShowBrowse] = useState(false);

  const filtered = events.filter((event) => {
    const inCategory = category === "All events" || event.category === category;
    const matches = `${event.title} ${event.place}`.toLowerCase().includes(query.toLowerCase());
    return inCategory && matches;
  });

  useEffect(() => {
    let disposed = false;
    async function mountMap() {
      if (!mapContainer.current || mapRef.current) return;
      const maplibregl = await import("maplibre-gl");
      if (disposed || !mapContainer.current) return;
      maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            atlasBasemap: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "atlas-basemap", type: "raster", source: "atlasBasemap", paint: { "raster-saturation": -0.55, "raster-contrast": -0.08, "raster-brightness-min": 0.18, "raster-brightness-max": 0.96 } }],
        },
        center: [10, 8],
        zoom: 1.45,
        minZoom: 0.8,
        maxZoom: 14,
        attributionControl: false,
        renderWorldCopies: false,
      });
      mapRef.current = map;
      map.on("style.load", () => {
        map.setProjection({ type: "globe" });
        map.addSource("event-route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[3.4219, 6.4281], [18.4241, -33.9249], [13.405, 52.52], [-43.1729, -22.9068]] } },
        });
        map.addLayer({ id: "event-route-shadow", type: "line", source: "event-route", paint: { "line-color": "rgb(255, 255, 255)", "line-width": 5, "line-opacity": 0.82 } });
        map.addLayer({ id: "event-route", type: "line", source: "event-route", paint: { "line-color": "rgb(65, 161, 207)", "line-width": 2, "line-opacity": 0.95, "line-dasharray": [2, 1.6] } });
      });
      events.forEach((event) => {
        const node = document.createElement("button");
        node.className = `event-marker${event.id === 1 ? " active" : ""}`;
        node.setAttribute("aria-label", `Open ${event.title}`);
        node.innerHTML = `<span>${event.category.slice(0, 2).toUpperCase()}</span>`;
        node.addEventListener("click", () => {
          setSelected(event);
          setShowPanel(true);
          map.flyTo({ center: event.coordinates, zoom: 5, duration: 1400 });
        });
        new maplibregl.Marker({ element: node, anchor: "bottom" }).setLngLat(event.coordinates).addTo(map);
      });
      const observer = new ResizeObserver(() => map.resize());
      observer.observe(mapContainer.current);
      map.once("load", () => map.resize());
    }
    void mountMap();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  function focusEvent(event: EventItem) {
    setSelected(event);
    setShowPanel(true);
    mapRef.current?.flyTo({ center: event.coordinates, zoom: 5, duration: 1400 });
  }

  function showDirections(event: EventItem) {
    const map = mapRef.current;
    if (!map) return;
    const origin: [number, number] = [3.3792, 6.5244];
    const source = map.getSource("event-route") as import("maplibre-gl").GeoJSONSource | undefined;
    source?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [origin, event.coordinates] } });
    map.fitBounds([origin, event.coordinates], { padding: 120, duration: 1400, maxZoom: 7 });
  }

  return (
    <main className="relative h-dvh min-h-[640px] overflow-hidden bg-background text-foreground">
      <div ref={mapContainer} className="map-shell editorial-map absolute -bottom-[18%] -right-[12%] left-[20%] top-[8.5rem] md:left-[18rem] lg:left-[22rem]" aria-label="Interactive globe showing events" />

      <header className="relative z-30 mx-auto mt-4 flex h-14 w-[calc(100%-2rem)] max-w-5xl items-center justify-between rounded-full border border-foreground/80 bg-background/85 px-3 shadow-sm backdrop-blur-xl md:px-4">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-full border border-foreground"><CompassRose className="size-4" weight="duotone" /></div>
          <div><p className="font-display text-lg font-medium leading-none">Atlas</p><p className="mt-0.5 text-[9px] font-semibold uppercase text-muted-foreground">Events without borders</p></div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm"><CalendarBlank className="size-4" weight="duotone" /> This month</Button>
          <Button onClick={() => setAlerts((value) => !value)} variant={alerts ? "default" : "outline"} size="sm"><BellRinging className="size-4" weight="duotone" /> {alerts ? "Alerts on" : "Notify me"}</Button>
        </div>
      </header>

      <section className="absolute left-0 right-0 top-[5.2rem] z-20 px-4 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-2 border-b border-foreground bg-input px-3">
          <MagnifyingGlass className="size-5 shrink-0 text-muted-foreground" weight="bold" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a city, region or event" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          {query && <Button aria-label="Clear search" variant="ghost" size="icon" className="size-8" onClick={() => setQuery("")}><X className="size-4" /></Button>}
          <Button size="sm" onClick={() => mapRef.current?.flyTo({ center: [3.3792, 6.5244], zoom: 6 })}><Crosshair className="size-4" weight="bold" /><span className="hidden sm:inline">Near me</span></Button>
        </div>
        <div className="mx-auto mt-3 flex max-w-4xl gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {categories.map((item) => <Button key={item} size="sm" variant={category === item ? "default" : "ghost"} onClick={() => setCategory(item)} className="h-8 shrink-0" aria-pressed={category === item}>{item}</Button>)}
        </div>
      </section>

      <aside className={`absolute bottom-4 left-4 top-[12.8rem] z-30 w-[calc(100%-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm backdrop-blur-xl md:left-6 md:flex md:w-80 ${showBrowse ? "flex" : "hidden"}`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-4"><div><p className="font-display text-2xl font-normal">Around the world</p><p className="mt-1 text-xs text-muted-foreground">{filtered.length} upcoming events</p></div><Button className="md:hidden" aria-label="Close events" variant="ghost" size="icon" onClick={() => setShowBrowse(false)}><X className="size-4" /></Button><Sparkle className="hidden size-4 text-primary md:block" weight="duotone" /></div>
        <div className="paper-scroll flex-1 overflow-y-auto p-2">
          {filtered.map((event) => (
            <button key={event.id} onClick={() => { focusEvent(event); setShowBrowse(false); }} className={`mb-1 w-full rounded-lg border p-3 text-left transition-colors ${selected.id === event.id ? "border-primary bg-accent" : "border-transparent hover:bg-secondary"}`} aria-pressed={selected.id === event.id}>
              <div className="flex items-start justify-between gap-3"><span className="text-[10px] font-bold uppercase text-primary">{event.category}</span><span className="text-[10px] text-muted-foreground">{event.attendees} going</span></div>
               <p className="mt-1 font-display text-lg font-normal leading-tight">{event.title}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" weight="duotone" />{event.place}</p><p className="mt-2 text-xs font-semibold">{event.date}</p>
            </button>
          ))}
        </div>
      </aside>

      {showPanel && (
         <section className="absolute bottom-4 left-4 right-4 z-30 rounded-xl border border-border bg-card p-4 shadow-sm backdrop-blur-xl md:bottom-6 md:left-auto md:right-8 md:w-[25rem]">
           <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase text-primary">Trending in {selected.place.split(",").at(-1)}</p><h1 className="mt-1 font-display text-2xl font-normal leading-tight">{selected.title}</h1></div><Button aria-label="Close event details" variant="ghost" size="icon" onClick={() => setShowPanel(false)}><X className="size-4" /></Button></div>
           <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarBlank className="size-4 text-primary" weight="duotone" />{selected.date}</span><span className="flex items-center gap-1"><MapPin className="size-4 text-primary" weight="fill" />{selected.place}</span></div>
            <div className="mt-4 flex gap-2"><Button className="flex-1" onClick={() => showDirections(selected)}><NavigationArrow className="size-4" weight="fill" /> Show route <ArrowRight className="size-4" /></Button><Button variant="secondary" onClick={() => setAlerts(true)}><BellRinging className="size-4" weight="duotone" /> Follow</Button></div>
        </section>
      )}

      <div className="absolute bottom-5 right-5 z-20 hidden flex-col gap-2 md:flex"><Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus className="size-4" weight="bold" /></Button><Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus className="size-4" weight="bold" /></Button></div>
      <Button className="absolute right-4 top-[10.2rem] z-30 md:hidden" variant="secondary" size="sm" onClick={() => setShowBrowse(true)}><List className="size-4" weight="duotone" />{filtered.length} events <CaretRight className="size-4" weight="bold" /></Button>
    </main>
  );
}
