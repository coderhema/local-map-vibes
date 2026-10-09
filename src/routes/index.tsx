import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  AirplaneTilt,
  ArrowsClockwise,
  BellRinging,
  Car,
  PersonSimpleWalk,
  Train,
  CalendarBlank,
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
  House,
  Laptop,
  Buildings,
  ArrowsLeftRight,
  Timer,
  CalendarPlus,
  Crosshair,
  HandPointing,
} from "@phosphor-icons/react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapDirections } from "@/components/map-directions";
import { LocationAssistant } from "@/components/location-assistant";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { pinFilledMarkup } from "@/lib/pin-icons";
import { MAP_VIEWS } from "@/lib/map-discovery";
import { installRouteTrails, setRouteTrail, setRouteEnds, routePath, routeDistanceKm, ROUTE_LABELS, type RouteMode } from "@/lib/route-trails";
import { collectListings, getListings, refreshListings, type Listing } from "@/lib/listings.functions";

const WorldAtmosphere = lazy(() => import("@/components/world-atmosphere"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Backyrd — Events and jobs around you" },
      { name: "description", content: "Discover events and job opportunities in your city, region, and around the world." },
      { property: "og:title", content: "Backyrd — Events and jobs around you" },
      { property: "og:description", content: "Find what is happening and where your next opportunity is." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://tiles.openfreemap.org", crossOrigin: "anonymous" },
      { rel: "preload", href: "https://tiles.openfreemap.org/styles/positron", as: "fetch", crossOrigin: "anonymous" },
      { rel: "modulepreload", href: "/maplibre/maplibre-gl-worker.mjs" },
      { rel: "modulepreload", href: "/maplibre/maplibre-gl-shared.mjs" },
    ],
  }),
  loader: () => getListings(),
  component: Index,
});

