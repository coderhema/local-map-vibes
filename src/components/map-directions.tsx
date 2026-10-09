import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { Listing } from "@/lib/listings.functions";
import { pinFilledMarkup } from "@/lib/pin-icons";

export function MapDirections({ map, listings, onSelect }: { map: MapLibreMap | null; listings: Listing[]; onSelect: (item: Listing) => void }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = container.current;
    if (!map || !root) return;
    const entries = listings.map((item) => {
      const button = document.createElement("button");
      button.className = "direction-pin";
      button.setAttribute("aria-label", `Turn toward ${item.title}`);
      button.title = item.title;
      button.innerHTML = `<span class="direction-shield"><svg viewBox="0 0 256 256" fill="currentColor">${pinFilledMarkup[item.kind === "Jobs" ? "Briefcase" : item.category] ?? pinFilledMarkup["Briefcase"]}</svg></span>`;
      button.addEventListener("click", () => onSelect(item));
      root.append(button);
      return { item, button };
    });
    const update = () => {
      const width = map.getContainer().clientWidth, height = map.getContainer().clientHeight;
      const center = map.getCenter();
      const sides: typeof entries[] = [[], []];
      for (const entry of entries) {
        const p = map.project(entry.item.coordinates);
        const [lng, lat] = entry.item.coordinates;
        const rad = Math.PI / 180;
        const delta = ((lng - center.lng + 540) % 360) - 180;
        const dot = Math.sin(lat * rad) * Math.sin(center.lat * rad) + Math.cos(lat * rad) * Math.cos(center.lat * rad) * Math.cos(delta * rad);
        const behind = map.getProjection().type === "globe" && dot < 0;
        const outside = !Number.isFinite(p.x) || p.x < 24 || p.x > width - 24 || p.y < 170 || p.y > height - 36;
        entry.button.hidden = !behind && !outside;
        if (entry.button.hidden) continue;
        const side = behind ? (delta < 0 ? 0 : 1) : (p.x < width / 2 ? 0 : 1);
        entry.button.dataset["side"] = side === 0 ? "left" : "right";
        sides[side]?.push(entry);
      }
      sides.forEach((side) => side.forEach(({ button }, i) => {
        button.style.top = `${220 + (i + 0.5) * Math.min(42, Math.max(18, (height - 300) / Math.max(1, side.length)))}px`;
      }));
    };
    map.on("move", update);
    map.on("resize", update);
    update();
    return () => { map.off("move", update); map.off("resize", update); root.replaceChildren(); };
  }, [map, listings, onSelect]);
  return <div ref={container} className="pointer-events-none absolute inset-0 z-[35]" aria-label="Directions to distant listings" />;
}