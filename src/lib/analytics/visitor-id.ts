const KEY = "vg_visitor_id";

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    return `v_${Date.now()}`;
  }
}

export function trackGalleryView(galleryId: string): void {
  void fetch("/api/analytics/beacon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "view",
      galleryId,
      visitorId: getOrCreateVisitorId(),
    }),
    keepalive: true,
  }).catch(() => undefined);
}

export function trackArtworkClick(
  galleryId: string,
  artworkId: string,
): void {
  void fetch("/api/analytics/beacon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "artwork_click",
      galleryId,
      artworkId,
      visitorId: getOrCreateVisitorId(),
    }),
    keepalive: true,
  }).catch(() => undefined);
}
