import { createFileRoute } from "@tanstack/react-router";
import {
  BellRinging,
  CalendarBlank,
  CaretRight,
  Crosshair,
  ArrowRight,
  Briefcase,
  Confetti,
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
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Backyard — Events and jobs around you" },
      { name: "description", content: "Discover events and job opportunities in your city, region, and around the world." },
      { property: "og:title", content: "Backyard — Events and jobs around you" },
      { property: "og:description", content: "Find what is happening and where your next opportunity is." },
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
  kind: "Events" | "Jobs";
};

const initialEvent: EventItem = { id: 1, title: "Lagos Art & Culture Week", place: "Victoria Island, Lagos", date: "Oct 10 · 18:00", category: "Culture", attendees: "2.4k going", coordinates: [3.4219, 6.4281], kind: "Events" };

const events: EventItem[] = [
  initialEvent,
  { id: 2, title: "Cape Town Jazz Nights", place: "Waterfront, Cape Town", date: "Oct 12 · 20:00", category: "Music", attendees: "860 going", coordinates: [18.4241, -33.9249], kind: "Events" },
  { id: 3, title: "Berlin Future Forum", place: "Kreuzberg, Berlin", date: "Oct 16 · 09:00", category: "Technology", attendees: "1.1k going", coordinates: [13.405, 52.52], kind: "Events" },
  { id: 4, title: "Rio Street Food Festival", place: "Copacabana, Rio", date: "Oct 19 · 12:00", category: "Food", attendees: "3.8k going", coordinates: [-43.1729, -22.9068], kind: "Events" },
  { id: 5, title: "Tokyo Design Assembly", place: "Shibuya, Tokyo", date: "Oct 24 · 10:30", category: "Design", attendees: "940 going", coordinates: [139.6917, 35.6895], kind: "Events" },
  { id: 6, title: "New York Run Club", place: "Central Park, New York", date: "Oct 26 · 07:00", category: "Sports", attendees: "530 going", coordinates: [-73.9654, 40.7829], kind: "Events" },
  { id: 7, title: "Product Designer", place: "Yaba, Lagos", date: "Full-time · Hybrid", category: "Design", attendees: "New role", coordinates: [3.3792, 6.5244], kind: "Jobs" },
  { id: 8, title: "Frontend Engineer", place: "Kreuzberg, Berlin", date: "Full-time · Remote", category: "Technology", attendees: "2 days ago", coordinates: [13.3889, 52.517], kind: "Jobs" },
  { id: 9, title: "Community Lead", place: "Brooklyn, New York", date: "Contract · Hybrid", category: "Community", attendees: "New role", coordinates: [-73.9442, 40.6782], kind: "Jobs" },
];

const eventCategories = ["All", "Music", "Culture", "Technology", "Food", "Sports"];
const jobCategories = ["All", "Design", "Technology", "Community"];

