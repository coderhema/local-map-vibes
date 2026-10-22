/** Events without a verifiable date are not advertised as upcoming. */
export function isCurrentListing(item: { kind: string; startsAt: string | null }, now = Date.now()) {
  if (item.kind === "Jobs") return true;
  if (!item.startsAt) return false;
  const starts = Date.parse(item.startsAt);
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  return Number.isFinite(starts) && starts >= today.getTime();
}