type EventItem = Listing;
type Mode = RouteMode;
const LAGOS: [number, number] = [3.3792, 6.5244];
const MODES: { id: Mode; label: string; kmh: number; overheadH: number }[] = [
  { id: "flight", label: "Fly", kmh: 820, overheadH: 2.5 },
  { id: "transit", label: "Transit", kmh: 75, overheadH: 0.3 },
  { id: "drive", label: "Drive", kmh: 65, overheadH: 0 },
  { id: "walk", label: "Walk", kmh: 4.8, overheadH: 0 },
];
function distanceKm(a: [number, number], b: [number, number]) {
  const r = Math.PI / 180;
  const h = Math.sin(((b[1] - a[1]) * r) / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(((b[0] - a[0]) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
function formatDuration(hours: number) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
  return `${Math.round(hours / 24)} days`;
}

const eventCategories = ["All", "Music", "Culture", "Technology", "Food", "Sports"];
const jobCategories = ["All", "Design", "Technology", "Community"];

/* Jewel-tone accent per category — pins, chips and labels each get their own color */
const CATEGORY_COLORS: Record<string, string> = {
  Music: "#d946ef", /* amethyst fuchsia */
  Culture: "#f59e0b", /* citrine amber */
  Technology: "#6366f1", /* sapphire indigo */
  Food: "#f97316", /* tangerine */
  Sports: "#10b981", /* emerald */
  Design: "#ec4899", /* rose */
  Community: "#06b6d4", /* topaz cyan */
};
const categoryColor = (c: string) => CATEGORY_COLORS[c] ?? "#2a1546";

function pinIconSvg(category: string) {
  const markup = pinFilledMarkup[category] ?? pinFilledMarkup["Briefcase"] ?? "";
  return `<svg class="pin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${markup}</svg>`;
}

/* Great-circle interpolation so routes curve naturally over the globe */
function LiveCountdown({ target }: { target: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  if (target && now === null) return <span className="breathe-shimmer">Checking date…</span>;
  return <>{countdown(target, now) ?? "—"}</>;
}

function countdown(target: string | null, now: number | null) {
  if (!target || now === null) return null;
  const ms = Date.parse(target) - now;
  if (ms <= 0) return "Happening now";
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), sec = Math.floor((ms % 6e4) / 1000);
  return d ? `${d}d ${h}h ${m}m ${sec}s` : `${h}h ${m}m ${sec}s`;
}
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
function downloadIcs(item: Listing) {
  if (!item.startsAt) return;
  const start = new Date(item.startsAt);
  const end = new Date(start.getTime() + 2 * 36e5);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (t: string) => t.replace(/[,;\\]/g, (c) => `\\${c}`);
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Backyrd//EN", "BEGIN:VEVENT", `UID:${item.id}@backyard`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `SUMMARY:${esc(item.kind === "Jobs" ? `Apply: ${item.title}` : item.title)}`, `LOCATION:${esc(item.place)}`, item.sourceUrl ? `URL:${item.sourceUrl}` : "", "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `${item.title.slice(0, 40).replace(/[^\w]+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}
const WORK_MODES = [
  { id: "Remote", Icon: Laptop },
  { id: "Hybrid", Icon: ArrowsLeftRight },
  { id: "In-person", Icon: Buildings },
] as const;

function Index() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const events = Route.useLoaderData();
  const initialEvent = events.find((e) => e.kind === "Events") ?? events[0];
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());
  const [mapReady, setMapReady] = useState(false);
  const [mode, setMode] = useState<Mode>("flight");
  const [origin, setOrigin] = useState<[number, number]>(LAGOS);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState("All");
  const [kind, setKind] = useState<"Events" | "Jobs">("Events");
  const [selected, setSelected] = useState<EventItem | undefined>(initialEvent);
  const [query, setQuery] = useState("");
  const [alerts, setAlerts] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [showBrowse, setShowBrowse] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isGlobe, setIsGlobe] = useState(true);
  const [tour, setTour] = useState<EventItem[]>([]);
  const tourActionRef = useRef<(event: EventItem, shift: boolean) => void>(() => {});
  const [home, setHome] = useState<{ coords: [number, number]; label: string } | null>(null);
  const [locOpen, setLocOpen] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeResults, setPlaceResults] = useState<{ label: string; coords: [number, number] }[]>([]);
  const pickingHomeRef = useRef(false);
  const [pickingHome, setPickingHome] = useState(false);
  const homeMarkerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const [day, setDay] = useState<Date | undefined>();
  const [calOpen, setCalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [focus, setFocus] = useState<"city" | "region" | "world">("world");
  const selectDistant = useCallback((item: EventItem) => { setSelected(item); setShowPanel(true); mapRef.current?.flyTo({ center: item.coordinates, zoom: 11, pitch: 45, duration: 1800, essential: true }); }, []);
  useEffect(() => {
    let dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    try { const saved = localStorage.getItem("backyrd-theme"); if (saved) dark = saved === "dark"; } catch { /* Storage may be unavailable. */ }
    document.documentElement.classList.toggle("dark", dark);
    setDarkMode(dark);
  }, []);
  function toggleTheme() {
    const dark = !darkMode;
    const apply = () => {
      document.documentElement.classList.toggle("dark", dark);
      setDarkMode(dark);
      try { localStorage.setItem("backyrd-theme", dark ? "dark" : "light"); } catch { /* Keep the switch usable without storage. */ }
      const map = mapRef.current;
      if (map?.isStyleLoaded()) tintBasemap(map as unknown as Parameters<typeof tintBasemap>[0]);
    };
    const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
    if (typeof doc.startViewTransition === "function") doc.startViewTransition(apply);
    else apply();
  }
  useEffect(() => {
    try { const saved = localStorage.getItem("backyard-home"); if (saved) { const h = JSON.parse(saved); setHome(h); setOrigin(h.coords); } } catch { /* ignore */ }
  }, []);

  const filtered = events.filter((event) => {
    const inCategory = category === "All" || event.category === category;
    const matches = `${event.title} ${event.place}`.toLowerCase().includes(query.toLowerCase());
    const onDay = !day || (event.startsAt !== null && sameDay(new Date(event.startsAt), day));
    return event.kind === kind && inCategory && matches && onDay;
  });

  useEffect(() => {
    let disposed = false;
    async function mountMap() {
      if (!mapContainer.current || mapRef.current) return;
      // Load the map library and the basemap style at the same time instead of one after the other.
      const stylePromise = fetch("https://tiles.openfreemap.org/styles/positron")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      const [maplibregl, styleJson] = await Promise.all([import("maplibre-gl"), stylePromise]);
      if (disposed || !mapContainer.current) return;
      maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: styleJson ?? "https://tiles.openfreemap.org/styles/positron",
        center: [10, 8],
        zoom: 2.65,
        pitch: 45,
        maxPitch: 65,
        minZoom: 0.8,
        maxZoom: 19,
        attributionControl: false,
        renderWorldCopies: false,
        // High-density phone screens render 8x the pixels at full ratio; cap it for faster paints.
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        fadeDuration: 0,
      });
      mapRef.current = map;
      map.on("style.load", () => {
        map.setProjection({ type: "globe" });
        map.setPitch(45);
        map.setPadding({ top: 210, right: 0, bottom: 0, left: 0 });
        tintBasemap(map as unknown as Parameters<typeof tintBasemap>[0]);
        installRouteTrails(map);
        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 16, className: "route-distance-popup" });
        map.on("mousemove", "event-route-hit", (e) => {
          const info = routeInfoRef.current;
          if (!info) return;
          map.getCanvas().style.cursor = "pointer";
          popup.setLngLat(e.lngLat).setText(`${ROUTE_LABELS[info.mode]} · ≈ ${info.km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`).addTo(map);
        });
        const hideDistance = () => { popup.remove(); map.getCanvas().style.cursor = ""; };
        map.on("mouseleave", "event-route-hit", hideDistance);
        map.on("movestart", hideDistance);
        map.on("click", "event-route-hit", (e) => {
          const info = routeInfoRef.current;
          if (info) popup.setLngLat(e.lngLat).setText(`${ROUTE_LABELS[info.mode]} · ≈ ${info.km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`).addTo(map);
        });
        map.once("remove", () => popup.remove());
      });
      map.on("click", (e) => {
        if (!pickingHomeRef.current) return;
        pickingHomeRef.current = false;
        setPickingHome(false);
        saveHomeRef.current([e.lngLat.lng, e.lngLat.lat], "Pinned on map");
      });
      setMapReady(true);
      const observer = new ResizeObserver(() => map.resize());
      map.once("remove", () => observer.disconnect());
      observer.observe(mapContainer.current);
      map.once("load", () => map.resize());
    }
    void mountMap();
    return () => {
      disposed = true;
      cancelAnimationFrame(routeAnimRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
      markerRefs.current.clear();
      pinsRef.current.clear();
    };
  }, []);

  const selectedRef = useRef(initialEvent?.id);
  const pinsRef = useRef(new Map<string, { marker: import("maplibre-gl").Marker; event: EventItem; key: string }>());
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    let cancelled = false;
    void import("maplibre-gl").then((maplibregl) => {
      if (cancelled) return;
      const pins = pinsRef.current;
      const seen = new Set<string>();
      events.forEach((event) => {
        seen.add(event.id);
        const key = `${event.title}|${event.category}|${event.kind}`;
        const existing = pins.get(event.id);
        if (existing && existing.key === key) {
          existing.event = event;
          existing.marker.setLngLat(event.coordinates);
          return;
        }
        existing?.marker.remove();
        const node = document.createElement("button");
        node.className = `event-marker${event.id === selectedRef.current ? " active" : ""}`;
        node.setAttribute("aria-label", `Open ${event.title}`);
        node.style.setProperty("--pin-accent", categoryColor(event.category));
        node.innerHTML = `<span class="pin-pulse"></span><span class="pin-shape">${pinIconSvg(event.kind === "Jobs" ? "Briefcase" : event.category)}</span><span class="pin-shadow"></span><span class="pin-label">${event.title}</span>`;
        const current = () => pins.get(event.id)?.event ?? event;
        let pressTimer = 0;
        let longPressed = false;
        const startPress = (e: PointerEvent) => {
          longPressed = false;
          const shift = e.shiftKey;
          pressTimer = window.setTimeout(() => { longPressed = true; tourActionRef.current(current(), shift); }, 450);
        };
        const cancelPress = () => window.clearTimeout(pressTimer);
        node.addEventListener("pointerdown", startPress);
        node.addEventListener("pointerup", cancelPress);
        node.addEventListener("pointerleave", cancelPress);
        node.addEventListener("pointercancel", cancelPress);
        node.addEventListener("contextmenu", (e) => e.preventDefault());
        node.addEventListener("click", (e) => {
          if (longPressed) { longPressed = false; return; }
          const ev = current();
          if (e.shiftKey) { tourActionRef.current(ev, true); return; }
          setSelected(ev);
          setShowPanel(true);
          markerRefs.current.forEach((marker) => marker.classList.remove("active"));
          node.classList.add("active");
          map.easeTo({ center: ev.coordinates, zoom: Math.max(map.getZoom(), 4.5), duration: 950, essential: true });
        });
        markerRefs.current.set(event.id, node);
        pins.set(event.id, { marker: new maplibregl.Marker({ element: node, anchor: "bottom", subpixelPositioning: true }).setLngLat(event.coordinates).addTo(map), event, key });
      });
      pins.forEach((pin, id) => { if (!seen.has(id)) { pin.marker.remove(); pins.delete(id); markerRefs.current.delete(id); } });
      setFilterTick((t) => t + 1);
    });
    return () => { cancelled = true; };
  }, [mapReady, events]);
  const [, setFilterTick] = useState(0);

  // Save any background scrapes that finished since the last visit.
  useEffect(() => {
    void collectListings().then((c) => { if (c.added) void router.invalidate(); }).catch(() => {});
  }, []);

  async function refreshFromWeb() {
    setRefreshing(true);
    const id = toast.loading("Finding real events and jobs…", { description: "This takes a few minutes — keep browsing." });
    try {
      const res = await refreshListings();
      if (res.skipped) toast("Checking latest results", { id, description: "A refresh ran in the last few hours." });
      let total = 0;
      for (let i = 0; i < 40; i++) {
        const c = await collectListings();
        if (c.added) { total += c.added; await router.invalidate(); }
        if (!c.pending) break;
        await new Promise((r) => setTimeout(r, 15000));
      }
      toast.success(total ? `${total} real listings added` : "Listings are up to date", { id });
    } catch (e) {
      toast.error("Couldn't refresh listings", { id, description: e instanceof Error ? e.message : undefined });
    } finally { setRefreshing(false); }
  }

  const saveHomeRef = useRef<(coords: [number, number], label: string) => void>(() => {});
  saveHomeRef.current = (coords, label) => {
    const h = { coords, label };
    setHome(h);
    setOrigin(coords);
    localStorage.setItem("backyard-home", JSON.stringify(h));
    setLocOpen(false);
    setFocus("city");
    mapRef.current?.flyTo({ center: coords, ...MAP_VIEWS.city, duration: 1600, essential: true });
    toast.success("Your location is set", { description: label });
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    homeMarkerRef.current?.remove();
    homeMarkerRef.current = null;
    if (!home) return;
    let cancelled = false;
    void import("maplibre-gl").then((maplibregl) => {
      if (cancelled) return;
      const node = document.createElement("div");
      node.className = "event-marker home-marker";
      node.setAttribute("aria-label", "Your location");
      node.innerHTML = `<span class="pin-pulse"></span><span class="pin-shape">${pinIconSvg("House")}</span><span class="pin-shadow"></span><span class="pin-label">You · ${home.label.replace(/</g, "")}</span>`;
      homeMarkerRef.current = new maplibregl.Marker({ element: node, anchor: "bottom", subpixelPositioning: true }).setLngLat(home.coords).addTo(map);
    });
    return () => { cancelled = true; };
  }, [mapReady, home]);

  useEffect(() => {
    const q = placeQuery.trim();
    if (q.length < 2) { setPlaceResults([]); setPlaceSearching(false); return; }
    setPlaceSearching(true);
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&layer=city&layer=state&layer=country&layer=district`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { features: { geometry: { coordinates: [number, number] }; properties: { name?: string; state?: string; country?: string } }[] }) =>
          setPlaceResults(d.features.map((f) => ({ coords: f.geometry.coordinates, label: [f.properties.name, f.properties.state, f.properties.country].filter((v, i, a) => v && a.indexOf(v) === i).join(", ") }))))
        .catch(() => {})
        .finally(() => { if (!ctrl.signal.aborted) setPlaceSearching(false); });
    }, 300);
    return () => { ctrl.abort(); window.clearTimeout(t); };
  }, [placeQuery]);

  function useGps() {
    if (!navigator.geolocation) { toast.error("Location is unavailable in this browser"); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => saveHomeRef.current([coords.longitude, coords.latitude], "Current location"),
      () => toast.error("Couldn't get your location", { description: "Search for your city or pick a spot on the map instead." }),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function startPickOnMap() {
    pickingHomeRef.current = true;
    setPickingHome(true);
    setLocOpen(false);
    toast("Tap the map to set your location");
  }

  function focusEvent(event: EventItem) {
    setSelected(event);
    setShowPanel(true);
    markerRefs.current.forEach((marker, id) => marker.classList.toggle("active", id === event.id));
    mapRef.current?.flyTo({ center: event.coordinates, zoom: 11, pitch: 45, duration: 1400, essential: true });
  }

  function focusArea(next: "city" | "region" | "world") {
    setFocus(next);
    mapRef.current?.flyTo({ center: home?.coords ?? origin, ...MAP_VIEWS[next], padding: { top: next === "world" ? 210 : 170, bottom: 0, left: 0, right: 0 }, duration: 1600, essential: true });
  }

  function locateUser() {
    if (home) { focusArea("city"); return; }
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
      pitch: 45,
      padding: { top: nextIsGlobe ? 210 : 0, right: 0, bottom: 0, left: 0 },
      duration: 1400,
      essential: true,
    });
  }

  const routeAnimRef = useRef(0);
  const routeInfoRef = useRef<{ mode: Mode; km: number } | null>(null);
  function drawRoute(coordinates: [number, number][], fit = true, speedMs = 2200, arrive = false, routeMode = mode) {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("event-route") as import("maplibre-gl").GeoJSONSource | undefined;
    cancelAnimationFrame(routeAnimRef.current);
    if (coordinates.length < 2) {
      routeInfoRef.current = null;
      source?.setData({ type: "FeatureCollection", features: [] });
      setRouteEnds(map, []);
      return;
    }
    setRouteTrail(map, routeMode);
    setRouteEnds(map, coordinates);
    routeInfoRef.current = { mode: routeMode, km: routeDistanceKm(coordinates) };
    const path: [number, number][] = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      const a = coordinates[i], b = coordinates[i + 1];
      if (!a || !b) continue;
      const seg = routePath(a, b, routeMode);
      path.push(...(i ? seg.slice(1) : seg));
    }
    const duration = speedMs + 500 * (coordinates.length - 2);
    const lngs = path.map((p) => p[0]), lats = path.map((p) => p[1]);
    if (fit) map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: { top: 260, bottom: 300, left: 120, right: 120 }, duration, maxZoom: 6, essential: true, easing: (t) => 1 - (1 - t) ** 3 });
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const exact = e * (path.length - 1);
      const i = Math.floor(exact);
      const f = exact - i;
      const a = path[i], b = path[Math.min(i + 1, path.length - 1)];
      if (!a || !b) return;
      const coords = [...path.slice(0, i + 1), [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f] as [number, number]];
      source?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
      if (t < 1) routeAnimRef.current = requestAnimationFrame(step);
      else if (arrive) {
        // Phase 2: swoop down into the destination, framed above the details card.
        const wide = window.innerWidth >= 768;
        const destination = coordinates.at(-1);
        if (destination) map.flyTo({ center: destination, zoom: 7.5, pitch: 0, curve: 1.6, speed: 0.9, padding: { top: 140, bottom: wide ? 80 : 340, left: wide ? 340 : 0, right: wide ? 440 : 0 }, essential: true, easing: (x) => 1 - (1 - x) ** 3 });
      }
    };
    routeAnimRef.current = requestAnimationFrame(step);
  }

  const router = useRouter();
  const routeShownRef = useRef<string | null>(null);
  function travelMs(m: Mode) { return { flight: 2600, transit: 2200, drive: 2000, walk: 1800 }[m]; }
  function pickMode(m: Mode) {
    setMode(m);
    const map = mapRef.current;
    if (map) setRouteTrail(map, m);
    if (tour.length > 1) drawRoute(tour.map((stop) => stop.coordinates), false, travelMs(m), false, m);
    else if (selected && routeShownRef.current === selected.id) drawRoute([origin, selected.coordinates], true, travelMs(m), true, m);
  }

  function showDirections(event: EventItem) {
    setTour((t) => (t.length ? [] : t));
    routeShownRef.current = event.id;
    const go = (from: [number, number]) => { setOrigin(from); drawRoute([from, event.coordinates], true, travelMs(mode), true); };
    if (home) return go(home.coords);
    if (!navigator.geolocation) return go(LAGOS);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => go([coords.longitude, coords.latitude]),
      () => { toast("Routing from Lagos", { description: "Set your location to route from where you are." }); go(LAGOS); },
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
      toast.success("Backyrd alerts are on", { description: "We’ll ping you about nearby events and jobs." });
      return;
    }
    toast("Backyrd alerts are off");
  }

  function followSelected() {
    if (!selected) return;
    setAlerts(true);
    playNotificationPing();
    toast.success(selected.kind === "Jobs" ? "Job saved" : "Event followed", {
      description: selected.kind === "Jobs" ? `We’ll ping you about ${selected.title}.` : `You’ll get updates for ${selected.title}.`,
    });
  }

  return (
    <main className="relative h-dvh min-h-[640px] overflow-hidden bg-background text-foreground">
      <div ref={mapContainer} className="map-shell absolute inset-0" aria-label="Interactive map showing events and jobs" />

      {mapReady && mapRef.current && <Suspense fallback={null}><WorldAtmosphere map={mapRef.current} dark={darkMode} /></Suspense>}
      <MapDirections map={mapReady ? mapRef.current : null} listings={filtered} onSelect={selectDistant} collapsed={sidebarCollapsed} />

      <header className="absolute left-4 right-4 top-4 z-40 flex h-14 items-center justify-between rounded-[1.25rem] border border-border bg-card/90 px-4 backdrop-blur-xl md:left-6 md:right-6 md:px-4">
        <div className="flex min-w-0 items-center">
          <div><p className="truncate font-display text-xl md:text-2xl font-black tracking-tight leading-none">Backyrd</p></div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 md:mr-2 md:gap-2">
          <Popover open={locOpen} onOpenChange={setLocOpen}>
            <PopoverTrigger asChild><Button variant="ghost" size="sm" aria-label="Set your location"><House className="size-4" weight="duotone" /><span className="hidden max-w-[9rem] truncate lg:inline">{home ? home.label : "Set location"}</span></Button></PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-3xl p-3">
              <p className="px-1 font-display text-base font-black tracking-tight">Where are you?</p>
              <p className="px-1 text-xs text-muted-foreground">Routes, distances and alerts start from here.</p>
              <input autoFocus value={placeQuery} onChange={(e) => setPlaceQuery(e.target.value)} placeholder="Search your city, state or country" className="mt-3 h-10 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
              {placeSearching && <p className="breathe-shimmer mt-3 px-3 text-sm">Finding places…</p>}
              {!placeSearching && placeResults.length > 0 && <div className="mt-2 max-h-48 overflow-y-auto">{placeResults.map((r) => <button key={`${r.label}${r.coords.join()}`} type="button" onClick={() => { saveHomeRef.current(r.coords, r.label); setPlaceQuery(""); }} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm hover:bg-secondary"><MapPin className="size-4 shrink-0 text-primary" weight="duotone" />{r.label}</button>)}</div>}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={useGps}><Crosshair className="size-4" weight="duotone" />Use GPS</Button>
                <Button variant="secondary" size="sm" onClick={startPickOnMap}><HandPointing className="size-4" weight="duotone" />Pick on map</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 md:gap-2">
          <Button variant="ghost" size="sm" onClick={refreshFromWeb} disabled={refreshing} aria-label="Refresh listings"><ArrowsClockwise className={`size-4 ${refreshing ? "animate-spin" : ""}`} weight="bold" /> <span className="hidden md:inline">{refreshing ? "Refreshing…" : "Refresh listings"}</span></Button>
          <Button onClick={toggleAlerts} variant={alerts ? "default" : "ghost"} size="sm" aria-pressed={alerts} aria-label={alerts ? "Alerts on" : "Notify me"}><BellRinging className={`size-4 ${alerts ? "notification-bell" : ""}`} weight={alerts ? "fill" : "duotone"} /> <span className="hidden md:inline">{alerts ? "Alerts on" : "Notify me"}</span></Button>
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
          <Button size="sm" variant="default" className="h-8 shrink-0 md:hidden" onClick={() => setShowBrowse(true)}><List className="size-4" weight="duotone" />Explore</Button>
          <Popover><PopoverTrigger asChild><Button size="sm" variant="secondary" className="h-8 shrink-0" aria-label="Map focus"><Crosshair className="size-4" weight="fill" />{focus === "city" ? "City" : focus === "region" ? "Region" : "World"}</Button></PopoverTrigger><PopoverContent className="w-44 p-1"><div className="flex flex-col">{(["city", "region", "world"] as const).map((view) => <Button key={view} variant={focus === view ? "secondary" : "ghost"} className="justify-start" aria-pressed={focus === view} onClick={() => focusArea(view)}>{view === "city" ? <Buildings weight="fill" /> : view === "region" ? <MapTrifold weight="fill" /> : <GlobeHemisphereWest weight="fill" />}{view === "city" ? "City" : view === "region" ? "Region" : "World"}</Button>)}</div></PopoverContent></Popover>
          {day && <Button size="sm" variant="default" onClick={() => setDay(undefined)} className="h-8 shrink-0"><CalendarBlank className="size-4" weight="fill" />{day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}<X className="size-3" /></Button>}
          {(kind === "Events" ? eventCategories : jobCategories).map((item) => <Button key={item} size="sm" variant={category === item ? "default" : "secondary"} style={category === item ? { backgroundColor: item === "All" ? "#2a1546" : categoryColor(item), color: "#fff" } : undefined} onClick={() => setCategory(item)} className="h-8 shrink-0 backdrop-blur-xl" aria-pressed={category === item}>{item}</Button>)}
        </div>
      </section>

      <aside className={`absolute bottom-4 left-4 top-[5.2rem] z-30 w-[calc(100%-2rem)] flex-col overflow-hidden rounded-[28px] border border-border bg-card/95 backdrop-blur-xl transition-[width] duration-300 md:left-6 md:flex ${sidebarCollapsed ? "md:w-14" : "md:w-80"} ${showBrowse ? "flex" : "hidden"}`}>
        <div className={`border-b border-border ${sidebarCollapsed ? "hidden md:flex md:flex-col md:items-center md:gap-2 md:p-2" : "px-4 py-4"}`}>
          {sidebarCollapsed ? <><TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" onClick={() => setSidebarCollapsed(false)} aria-label="Expand discovery panel"><SidebarSimple className="size-4" weight="duotone" /></Button></TooltipTrigger><TooltipContent side="right">Expand panel</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant={kind === "Events" ? "secondary" : "ghost"} size="icon-sm" onClick={() => { setKind("Events"); setCategory("All"); }} aria-label="Events"><Confetti className="size-4" weight="duotone" /></Button></TooltipTrigger><TooltipContent side="right">Events</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant={kind === "Jobs" ? "secondary" : "ghost"} size="icon-sm" onClick={() => { setKind("Jobs"); setCategory("All"); }} aria-label="Jobs"><Briefcase className="size-4" weight="duotone" /></Button></TooltipTrigger><TooltipContent side="right">Jobs</TooltipContent></Tooltip></TooltipProvider></> : <><div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-muted p-1"><Button variant={kind === "Events" ? "secondary" : "ghost"} size="sm" className={kind === "Events" ? "border-0 bg-secondary text-foreground" : "border-0 bg-transparent"} onClick={() => { setKind("Events"); setCategory("All"); setSelected(initialEvent); }}><Confetti className="size-4" weight="duotone" />Events</Button><Button variant={kind === "Jobs" ? "secondary" : "ghost"} size="sm" className={kind === "Jobs" ? "border-0 bg-secondary text-foreground" : "border-0 bg-transparent"} onClick={() => { const firstJob = events.find((item) => item.kind === "Jobs"); setKind("Jobs"); setCategory("All"); if (firstJob) setSelected(firstJob); }}><Briefcase className="size-4" weight="duotone" />Jobs</Button></div><div className="flex items-center justify-between"><div><p className="font-display text-2xl font-black tracking-tight">In your Backyrd</p><p className="mt-1 text-xs text-muted-foreground">{filtered.length} {kind.toLowerCase()} to explore</p></div><Button className="md:hidden" aria-label="Close discovery" variant="ghost" size="icon" onClick={() => setShowBrowse(false)}><X className="size-4" /></Button><Button className="hidden md:inline-flex" aria-label="Collapse discovery panel" variant="ghost" size="icon-sm" onClick={() => setSidebarCollapsed(true)}><SidebarSimple className="size-4" weight="duotone" /></Button></div></>}
        </div>
        <div className={`paper-scroll flex-1 overflow-y-auto p-2 ${sidebarCollapsed ? "hidden" : "block"}`}>
          {filtered.map((event) => (
            <Button variant="ghost" key={event.id} onClick={() => { focusEvent(event); setShowBrowse(false); }} className={`mb-2 block h-auto w-full whitespace-normal rounded-2xl border p-4 text-left transition-colors ${selected?.id === event.id ? "border-primary bg-accent" : "border-transparent hover:bg-secondary"}`} aria-pressed={selected?.id === event.id}>
               <div className="flex items-start justify-between gap-3"><span className="text-[10px] font-semibold uppercase" style={{ color: categoryColor(event.category) }}>{event.category}</span><span className="text-[10px] text-muted-foreground">{event.attendees}</span></div>
               <p className="mt-1 font-display text-base font-semibold leading-tight">{event.title}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" weight="duotone" />{event.place}</p><p className="mt-2 text-xs font-semibold">{event.date}</p>
            </Button>
          ))}
        </div>
      </aside>

      {showPanel && selected && (
         <section className="paper-scroll absolute bottom-3 left-3 right-3 z-40 max-h-[56dvh] overflow-y-auto rounded-[28px] border border-border bg-card p-4 backdrop-blur-xl md:bottom-6 md:max-h-none md:overflow-visible md:p-5 md:left-auto md:right-8 md:w-[25rem]">
           <div className="flex items-start justify-between gap-2 md:gap-3"><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase" style={{ color: categoryColor(selected.category) }}>{selected.kind === "Jobs" ? "Opportunity" : "Trending"} in {selected.place.split(",").at(-1)}</p><h1 className="mt-1 line-clamp-2 font-display text-xl font-black md:line-clamp-none md:text-2xl tracking-tight leading-tight">{selected.title}</h1></div><Button aria-label="Close details" variant="ghost" size="icon" className="shrink-0" onClick={() => setShowPanel(false)}><X className="size-4" /></Button></div>
           <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarBlank className="size-4 text-primary" weight="duotone" />{selected.date}</span><span className="flex items-center gap-1"><MapPin className="size-4 text-primary" weight="fill" />{selected.place}</span></div>
           {selected.kind === "Jobs" && (
             <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-muted p-1" aria-label="Work arrangement">
               {WORK_MODES.map(({ id, Icon }) => { const on = selected.workMode === id; return (
                 <span key={id} aria-current={on || undefined} className={`flex items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[11px] font-semibold ${on ? "bg-primary text-primary-foreground" : "text-muted-foreground opacity-60"}`}><Icon className="size-4" weight={on ? "fill" : "duotone"} />{id}</span>); })}
             </div>
           )}
           {selected.startsAt && (
             <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-accent px-3 py-2">
               <div className="flex items-center gap-2"><Timer className="size-5 text-primary" weight="duotone" /><div><p className="text-[10px] font-semibold uppercase text-muted-foreground">{selected.kind === "Jobs" ? "Applications close in" : "Starts in"}</p><p className="font-display text-sm font-black tabular-nums tracking-tight text-accent-foreground"><LiveCountdown target={selected.startsAt} /></p></div></div>
               <Button variant="ghost" size="sm" onClick={() => downloadIcs(selected)} aria-label="Add to calendar"><CalendarPlus className="size-4" weight="duotone" />Add</Button>
             </div>
           )}
           {selected.workMode !== "Remote" && <>
           <div className="mt-4 grid grid-cols-4 gap-1 rounded-full bg-muted p-1" role="radiogroup" aria-label="Mode of transport">
             {MODES.map((m) => { const Icon = { flight: AirplaneTilt, transit: Train, drive: Car, walk: PersonSimpleWalk }[m.id]; const km = distanceKm(origin, selected.coordinates); const tooFar = (m.id === "walk" && km > 60) || ((m.id === "drive" || m.id === "transit") && km > 4000); return (
               <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} disabled={tooFar} onClick={() => pickMode(m.id)} className={`flex flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-40 ${mode === m.id ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                 <Icon className="size-4" weight={mode === m.id ? "fill" : "duotone"} />
                 <span>{tooFar ? "—" : formatDuration(km / m.kmh + m.overheadH)}</span>
               </button>); })}
           </div>
           <p className="mt-2 text-center text-[11px] text-muted-foreground">{Math.round(distanceKm(origin, selected.coordinates)).toLocaleString()} km from {home ? home.label.split(",")[0] : origin === LAGOS ? "Lagos" : "you"} · {MODES.find((m) => m.id === mode)!.label}</p>
           </>}
              <div className="mt-3 flex gap-2"><Button className="flex-1" onClick={() => showDirections(selected)}><NavigationArrow className="size-4" weight="fill" /> Show route <ArrowRight className="size-4" /></Button><Button variant="secondary" onClick={followSelected}>{selected.kind === "Jobs" ? <Briefcase className="size-4" weight="duotone" /> : <BellRinging className={`size-4 ${alerts ? "notification-bell" : ""}`} weight={alerts ? "fill" : "duotone"} />} {selected.kind === "Jobs" ? "Save" : alerts ? "Following" : "Follow"}</Button><Button variant="secondary" size="icon" aria-label="View building location" title="View building location" onClick={() => mapRef.current?.flyTo({ center: selected.coordinates, ...MAP_VIEWS.street, duration: 1800, essential: true })}><Buildings className="size-4" weight="fill" /></Button></div>
        </section>
      )}

      <div className="absolute right-4 top-[19rem] z-20 flex flex-col gap-2 md:right-6 md:top-[16rem] max-md:[&>button:not(:first-child)]:hidden"><TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="secondary" size="icon" onClick={toggleProjection} aria-label={isGlobe ? "Use flat map" : "Use globe"}>{isGlobe ? <MapTrifold className="size-4" weight="duotone" /> : <GlobeHemisphereWest className="size-4" weight="duotone" />}</Button></TooltipTrigger><TooltipContent side="left">{isGlobe ? "Flat map" : "Globe view"}</TooltipContent></Tooltip></TooltipProvider><Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus className="size-4" weight="bold" /></Button><Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus className="size-4" weight="bold" /></Button></div>
      {tour.length > 0 && (
        <section className="absolute left-1/2 top-[9.6rem] z-30 w-[calc(100%-2rem)] max-w-[34rem] md:top-[10.5rem] -translate-x-1/2 rounded-[28px] border border-border bg-card/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-base font-black tracking-tight">Yard-tour · {tour.length} {tour.length === 1 ? "stop" : "stops"}</p>
            <Button variant="ghost" size="sm" onClick={() => setTour([])}><X className="size-4" /> Clear</Button>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {tour.map((stop, index) => <span key={stop.id} className="flex shrink-0 items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"><span className="grid size-5 place-items-center rounded-full text-[10px] text-white" style={{ background: categoryColor(stop.category) }}>{index + 1}</span>{stop.title}</span>)}
          </div>
          {tour.length === 1 && <p className="mt-2 text-xs text-muted-foreground">Hold Shift and press-and-hold another pin to add the next stop.</p>}
        </section>
      )}
      {pickingHome && <div className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-plum px-4 py-2 text-sm font-semibold text-primary-foreground"><HandPointing className="size-4" weight="fill" />Tap the map to set your location<button type="button" aria-label="Cancel" onClick={() => { pickingHomeRef.current = false; setPickingHome(false); }}><X className="size-4" /></button></div>}
      <div className={`absolute bottom-4 left-1/2 z-30 -translate-x-1/2 md:bottom-6 ${showPanel && selected ? "max-md:hidden" : ""}`}>
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Calendar" className="frosted-button flex h-12 items-center gap-2.5 rounded-2xl border-transparent bg-foreground px-4 text-background shadow-lg transition-transform hover:scale-[1.03] active:scale-95 dark:bg-secondary/60 dark:text-foreground">
              <CalendarBlank className="size-5" weight="duotone" />
              <span className="text-xs font-bold tracking-tight">{day ? day.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Calendar"}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center" className="w-auto max-w-[calc(100vw-2rem)] rounded-[28px] p-3">
            <Calendar mode="single" selected={day} onSelect={(d) => { setDay(d); setCalOpen(false); }} modifiers={{ busy: events.filter((e) => e.kind === kind && e.startsAt).map((e) => new Date(e.startsAt!)) }} modifiersClassNames={{ busy: "calendar-busy" }} />
            <p className="mt-2 border-t border-border px-1 pt-2 text-center text-[11px] leading-snug text-muted-foreground">Dotted days have {kind.toLowerCase()}. Pick one to filter the map.</p>
          </PopoverContent>
        </Popover>
      </div>
      <LocationAssistant darkMode={darkMode} onToggleTheme={toggleTheme} />
    </main>
  );
}

