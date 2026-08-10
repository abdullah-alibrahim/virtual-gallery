/**
 * Client-side mockup export helpers — copy share URL and download a PNG
 * preview without server round-trips.
 */

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Draw a framed artwork into a canvas context at the given outer box.
 * Approximates moulding + matte for PNG export (ratios match live UI).
 */
export function drawFramedArtwork(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  box: { x: number; y: number; w: number; h: number },
  frame: {
    color: string;
    matteColor: string;
    widthCm: number;
    matteCm: number;
  },
  canvasWidthCm: number,
  canvasHeightCm: number,
): void {
  const outerW = canvasWidthCm + 2 * (frame.widthCm + frame.matteCm);
  const outerH = canvasHeightCm + 2 * (frame.widthCm + frame.matteCm);
  const mouldingX = outerW > 0 ? (frame.widthCm / outerW) * box.w : 0;
  const mouldingY = outerH > 0 ? (frame.widthCm / outerH) * box.h : 0;
  const innerW = box.w - 2 * mouldingX;
  const innerH = box.h - 2 * mouldingY;
  const matteX =
    canvasWidthCm + 2 * frame.matteCm > 0
      ? (frame.matteCm / (canvasWidthCm + 2 * frame.matteCm)) * innerW
      : 0;
  const matteY =
    canvasHeightCm + 2 * frame.matteCm > 0
      ? (frame.matteCm / (canvasHeightCm + 2 * frame.matteCm)) * innerH
      : 0;

  // Soft contact shadow
  ctx.save();
  ctx.fillStyle = "rgb(0 0 0 / 0.22)";
  ctx.filter = "blur(6px)";
  ctx.fillRect(box.x + 2, box.y + box.h * 0.08, box.w, box.h * 0.95);
  ctx.restore();

  // Moulding
  ctx.fillStyle = frame.color;
  ctx.fillRect(box.x, box.y, box.w, box.h);

  // Matte
  ctx.fillStyle = frame.matteColor;
  ctx.fillRect(
    box.x + mouldingX,
    box.y + mouldingY,
    innerW,
    innerH,
  );

  // Canvas image
  const imgX = box.x + mouldingX + matteX;
  const imgY = box.y + mouldingY + matteY;
  const imgW = innerW - 2 * matteX;
  const imgH = innerH - 2 * matteY;
  ctx.drawImage(img, imgX, imgY, imgW, imgH);

  // Bevel highlight on moulding
  ctx.save();
  const grad = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
  grad.addColorStop(0, "rgb(255 255 255 / 0.18)");
  grad.addColorStop(0.45, "transparent");
  grad.addColorStop(1, "rgb(0 0 0 / 0.12)");
  ctx.fillStyle = grad;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

/**
 * Export a personal-space composite: room photo + framed artwork overlay.
 */
export async function exportPersonalSpacePng(options: {
  photoUrl: string;
  artworkUrl: string;
  photoNatural: { w: number; h: number };
  /** Artwork centre as % of photo (0–100). */
  placement: { x: number; y: number; scale: number; rotationDeg: number };
  /** Artwork outer size in photo pixels at scale=1. */
  basePx: { width: number; height: number };
  frame: {
    color: string;
    matteColor: string;
    widthCm: number;
    matteCm: number;
  };
  canvasWidthCm: number;
  canvasHeightCm: number;
  filename: string;
  maxEdge?: number;
}): Promise<void> {
  const maxEdge = options.maxEdge ?? 2400;
  const { photoNatural } = options;
  const scale = Math.min(1, maxEdge / Math.max(photoNatural.w, photoNatural.h));
  const W = Math.round(photoNatural.w * scale);
  const H = Math.round(photoNatural.h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  const [photo, art] = await Promise.all([
    loadImage(options.photoUrl),
    loadImage(options.artworkUrl),
  ]);

  ctx.fillStyle = "#1a1816";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(photo, 0, 0, W, H);

  const artW =
    ((options.basePx.width * options.placement.scale) / photoNatural.w) * W;
  const artH =
    ((options.basePx.height * options.placement.scale) / photoNatural.h) * H;
  const cx = (options.placement.x / 100) * W;
  const cy = (options.placement.y / 100) * H;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((options.placement.rotationDeg * Math.PI) / 180);
  drawFramedArtwork(
    ctx,
    art,
    { x: -artW / 2, y: -artH / 2, w: artW, h: artH },
    options.frame,
    options.canvasWidthCm,
    options.canvasHeightCm,
  );
  ctx.restore();

  // Soft vignette
  const vig = ctx.createRadialGradient(
    W * 0.5,
    H * 0.42,
    Math.min(W, H) * 0.2,
    W * 0.5,
    H * 0.5,
    Math.max(W, H) * 0.72,
  );
  vig.addColorStop(0, "transparent");
  vig.addColorStop(1, "rgb(0 0 0 / 0.18)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))),
      "image/png",
    );
  });
  downloadBlob(blob, options.filename);
}

