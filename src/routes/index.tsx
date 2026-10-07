import { createFileRoute } from "@tanstack/react-router";
import {
  BellRinging,
  CalendarBlank,
  CaretRight,
  ArrowRight,
  Briefcase,
  Confetti,
  GlobeHemisphereWest,
  List,
  MagnifyingGlass,
  MapTrifold,
  MapPin,
  Minus,
  NavigationArrow,
  Plus,
  SidebarSimple,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LocationAssistant } from "@/components/location-assistant";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { pinDuotonePaths } from "@/lib/pin-icons";

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

/* Phosphor bold-weight paths (viewBox 0 0 256 256) for the pin icons */
const pinIconPaths: Record<string, string> = {
  Music: "M215.38,14.54a12,12,0,0,0-10.29-2.18l-128,32A12,12,0,0,0,68,56V159.35A40,40,0,1,0,92,196V113.37l104-26v40A40,40,0,1,0,220,164V24A12,12,0,0,0,215.38,14.54ZM52,212a16,16,0,1,1,16-16A16,16,0,0,1,52,212ZM92,88.63V65.37l104-26V62.63ZM180,180a16,16,0,1,1,16-16A16,16,0,0,1,180,180Z",
  Culture: "M203.57,51A107.9,107.9,0,0,0,20,128c0,44.72,27.6,82.25,72,97.94A36,36,0,0,0,140,192a12,12,0,0,1,12-12h46.21a35.79,35.79,0,0,0,35.1-28A108.6,108.6,0,0,0,236,127.09,107.23,107.23,0,0,0,203.57,51Zm6.34,95.67a11.91,11.91,0,0,1-11.7,9.3H152a36,36,0,0,0-36,36,12,12,0,0,1-16,11.3c-16.65-5.88-30.65-15.76-40.48-28.56A76,76,0,0,1,44,128a84,84,0,0,1,83.13-84H128a84.35,84.35,0,0,1,84,83.29A84.72,84.72,0,0,1,209.91,146.71ZM144,76a16,16,0,1,1-16-16A16,16,0,0,1,144,76Zm-44,24A16,16,0,1,1,84,84,16,16,0,0,1,100,100Zm0,56a16,16,0,1,1-16-16A16,16,0,0,1,100,156Zm88-56a16,16,0,1,1-16-16A16,16,0,0,1,188,100Z",
  Technology: "M156,88H100a12,12,0,0,0-12,12v56a12,12,0,0,0,12,12h56a12,12,0,0,0,12-12V100A12,12,0,0,0,156,88Zm-12,56H112V112h32Zm88-4H220V116h12a12,12,0,0,0,0-24H220V56a20,20,0,0,0-20-20H164V24a12,12,0,0,0-24,0V36H116V24a12,12,0,0,0-24,0V36H56A20,20,0,0,0,36,56V92H24a12,12,0,0,0,0,24H36v24H24a12,12,0,0,0,0,24H36v36a20,20,0,0,0,20,20H92v12a12,12,0,0,0,24,0V220h24v12a12,12,0,0,0,24,0V220h36a20,20,0,0,0,20-20V164h12a12,12,0,0,0,0-24Zm-36,56H60V60H196Z",
  Food: "M68,88V40a12,12,0,0,1,24,0V88a12,12,0,0,1-24,0ZM220,40V224a12,12,0,0,1-24,0V180H152a12,12,0,0,1-12-12,273.23,273.23,0,0,1,7.33-57.82C157.42,68.42,176.76,40.33,203.27,29A12,12,0,0,1,220,40ZM196,62.92C182.6,77,175,98,170.77,115.38A254.41,254.41,0,0,0,164.55,156H196ZM128,39A12,12,0,0,0,104,41l4,47.46a28,28,0,0,1-56,0L56,41A12,12,0,1,0,32,39L28,87c0,.34,0,.67,0,1a52.1,52.1,0,0,0,40,50.59V224a12,12,0,0,0,24,0V138.59A52.1,52.1,0,0,0,132,88c0-.33,0-.66,0-1Z",
  Sports: "M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20ZM60,177.28A83.59,83.59,0,0,1,44.87,140H75.14A83.1,83.1,0,0,1,60,177.28ZM44.87,116A83.59,83.59,0,0,1,60,78.72,83.1,83.1,0,0,1,75.14,116ZM116,211.13a83.63,83.63,0,0,1-39-16.46A106.94,106.94,0,0,0,99.34,140H116ZM116,116H99.34A106.94,106.94,0,0,0,77,61.33a83.63,83.63,0,0,1,39-16.46Zm80-37.28A83.59,83.59,0,0,1,211.13,116H180.86A83.1,83.1,0,0,1,196,78.72ZM140,211.13V140h16.66A106.94,106.94,0,0,0,179,194.67,83.63,83.63,0,0,1,140,211.13ZM156.66,116H140V44.87a83.63,83.63,0,0,1,39,16.46A106.94,106.94,0,0,0,156.66,116ZM196,177.28A83.1,83.1,0,0,1,180.86,140h30.27A83.59,83.59,0,0,1,196,177.28Z",
  Design: "M252,92.68a19.86,19.86,0,0,0-5.86-14.14L177.46,9.85a20,20,0,0,0-28.29,0L121.35,37.67,64.11,59.14A20,20,0,0,0,51.4,74.58L28.16,214A12,12,0,0,0,40,228a11.9,11.9,0,0,0,2-.16l139.45-23.25a20.07,20.07,0,0,0,15.44-12.7l21.46-57.25,27.82-27.82A19.85,19.85,0,0,0,252,92.68ZM175.2,181.3,75,198l33-33a34,34,0,1,0-17-17L58,181,74.7,80.8,125,61.94,194.05,131ZM112,134a10,10,0,1,1,10,10A10,10,0,0,1,112,134Zm96-23L145,48l18.34-18.34,63,63Z",
  Community: "M125.18,156.94a64,64,0,1,0-82.36,0,100.23,100.23,0,0,0-39.49,32,12,12,0,0,0,19.35,14.2,76,76,0,0,1,122.64,0,12,12,0,0,0,19.36-14.2A100.33,100.33,0,0,0,125.18,156.94ZM44,108a40,40,0,1,1,40,40A40,40,0,0,1,44,108Zm206.1,97.67a12,12,0,0,1-16.78-2.57A76.31,76.31,0,0,0,172,172a12,12,0,0,1,0-24,40,40,0,1,0-10.3-78.67,12,12,0,1,1-6.16-23.19,64,64,0,0,1,57.64,110.8,100.23,100.23,0,0,1,39.49,32A12,12,0,0,1,250.1,205.67Z",
  Briefcase: "M100,100a12,12,0,0,1,12-12h32a12,12,0,0,1,0,24H112A12,12,0,0,1,100,100ZM236,68V196a20,20,0,0,1-20,20H40a20,20,0,0,1-20-20V68A20,20,0,0,1,40,48H76V40a28,28,0,0,1,28-28h48a28,28,0,0,1,28,28v8h36A20,20,0,0,1,236,68ZM100,48h56V40a4,4,0,0,0-4-4H104a4,4,0,0,0-4,4ZM44,72v35.23A180.06,180.06,0,0,0,128,128a180,180,0,0,0,84-20.78V72ZM212,192V133.94A204.27,204.27,0,0,1,128,152a204.21,204.21,0,0,1-84-18.06V192Z",
};