function Index() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const [category, setCategory] = useState("All");
  const [kind, setKind] = useState<"Events" | "Jobs">("Events");
  const [selected, setSelected] = useState<EventItem>(initialEvent);
  const [query, setQuery] = useState("");
  const [alerts, setAlerts] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [showBrowse, setShowBrowse] = useState(false);

  const filtered = events.filter((event) => {
    const inCategory = category === "All" || event.category === category;
    const matches = `${event.title} ${event.place}`.toLowerCase().includes(query.toLowerCase());
    return event.kind === kind && inCategory && matches;
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

  function playNotificationPing() {
    if (!window.AudioContext) return;
    const audioContext = new AudioContext();
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.55);
    gain.connect(audioContext.destination);

    [659.25, 987.77].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(audioContext.currentTime + index * 0.11);
      oscillator.stop(audioContext.currentTime + 0.45 + index * 0.11);
    });
    window.setTimeout(() => void audioContext.close(), 800);
  }

  function toggleAlerts() {
    const nextValue = !alerts;
    setAlerts(nextValue);
    if (nextValue) {
      playNotificationPing();
      toast.success("Backyard alerts are on", { description: "We’ll ping you about nearby events and jobs." });
      return;
    }
    toast("Backyard alerts are off");
  }

  function followSelected() {
    setAlerts(true);
    playNotificationPing();
    toast.success(selected.kind === "Jobs" ? "Job saved" : "Event followed", {
      description: selected.kind === "Jobs" ? `We’ll ping you about ${selected.title}.` : `You’ll get updates for ${selected.title}.`,
    });
  }

  return (
    <main className="relative h-dvh min-h-[640px] overflow-hidden bg-background text-foreground">
      <div ref={mapContainer} className="map-shell absolute inset-0" aria-label="Interactive map showing events and jobs" />

      <header className="absolute left-4 right-4 top-4 z-40 flex h-14 items-center justify-between rounded-full border border-foreground/80 bg-background/90 px-3 shadow-sm backdrop-blur-xl md:left-6 md:right-6 md:px-4">
        <div className="flex items-center">
          <div><p className="font-display text-lg font-medium leading-none">Backyard</p><p className="mt-0.5 text-[9px] font-semibold uppercase text-muted-foreground">Events & jobs, nearby</p></div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm"><CalendarBlank className="size-4" weight="duotone" /> This month</Button>
          <Button onClick={toggleAlerts} variant={alerts ? "default" : "outline"} size="sm" aria-pressed={alerts}><BellRinging className={`size-4 ${alerts ? "notification-bell" : ""}`} weight={alerts ? "fill" : "duotone"} /> {alerts ? "Alerts on" : "Notify me"}</Button>
        </div>
      </header>

      <section className="absolute left-4 right-4 top-[5.2rem] z-30 md:left-[23rem] md:right-6">
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-lg border border-border bg-background/90 px-3 shadow-sm backdrop-blur-xl">
          <MagnifyingGlass className="size-5 shrink-0 text-muted-foreground" weight="bold" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${kind.toLowerCase()}, cities or regions`} className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          {query && <Button aria-label="Clear search" variant="ghost" size="icon" className="size-8" onClick={() => setQuery("")}><X className="size-4" /></Button>}
          <Button size="sm" onClick={() => mapRef.current?.flyTo({ center: [3.3792, 6.5244], zoom: 6 })}><Crosshair className="size-4" weight="bold" /><span className="hidden sm:inline">Near me</span></Button>
        </div>
        <div className="mx-auto mt-2 flex max-w-3xl gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {(kind === "Events" ? eventCategories : jobCategories).map((item) => <Button key={item} size="sm" variant={category === item ? "default" : "secondary"} onClick={() => setCategory(item)} className="h-8 shrink-0 bg-background/90 backdrop-blur-xl" aria-pressed={category === item}>{item}</Button>)}
        </div>
      </section>

      <aside className={`absolute bottom-4 left-4 top-[5.2rem] z-30 w-[calc(100%-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card/95 shadow-sm backdrop-blur-xl md:left-6 md:flex md:w-80 ${showBrowse ? "flex" : "hidden"}`}>
        <div className="border-b border-border px-4 py-4"><div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1"><Button variant={kind === "Events" ? "secondary" : "ghost"} size="sm" className="border-0 bg-card" onClick={() => { setKind("Events"); setCategory("All"); setSelected(initialEvent); }}><Confetti className="size-4" weight="duotone" />Events</Button><Button variant={kind === "Jobs" ? "secondary" : "ghost"} size="sm" className="border-0 bg-card" onClick={() => { const firstJob = events.find((item) => item.kind === "Jobs"); setKind("Jobs"); setCategory("All"); if (firstJob) setSelected(firstJob); }}><Briefcase className="size-4" weight="duotone" />Jobs</Button></div><div className="flex items-center justify-between"><div><p className="font-display text-2xl font-normal">In your backyard</p><p className="mt-1 text-xs text-muted-foreground">{filtered.length} {kind.toLowerCase()} to explore</p></div><Button className="md:hidden" aria-label="Close discovery" variant="ghost" size="icon" onClick={() => setShowBrowse(false)}><X className="size-4" /></Button><Sparkle className="hidden size-4 text-primary md:block" weight="duotone" /></div></div>
        <div className="paper-scroll flex-1 overflow-y-auto p-2">
          {filtered.map((event) => (
            <button key={event.id} onClick={() => { focusEvent(event); setShowBrowse(false); }} className={`mb-1 w-full rounded-lg border p-3 text-left transition-colors ${selected.id === event.id ? "border-primary bg-accent" : "border-transparent hover:bg-secondary"}`} aria-pressed={selected.id === event.id}>
               <div className="flex items-start justify-between gap-3"><span className="text-[10px] font-bold uppercase text-primary">{event.category}</span><span className="text-[10px] text-muted-foreground">{event.attendees}</span></div>
               <p className="mt-1 font-display text-lg font-normal leading-tight">{event.title}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" weight="duotone" />{event.place}</p><p className="mt-2 text-xs font-semibold">{event.date}</p>
            </button>
          ))}
        </div>
      </aside>

      {showPanel && (
         <section className="absolute bottom-4 left-4 right-4 z-30 rounded-xl border border-border bg-card p-4 shadow-sm backdrop-blur-xl md:bottom-6 md:left-auto md:right-8 md:w-[25rem]">
           <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase text-primary">{selected.kind === "Jobs" ? "Opportunity" : "Trending"} in {selected.place.split(",").at(-1)}</p><h1 className="mt-1 font-display text-2xl font-normal leading-tight">{selected.title}</h1></div><Button aria-label="Close details" variant="ghost" size="icon" onClick={() => setShowPanel(false)}><X className="size-4" /></Button></div>
           <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarBlank className="size-4 text-primary" weight="duotone" />{selected.date}</span><span className="flex items-center gap-1"><MapPin className="size-4 text-primary" weight="fill" />{selected.place}</span></div>
              <div className="mt-4 flex gap-2"><Button className="flex-1" onClick={() => showDirections(selected)}><NavigationArrow className="size-4" weight="fill" /> Show route <ArrowRight className="size-4" /></Button><Button variant="secondary" onClick={followSelected}>{selected.kind === "Jobs" ? <Briefcase className="size-4" weight="duotone" /> : <BellRinging className={`size-4 ${alerts ? "notification-bell" : ""}`} weight={alerts ? "fill" : "duotone"} />} {selected.kind === "Jobs" ? "Save" : alerts ? "Following" : "Follow"}</Button></div>
        </section>
      )}

      <div className="absolute bottom-5 right-5 z-20 hidden flex-col gap-2 md:flex"><Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus className="size-4" weight="bold" /></Button><Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus className="size-4" weight="bold" /></Button></div>
      <Button className="absolute right-4 top-[9.8rem] z-30 bg-background/90 backdrop-blur-xl md:hidden" variant="secondary" size="sm" onClick={() => setShowBrowse(true)}><List className="size-4" weight="duotone" />Explore <CaretRight className="size-4" weight="bold" /></Button>
    </main>
  );
}
