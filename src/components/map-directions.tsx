import { useEffect, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { Listing } from "@/lib/listings.functions";
import { pinFilledMarkup } from "@/lib/pin-icons";
import { groupDirections } from "@/lib/map-discovery";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function MapDirections({ map, listings, onSelect, collapsed }: { map: MapLibreMap | null; listings: Listing[]; onSelect: (item: Listing) => void; collapsed: boolean }) {
  const [groups, setGroups] = useState<ReturnType<typeof groupDirections>>([]);
  const [height, setHeight] = useState(800);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    if (!map) return;
    let frame = 0;
    let signature = "";
    const update = () => {
      frame = 0;
      const width = map.getContainer().clientWidth, height = map.getContainer().clientHeight;
      const center = map.getCenter();
      const entries: { item: Listing; side: "left" | "right" }[] = [];
      for (const item of listings) {
        const p = map.project(item.coordinates);
        const [lng, lat] = item.coordinates;
        const rad = Math.PI / 180;
        const delta = ((lng - center.lng + 540) % 360) - 180;
        const dot = Math.sin(lat * rad) * Math.sin(center.lat * rad) + Math.cos(lat * rad) * Math.cos(center.lat * rad) * Math.cos(delta * rad);
        const behind = map.getProjection().type === "globe" && dot < 0;
        const outside = !Number.isFinite(p.x) || p.x < 24 || p.x > width - 24 || p.y < 170 || p.y > height - 36;
        if (!behind && !outside) continue;
        const side = behind ? (delta < 0 ? 0 : 1) : (p.x < width / 2 ? 0 : 1);
        entries.push({ item, side: side === 0 ? "left" : "right" });
      }
      const next = groupDirections(entries);
      const key = `${height}:${next.map((g) => `${g.key}:${g.items.map((i) => i.id).join(",")}`).join("|")}`;
      if (key !== signature) { signature = key; setGroups(next); setHeight(height); }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    map.on("move", schedule);
    map.on("resize", schedule);
    update();
    return () => { map.off("move", schedule); map.off("resize", schedule); cancelAnimationFrame(frame); };
  }, [map, listings, onSelect]);
  return <div className="map-directions pointer-events-none absolute inset-0 z-[35]" data-collapsed={collapsed} aria-label="Directions to distant listings">
    {groups.map((group) => {
      const first = group.items[0];
      if (!first) return null;
      const side = groups.filter((g) => g.side === group.side);
      const index = side.indexOf(group);
      const top = 240 + index * Math.min(48, Math.max(36, (height - 380) / side.length));
      const label = group.items.length > 1 ? `${group.items.length} distant ${first.category.toLowerCase()} ${first.kind.toLowerCase()}` : `Turn toward ${first.title}`;
      const control = <Button variant="ghost" size="icon" className="direction-pin" data-side={group.side} style={{ top }} aria-label={label} title={label} onClick={group.items.length === 1 ? () => onSelect(first) : undefined}>
        <span className="direction-shield"><svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" dangerouslySetInnerHTML={{ __html: pinFilledMarkup[first.kind === "Jobs" ? "Briefcase" : first.category] ?? pinFilledMarkup["Briefcase"] ?? "" }} /></span>
        {group.items.length > 1 && <span className="direction-count">+{group.items.length - 1}</span>}
      </Button>;
      return group.items.length === 1 ? <div key={group.key}>{control}</div> : <Popover key={group.key} open={open === group.key} onOpenChange={(value) => setOpen(value ? group.key : null)}>
        <PopoverTrigger asChild>{control}</PopoverTrigger>
        <PopoverContent side={group.side === "left" ? "right" : "left"} className="w-64 max-w-[calc(100vw-5rem)] p-2">
          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">{first.category} · {group.items.length} {first.kind.toLowerCase()}</p>
          <div className="max-h-64 overflow-y-auto">{group.items.map((item) => <Button key={item.id} variant="ghost" className="h-auto w-full flex-col items-start whitespace-normal px-2 py-2 text-left" onClick={() => { setOpen(null); onSelect(item); }}><span className="text-xs font-semibold">{item.title}</span><span className="text-[11px] text-muted-foreground">{item.place}</span></Button>)}</div>
        </PopoverContent>
      </Popover>;
    })}
  </div>;
}