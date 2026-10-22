/** Events without a verifiable date are not advertised as upcoming. */
export function isCurrentListing(item: { kind: string; startsAt: string | null; date?: string }, now = Date.now()) {
  if (item.kind === "Jobs") return true;
  if (!item.startsAt) return false;
  const starts = Date.parse(item.startsAt);
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  // Older imports can have a generated timestamp that contradicts the source date.
  // Treat an explicitly dated past label as past too; do not silently promote it.
  const labelDate = item.date?.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\b/i);
  if (labelDate) {
    const year = item.date?.match(/\b(20\d{2})\b/)?.[1] ?? String(new Date(starts).getUTCFullYear());
    const labelled = Date.parse(`${labelDate[1]} ${labelDate[2]}, ${year} 00:00:00 GMT`);
    if (Number.isFinite(labelled) && labelled < today.getTime()) return false;
  }
  return Number.isFinite(starts) && starts >= today.getTime();
}