/**
 * Export the live mockup stage by rasterising its SVG + compositing the
 * artwork at the hang placement. Falls back to drawing from DOM images when
 * an SVG snapshot is available via `data-mockup-stage`.
 */
export async function exportRoomStagePng(options: {
  stageEl: HTMLElement;
  artworkUrl: string;
  placement: {
    offsetX: number;
    offsetY: number;
    widthFraction: number;
    heightFraction: number;
  };
  wall: { x: number; y: number; width: number; height: number };
  perspective?: { rotateYDeg?: number; rotateXDeg?: number; skewXDeg?: number };
  frame: {
    color: string;
    matteColor: string;
    widthCm: number;
    matteCm: number;
  };
  canvasWidthCm: number;
  canvasHeightCm: number;
  filename: string;
  pixelRatio?: number;
}): Promise<void> {
  const svg = options.stageEl.querySelector("svg");
  if (!svg) throw new Error("Stage SVG not found");

  const rect = options.stageEl.getBoundingClientRect();
  const pr = options.pixelRatio ?? 2;
  const W = Math.max(1, Math.round(rect.width * pr));
  const H = Math.max(1, Math.round(rect.height * pr));

  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("width", String(W));
  clone.setAttribute("height", String(H));
  const xml = new XMLSerializer().serializeToString(clone);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;

  const [bg, art] = await Promise.all([
    loadImage(svgUrl),
    loadImage(options.artworkUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  ctx.drawImage(bg, 0, 0, W, H);

  const wallX = options.wall.x * W;
  const wallY = options.wall.y * H;
  const wallW = options.wall.width * W;
  const wallH = options.wall.height * H;

  const artW = options.placement.widthFraction * wallW;
  const artH = options.placement.heightFraction * wallH;
  const artX = wallX + options.placement.offsetX * wallW;
  const artY = wallY + options.placement.offsetY * wallH;

  ctx.save();
  // Approximate mild perspective by a slight skew when rotateY is set
  const ry = options.perspective?.rotateYDeg ?? 0;
  if (ry !== 0) {
    const cx = wallX + wallW / 2;
    const cy = wallY + wallH / 2;
    ctx.translate(cx, cy);
    ctx.transform(1, 0, Math.tan((ry * Math.PI) / 180) * 0.15, 1, 0, 0);
    ctx.translate(-cx, -cy);
  }

  drawFramedArtwork(
    ctx,
    art,
    { x: artX, y: artY, w: artW, h: artH },
    options.frame,
    options.canvasWidthCm,
    options.canvasHeightCm,
  );
  ctx.restore();

  // Vignette matching live grade
  const vig = ctx.createRadialGradient(
    W * 0.5,
    H * 0.4,
    Math.min(W, H) * 0.25,
    W * 0.5,
    H * 0.5,
    Math.max(W, H) * 0.7,
  );
  vig.addColorStop(0, "transparent");
  vig.addColorStop(1, "rgb(28 22 16 / 0.22)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))),
      "image/png",
    );
  });
  downloadBlob(blob, options.filename);
}

export function slugifyFilename(title: string, suffix: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "artwork"}-${suffix}.png`;
}