// Theme the existing vector layers without reloading tiles.
function tintBasemap(map: { getStyle: () => { layers?: { id: string; type: string }[] }; setPaintProperty: (id: string, prop: string, value: unknown) => void }) {
  const palette = getComputedStyle(document.documentElement);
  const color = (role: string) => palette.getPropertyValue(`--map-${role}`).trim();
  const layers = map.getStyle().layers ?? [];
  const set = (id: string, prop: string, value: unknown) => { try { map.setPaintProperty(id, prop, value); } catch { /* ignore */ } };
  for (const layer of layers) {
    const id = layer.id.toLowerCase();
    if (id.startsWith("event-route")) continue;
    if (layer.type === "background") set(layer.id, "background-color", color("land"));
    else if (layer.type === "fill") {
      if (id.includes("water")) set(layer.id, "fill-color", color("water"));
      else if (id.includes("park") || id.includes("landcover") || id.includes("wood") || id.includes("grass")) set(layer.id, "fill-color", color("park"));
      else if (id.includes("building")) set(layer.id, "fill-color", color("building"));
      else set(layer.id, "fill-color", color("land"));
    } else if (layer.type === "line") {
      if (id.includes("water") || id.includes("river")) set(layer.id, "line-color", color("river"));
      else if (id.includes("boundary") || id.includes("admin")) set(layer.id, "line-color", color("boundary"));
      else set(layer.id, "line-color", color("road"));
    } else if (layer.type === "symbol") {
      set(layer.id, "text-color", id.includes("water") ? color("water-label") : color("label"));
      set(layer.id, "text-halo-color", color("halo"));
    }
  }
}
