import type { Listing } from "@/lib/listings.functions";

export const MAP_VIEWS = {
  city: { zoom: 11, pitch: 45 },
  region: { zoom: 5.5, pitch: 45 },
  world: { zoom: 2.65, pitch: 45 },
  street: { zoom: 17, pitch: 45 },
} as const;

export function groupDirections(entries: { item: Listing; side: "left" | "right" }[]) {
  const groups = new Map<string, { key: string; side: "left" | "right"; items: Listing[] }>();
  for (const { item, side } of entries) {
    const key = `${side}:${item.kind}:${item.category}`;
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { key, side, items: [item] });
  }
  return [...groups.values()];
}