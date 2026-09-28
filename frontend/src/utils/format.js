// The API returns ISO timestamps. If one has no timezone marker, treat it as
// UTC (that is what the database stores) instead of letting the browser
// guess local time, which would show wrong times in the audit log.
export function formatDate(iso) {
  if (!iso) return "";
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
  const date = new Date(hasZone ? iso : iso + "Z");
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleString();
}

export function shortId(id) {
  return id ? String(id).slice(0, 8) : "";
}
