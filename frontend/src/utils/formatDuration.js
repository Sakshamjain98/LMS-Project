export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0 sec";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h} hr ${m} min ${s} sec`;
  if (m > 0) return `${m} min ${s} sec`;
  return `${s} sec`;
}