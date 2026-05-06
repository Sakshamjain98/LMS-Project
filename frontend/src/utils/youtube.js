// Convert any common YouTube URL form (watch, youtu.be, playlist, embed) into
// a working /embed/ URL. The admin can paste anything; the iframe on Home runs
// this helper before mounting so display Just Works.
export const normalizeYouTubeUrl = (input) => {
  if (!input) return "";
  const url = String(input).trim();
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    // Already an embed URL — leave it untouched.
    if (host.includes("youtube.com") && u.pathname.startsWith("/embed/")) return url;
    // Playlist links — embed via videoseries
    if (host.includes("youtube.com") && u.pathname === "/playlist") {
      const list = u.searchParams.get("list");
      return list ? `https://www.youtube.com/embed/videoseries?list=${list}` : url;
    }
    // youtu.be short links — `/{id}`
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      const list = u.searchParams.get("list");
      const t = u.searchParams.get("t");
      const params = new URLSearchParams();
      if (list) params.set("list", list);
      if (t) params.set("start", String(parseTimestamp(t)));
      const qs = params.toString();
      return id ? `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : ""}` : url;
    }
    // Standard /watch?v=ID — convert to /embed/ID and preserve start time / playlist.
    if (host.includes("youtube.com") && u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      if (!id) return url;
      const list = u.searchParams.get("list");
      const t = u.searchParams.get("t");
      const params = new URLSearchParams();
      if (list) params.set("list", list);
      if (t) params.set("start", String(parseTimestamp(t)));
      const qs = params.toString();
      return `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : ""}`;
    }
    return url;
  } catch {
    return url;
  }
};

// Accepts "1883s", "31m23s", or a plain integer.
const parseTimestamp = (t) => {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!m) return 0;
  const [, h = 0, mm = 0, s = 0] = m;
  return Number(h) * 3600 + Number(mm) * 60 + Number(s);
};
