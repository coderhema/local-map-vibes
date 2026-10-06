import { createFileRoute } from "@tanstack/react-router";
import {
  BellRinging,
  CalendarBlank,
  CaretRight,
  CompassRose,
  Crosshair,
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
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [12, 8],
        zoom: 1.25,
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
        map.addLayer({ id: "event-route-shadow", type: "line", source: "event-route", paint: { "line-color": "rgb(12, 32, 35)", "line-width": 6, "line-opacity": 0.55 } });
        map.addLayer({ id: "event-route", type: "line", source: "event-route", paint: { "line-color": "rgb(230, 145, 18)", "line-width": 3, "line-opacity": 0.95, "line-dasharray": [2, 1.4] } });
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

  return (
    <main className="relative h-dvh min-h-[640px] overflow-hidden bg-background text-foreground">
      <div ref={mapContainer} className="map-shell absolute inset-x-0 bottom-0 top-[9rem]" aria-label="Interactive globe showing events" />
      <div className="pointer-events-none absolute inset-x-0 top-[9rem] z-10 h-24 bg-gradient-to-b from-background to-transparent" />

      <header className="relative z-20 flex h-20 items-center justify-between border-b border-border/60 bg-background/90 px-5 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground"><CompassRose className="size-6" weight="fill" /></div>
          <div><p className="font-display text-xl font-bold leading-none">ATLAS</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Events without borders</p></div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm"><CalendarBlank className="size-4" weight="duotone" /> This month</Button>
          <Button onClick={() => setAlerts((value) => !value)} variant={alerts ? "default" : "outline"} size="sm"><BellRinging className="size-4" weight="duotone" /> {alerts ? "Alerts on" : "Notify me"}</Button>
        </div>
      </header>

      <section className="absolute left-0 right-0 top-20 z-20 px-4 pt-4 md:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-2 rounded-md border border-border bg-surface px-3 shadow-2xl backdrop-blur-xl">
          <MagnifyingGlass className="size-5 shrink-0 text-muted-foreground" weight="bold" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a city, region or event" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <Button size="sm" onClick={() => mapRef.current?.flyTo({ center: [3.3792, 6.5244], zoom: 6 })}><Crosshair className="size-4" weight="bold" /><span className="hidden sm:inline">Near me</span></Button>
        </div>
        <div className="mx-auto mt-3 flex max-w-4xl gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {categories.map((item) => <Button key={item} size="sm" variant={category === item ? "default" : "secondary"} onClick={() => setCategory(item)} className="shrink-0">{item}</Button>)}
        </div>
      </section>

      <aside className="absolute bottom-5 left-4 top-[13.5rem] z-20 hidden w-80 flex-col overflow-hidden border border-border bg-surface shadow-2xl backdrop-blur-xl md:flex">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="text-sm font-bold">Around the world</p><p className="text-xs text-muted-foreground">{filtered.length} upcoming events</p></div><Sparkle className="size-4 text-primary" weight="fill" /></div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((event) => (
            <button key={event.id} onClick={() => focusEvent(event)} className={`mb-1 w-full rounded-md border p-3 text-left transition-colors ${selected.id === event.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-accent/60"}`}>
              <div className="flex items-start justify-between gap-3"><span className="text-[10px] font-bold uppercase text-primary">{event.category}</span><span className="text-[10px] text-muted-foreground">{event.attendees} going</span></div>
              <p className="mt-1 text-sm font-bold">{event.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" weight="fill" />{event.place}</p><p className="mt-2 text-xs font-semibold">{event.date}</p>
            </button>
          ))}
        </div>
      </aside>

      {showPanel && (
        <section className="absolute bottom-4 left-4 right-4 z-30 border border-border bg-card p-4 shadow-2xl backdrop-blur-xl md:bottom-6 md:left-auto md:right-8 md:w-96">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase text-live">Trending in {selected.place.split(",").at(-1)}</p><h1 className="mt-1 font-display text-xl font-bold">{selected.title}</h1></div><Button aria-label="Close event details" variant="ghost" size="icon" onClick={() => setShowPanel(false)}><X className="size-4" /></Button></div>
           <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarBlank className="size-4 text-primary" weight="duotone" />{selected.date}</span><span className="flex items-center gap-1"><MapPin className="size-4 text-primary" weight="fill" />{selected.place}</span></div>
           <div className="mt-4 flex gap-2"><Button className="flex-1" onClick={() => mapRef.current?.flyTo({ center: selected.coordinates, zoom: 9 })}><NavigationArrow className="size-4" weight="fill" /> Get directions</Button><Button variant="secondary" onClick={() => setAlerts(true)}><BellRinging className="size-4" weight="duotone" /> Follow</Button></div>
        </section>
      )}

      <div className="absolute bottom-5 right-5 z-20 hidden flex-col gap-2 md:flex"><Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus className="size-4" weight="bold" /></Button><Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus className="size-4" weight="bold" /></Button></div>
      <Button className="absolute right-4 top-[9.2rem] z-30 md:hidden" variant="secondary" size="sm" onClick={() => setShowPanel(true)}>{filtered.length} events <CaretRight className="size-4" weight="bold" /></Button>
    </main>
  );
}