void pinIconPaths;
function pinIconSvg(category: string) {
  const [fill, outline] = pinDuotonePaths[category] ?? pinDuotonePaths["Briefcase"];
  return `<svg class="pin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="${fill}" opacity="0.32"/><path d="${outline}"/></svg>`;
}

/* Great-circle interpolation so routes curve naturally over the globe */
function arcPoints(a: [number, number], b: [number, number], steps = 96): [number, number][] {
  const r = Math.PI / 180;
  const [l1, p1, l2, p2] = [a[0] * r, a[1] * r, b[0] * r, b[1] * r];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2));
  if (d < 1e-6) return [a, b];
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2);
    const y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2);
    const z = A * Math.sin(p1) + B * Math.sin(p2);
    pts.push([Math.atan2(y, x) / r, Math.atan2(z, Math.sqrt(x * x + y * y)) / r]);
  }
  return pts;
}

function Index() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRefs = useRef(new Map<number, HTMLButtonElement>());
  const [category, setCategory] = useState("All");
  const [kind, setKind] = useState<"Events" | "Jobs">("Events");
  const [selected, setSelected] = useState<EventItem>(initialEvent);
  const [query, setQuery] = useState("");
  const [alerts, setAlerts] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [showBrowse, setShowBrowse] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isGlobe, setIsGlobe] = useState(true);
  const [tour, setTour] = useState<EventItem[]>([]);
  const tourActionRef = useRef<(event: EventItem, shift: boolean) => void>(() => {});

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
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [10, 8],
        zoom: 2.65,
        minZoom: 0.8,
        maxZoom: 14,
        attributionControl: false,
        renderWorldCopies: false,
      });
      mapRef.current = map;
      map.on("style.load", () => {
        map.setProjection({ type: "globe" });
        map.setPadding({ top: 210, right: 0, bottom: 0, left: 0 });
        tintBasemap(map as unknown as Parameters<typeof tintBasemap>[0]);
        map.addSource("event-route", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({ id: "event-route-shadow", type: "line", source: "event-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#2a1546", "line-width": 8, "line-opacity": 0.18, "line-blur": 2 } });
        map.addLayer({ id: "event-route", type: "line", source: "event-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#7c4ddb", "line-width": 4, "line-opacity": 0.95 } });
      });
      events.forEach((event) => {
        const node = document.createElement("button");
        node.className = `event-marker${event.id === 1 ? " active" : ""}`;
        node.setAttribute("aria-label", `Open ${event.title}`);
        node.innerHTML = `<span class="pin-pulse"></span><span class="pin-shape">${pinIconSvg(event.category)}</span><span class="pin-shadow"></span><span class="pin-label">${event.title}</span>`;
        let pressTimer = 0;
        let longPressed = false;
        const startPress = (e: PointerEvent) => {
          longPressed = false;
          const shift = e.shiftKey;
          pressTimer = window.setTimeout(() => { longPressed = true; tourActionRef.current(event, shift); }, 450);
        };
        const cancelPress = () => window.clearTimeout(pressTimer);
        node.addEventListener("pointerdown", startPress);
        node.addEventListener("pointerup", cancelPress);
        node.addEventListener("pointerleave", cancelPress);
        node.addEventListener("contextmenu", (e) => e.preventDefault());
        node.addEventListener("click", (e) => {
          if (longPressed) { longPressed = false; return; }
          if (e.shiftKey) { tourActionRef.current(event, true); return; }
          setSelected(event);
          setShowPanel(true);
          markerRefs.current.forEach((marker) => marker.classList.remove("active"));
          node.classList.add("active");
          map.easeTo({ center: event.coordinates, zoom: Math.max(map.getZoom(), 4.5), duration: 950, essential: true });
        });
        markerRefs.current.set(event.id, node);
        new maplibregl.Marker({ element: node, anchor: "bottom", subpixelPositioning: true }).setLngLat(event.coordinates).addTo(map);
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
      markerRefs.current.clear();
    };
  }, []);

  function focusEvent(event: EventItem) {
    setSelected(event);
    setShowPanel(true);
    markerRefs.current.forEach((marker, id) => marker.classList.toggle("active", id === event.id));
    mapRef.current?.easeTo({ center: event.coordinates, zoom: 5, duration: 950, essential: true });
  }

  function locateUser() {
    if (!navigator.geolocation) {
      toast.error("Location is unavailable in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => mapRef.current?.easeTo({ center: [coords.longitude, coords.latitude], zoom: 9, duration: 1100, essential: true }),
      () => {
        mapRef.current?.easeTo({ center: [3.3792, 6.5244], zoom: 6, duration: 950, essential: true });
        toast("Showing Lagos", { description: "Allow location access to center on your position." });
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }

  function toggleProjection() {
    const nextIsGlobe = !isGlobe;
    setIsGlobe(nextIsGlobe);
    mapRef.current?.setProjection({ type: nextIsGlobe ? "globe" : "mercator" });
    mapRef.current?.easeTo({
      center: [10, 8],
      zoom: nextIsGlobe ? 2.65 : 1.2,
      padding: { top: nextIsGlobe ? 210 : 0, right: 0, bottom: 0, left: 0 },
      duration: 900,
      essential: true,
    });
  }

  const routeAnimRef = useRef(0);
  function drawRoute(coordinates: [number, number][], fit = true) {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("event-route") as import("maplibre-gl").GeoJSONSource | undefined;
    cancelAnimationFrame(routeAnimRef.current);
    if (coordinates.length < 2) {
      source?.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const path: [number, number][] = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      const seg = arcPoints(coordinates[i], coordinates[i + 1]);
      path.push(...(i ? seg.slice(1) : seg));
    }
    const duration = 1600 + 500 * (coordinates.length - 2);
    // Camera starts at origin, then glides along to the destination with the line
    map.easeTo({ center: coordinates[0], zoom: Math.min(map.getZoom(), 3.4), duration: 700, essential: true });
    const start = performance.now() + 500;
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      const n = Math.max(2, Math.ceil(e * path.length));
      source?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: path.slice(0, n) } });
      if (t > 0 && t < 1 && fit) map.jumpTo({ center: path[n - 1] });
      if (t < 1) routeAnimRef.current = requestAnimationFrame(step);
      else if (fit) map.fitBounds([path.reduce((a, c) => [Math.min(a[0], c[0]), Math.min(a[1], c[1])] as [number, number]), path.reduce((a, c) => [Math.max(a[0], c[0]), Math.max(a[1], c[1])] as [number, number])], { padding: 140, duration: 1100, maxZoom: 6 });
    };
    routeAnimRef.current = requestAnimationFrame(step);
  }

  function showDirections(event: EventItem) {
    setTour([]);
    const go = (origin: [number, number]) => drawRoute([origin, event.coordinates]);
    if (!navigator.geolocation) return go([3.3792, 6.5244]);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => go([coords.longitude, coords.latitude]),
      () => { toast("Routing from Lagos", { description: "Allow location access to route from where you are." }); go([3.3792, 6.5244]); },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }

  tourActionRef.current = (event, shift) => {
    setTour((current) => {
      if (current.some((stop) => stop.id === event.id)) return current;
      const next = shift && current.length ? [...current, event] : [event];
      if (next.length === 1) toast("Pinned to your yard-tour", { description: "Shift + hold another pin to add the next stop." });
      else toast.success(`Stop ${next.length} added`, { description: event.title });
      return next;
    });
  };

  useEffect(() => {
    markerRefs.current.forEach((node, id) => {
      const index = tour.findIndex((stop) => stop.id === id);
      node.classList.toggle("in-tour", index >= 0);
      node.dataset["stop"] = index >= 0 ? String(index + 1) : "";
    });
    if (tour.length) drawRoute(tour.map((stop) => stop.coordinates), tour.length > 1);
    else if (mapRef.current?.getSource("event-route")) drawRoute([], false);
  }, [tour]);

  useEffect(() => {
    markerRefs.current.forEach((node, id) => {
      const item = events.find((e) => e.id === id);
      node.style.display = item && filtered.some((f) => f.id === id) ? "" : "none";
    });
  });

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

      <header className="absolute left-4 right-4 top-4 z-40 flex h-14 items-center justify-between rounded-[1.25rem] border border-border bg-card/90 px-5 backdrop-blur-xl md:left-6 md:right-6 md:px-4">
        <div className="flex items-center">
          <div><p className="font-display text-2xl font-black tracking-tight leading-none">Backyard</p></div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm"><CalendarBlank className="size-4" weight="duotone" /> This month</Button>
          <Button onClick={toggleAlerts} variant={alerts ? "default" : "outline"} size="sm" aria-pressed={alerts}><BellRinging className={`size-4 ${alerts ? "notification-bell" : ""}`} weight={alerts ? "fill" : "duotone"} /> {alerts ? "Alerts on" : "Notify me"}</Button>
        </div>
      </header>

      <section className={`absolute left-4 right-4 top-[5.2rem] z-30 transition-[left] duration-300 md:right-6 ${sidebarCollapsed ? "md:left-[6.5rem]" : "md:left-[23rem]"}`}>
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-border bg-card/90 px-4 backdrop-blur-xl">
          <MagnifyingGlass className="size-5 shrink-0 text-muted-foreground" weight="bold" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${kind.toLowerCase()}, cities or regions`} className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          {query && <Button aria-label="Clear search" variant="ghost" size="icon" className="size-8" onClick={() => setQuery("")}><X className="size-4" /></Button>}
          <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon-sm" onClick={locateUser} aria-label="Near me"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256" className="size-4" aria-hidden="true"><path d="M104,40a24,24,0,1,1,24,24A24,24,0,0,1,104,40Zm108.49,99.51L167.17,88.13a24,24,0,0,0-18-8.13H106.83a24,24,0,0,0-18,8.13L43.51,139.51a12,12,0,0,0,17,17L96,128,73.13,214.93a12,12,0,0,0,21.75,10.14L128,168l33.12,57.07a12,12,0,0,0,21.75-10.14L160,128l35.51,28.49a12,12,0,0,0,17-17Z" opacity="0.2"></path><path d="M160,40a32,32,0,1,0-32,32A32,32,0,0,0,160,40ZM128,56a16,16,0,1,1,16-16A16,16,0,0,1,128,56Zm90.34,78.05L173.17,82.83a32,32,0,0,0-24-10.83H106.83a32,32,0,0,0-24,10.83L37.66,134.05a20,20,0,0,0,28.13,28.43l16.3-13.08L65.55,212.28A20,20,0,0,0,102,228.8l26-44.87,26,44.87a20,20,0,0,0,36.41-16.52L173.91,149.4l16.3,13.08a20,20,0,0,0,28.13-28.43Zm-11.51,16.77a4,4,0,0,1-5.66,0c-.21-.2-.42-.4-.65-.58L165,121.76A8,8,0,0,0,152.26,130L175.14,217a7.72,7.72,0,0,0,.48,1.35,4,4,0,1,1-7.25,3.38,6.25,6.25,0,0,0-.33-.63L134.92,164a8,8,0,0,0-13.84,0L88,221.05a6.25,6.25,0,0,0-.33.63,4,4,0,0,1-2.26,2.07,4,4,0,0,1-5-5.45,7.72,7.72,0,0,0,.48-1.35L103.74,130A8,8,0,0,0,91,121.76L55.48,150.24c-.23.18-.44.38-.65.58a4,4,0,1,1-5.66-5.65c.12-.12.23-.24.34-.37L94.83,93.41a16,16,0,0,1,12-5.41h42.34a16,16,0,0,1,12,5.41l45.32,51.39c.11.13.22.25.34.37A4,4,0,0,1,206.83,150.82Z"></path></svg></Button></TooltipTrigger><TooltipContent>Near me</TooltipContent></Tooltip></TooltipProvider>
        </div>
        <div className="mx-auto mt-2 flex max-w-3xl gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {(kind === "Events" ? eventCategories : jobCategories).map((item) => <Button key={item} size="sm" variant={category === item ? "default" : "secondary"} onClick={() => setCategory(item)} className="h-8 shrink-0 backdrop-blur-xl" aria-pressed={category === item}>{item}</Button>)}
        </div>
      </section>

      <aside className={`absolute bottom-4 left-4 top-[5.2rem] z-30 w-[calc(100%-2rem)] flex-col overflow-hidden rounded-[28px] border border-border bg-card/95 backdrop-blur-xl transition-[width] duration-300 md:left-6 md:flex ${sidebarCollapsed ? "md:w-14" : "md:w-80"} ${showBrowse ? "flex" : "hidden"}`}>
        <div className={`border-b border-border ${sidebarCollapsed ? "hidden md:flex md:flex-col md:items-center md:gap-2 md:p-2" : "px-4 py-4"}`}>
          {sidebarCollapsed ? <><TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" onClick={() => setSidebarCollapsed(false)} aria-label="Expand discovery panel"><SidebarSimple className="size-4" weight="duotone" /></Button></TooltipTrigger><TooltipContent side="right">Expand panel</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant={kind === "Events" ? "secondary" : "ghost"} size="icon-sm" onClick={() => { setKind("Events"); setCategory("All"); }} aria-label="Events"><Confetti className="size-4" weight="duotone" /></Button></TooltipTrigger><TooltipContent side="right">Events</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant={kind === "Jobs" ? "secondary" : "ghost"} size="icon-sm" onClick={() => { setKind("Jobs"); setCategory("All"); }} aria-label="Jobs"><Briefcase className="size-4" weight="duotone" /></Button></TooltipTrigger><TooltipContent side="right">Jobs</TooltipContent></Tooltip></TooltipProvider></> : <><div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-muted p-1"><Button variant={kind === "Events" ? "secondary" : "ghost"} size="sm" className={kind === "Events" ? "border-0 bg-secondary text-foreground" : "border-0 bg-transparent"} onClick={() => { setKind("Events"); setCategory("All"); setSelected(initialEvent); }}><Confetti className="size-4" weight="duotone" />Events</Button><Button variant={kind === "Jobs" ? "secondary" : "ghost"} size="sm" className={kind === "Jobs" ? "border-0 bg-secondary text-foreground" : "border-0 bg-transparent"} onClick={() => { const firstJob = events.find((item) => item.kind === "Jobs"); setKind("Jobs"); setCategory("All"); if (firstJob) setSelected(firstJob); }}><Briefcase className="size-4" weight="duotone" />Jobs</Button></div><div className="flex items-center justify-between"><div><p className="font-display text-2xl font-black tracking-tight">In your backyard</p><p className="mt-1 text-xs text-muted-foreground">{filtered.length} {kind.toLowerCase()} to explore</p></div><Button className="md:hidden" aria-label="Close discovery" variant="ghost" size="icon" onClick={() => setShowBrowse(false)}><X className="size-4" /></Button><Button className="hidden md:inline-flex" aria-label="Collapse discovery panel" variant="ghost" size="icon-sm" onClick={() => setSidebarCollapsed(true)}><SidebarSimple className="size-4" weight="duotone" /></Button></div></>}
        </div>
        <div className={`paper-scroll flex-1 overflow-y-auto p-2 ${sidebarCollapsed ? "hidden" : "block"}`}>
          {filtered.map((event) => (
            <Button variant="ghost" key={event.id} onClick={() => { focusEvent(event); setShowBrowse(false); }} className={`mb-2 block h-auto w-full whitespace-normal rounded-2xl border p-4 text-left transition-colors ${selected.id === event.id ? "border-primary bg-accent" : "border-transparent hover:bg-secondary"}`} aria-pressed={selected.id === event.id}>
               <div className="flex items-start justify-between gap-3"><span className="text-[10px] font-semibold uppercase text-accent-foreground">{event.category}</span><span className="text-[10px] text-muted-foreground">{event.attendees}</span></div>
               <p className="mt-1 font-display text-base font-semibold leading-tight">{event.title}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" weight="duotone" />{event.place}</p><p className="mt-2 text-xs font-semibold">{event.date}</p>
            </Button>
          ))}
        </div>
      </aside>

      {showPanel && (
         <section className="absolute bottom-4 left-4 right-4 z-30 rounded-[28px] border border-border bg-card p-5 backdrop-blur-xl md:bottom-6 md:left-auto md:right-8 md:w-[25rem]">
           <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase text-accent-foreground">{selected.kind === "Jobs" ? "Opportunity" : "Trending"} in {selected.place.split(",").at(-1)}</p><h1 className="mt-1 font-display text-2xl font-black tracking-tight leading-tight">{selected.title}</h1></div><Button aria-label="Close details" variant="ghost" size="icon" onClick={() => setShowPanel(false)}><X className="size-4" /></Button></div>
           <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarBlank className="size-4 text-primary" weight="duotone" />{selected.date}</span><span className="flex items-center gap-1"><MapPin className="size-4 text-primary" weight="fill" />{selected.place}</span></div>
              <div className="mt-4 flex gap-2"><Button className="flex-1" onClick={() => showDirections(selected)}><NavigationArrow className="size-4" weight="fill" /> Show route <ArrowRight className="size-4" /></Button><Button variant="secondary" onClick={followSelected}>{selected.kind === "Jobs" ? <Briefcase className="size-4" weight="duotone" /> : <BellRinging className={`size-4 ${alerts ? "notification-bell" : ""}`} weight={alerts ? "fill" : "duotone"} />} {selected.kind === "Jobs" ? "Save" : alerts ? "Following" : "Follow"}</Button></div>
        </section>
      )}

      <div className="absolute right-6 top-[13rem] z-20 hidden flex-col gap-2 md:flex"><TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="secondary" size="icon" onClick={toggleProjection} aria-label={isGlobe ? "Use flat map" : "Use globe"}>{isGlobe ? <MapTrifold className="size-4" weight="duotone" /> : <GlobeHemisphereWest className="size-4" weight="duotone" />}</Button></TooltipTrigger><TooltipContent side="left">{isGlobe ? "Flat map" : "Globe view"}</TooltipContent></Tooltip></TooltipProvider><Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus className="size-4" weight="bold" /></Button><Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus className="size-4" weight="bold" /></Button></div>
      <Button className="absolute right-4 top-[9.8rem] z-30 bg-background/90 backdrop-blur-xl md:hidden" variant="secondary" size="sm" onClick={() => setShowBrowse(true)}><List className="size-4" weight="duotone" />Explore <CaretRight className="size-4" weight="bold" /></Button>
      {tour.length > 0 && (
        <section className="absolute left-1/2 top-[10.5rem] z-30 w-[min(92vw,34rem)] -translate-x-1/2 rounded-[28px] border border-border bg-card/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-base font-black tracking-tight">Yard-tour · {tour.length} {tour.length === 1 ? "stop" : "stops"}</p>
            <Button variant="ghost" size="sm" onClick={() => setTour([])}><X className="size-4" /> Clear</Button>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {tour.map((stop, index) => <span key={stop.id} className="flex shrink-0 items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"><span className="grid size-5 place-items-center rounded-full bg-plum text-[10px] text-primary">{index + 1}</span>{stop.title}</span>)}
          </div>
          {tour.length === 1 && <p className="mt-2 text-xs text-muted-foreground">Hold Shift and press-and-hold another pin to add the next stop.</p>}
        </section>
      )}
      <LocationAssistant />
    </main>
  );
}

// Duotone lilac/white recolor of the Positron basemap.
function tintBasemap(map: { getStyle: () => { layers?: { id: string; type: string }[] }; setPaintProperty: (id: string, prop: string, value: unknown) => void }) {
  const layers = map.getStyle().layers ?? [];
  const set = (id: string, prop: string, value: unknown) => { try { map.setPaintProperty(id, prop, value); } catch { /* ignore */ } };
  for (const layer of layers) {
    const id = layer.id.toLowerCase();
    if (id.startsWith("event-route")) continue;
    if (layer.type === "background") set(layer.id, "background-color", "#fbf8ff");
    else if (layer.type === "fill") {
      if (id.includes("water")) set(layer.id, "fill-color", "#dccbfb");
      else if (id.includes("park") || id.includes("landcover") || id.includes("wood") || id.includes("grass")) set(layer.id, "fill-color", "#f3ecfd");
      else if (id.includes("building")) set(layer.id, "fill-color", "#eee6fb");
      else set(layer.id, "fill-color", "#fbf8ff");
    } else if (layer.type === "line") {
      if (id.includes("water") || id.includes("river")) set(layer.id, "line-color", "#cdb6f7");
      else if (id.includes("boundary") || id.includes("admin")) set(layer.id, "line-color", "#b79ae8");
      else set(layer.id, "line-color", "#ece2fb");
    } else if (layer.type === "symbol") {
      set(layer.id, "text-color", id.includes("water") ? "#7c4ddb" : "#4a2d72");
      set(layer.id, "text-halo-color", "#ffffff");
    }
  }
}
