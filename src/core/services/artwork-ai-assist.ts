/**
 * Studio AI assists for hang sizing, frames, and profile covers.
 * Pure heuristics (no network) — always overridable by the artist.
 */

import type { TemplateCategory } from "@/core/entities";
import {
  createDimensions,
  type Dimensions,
} from "@/core/value-objects/dimensions";
import {
  createFrameSpec,
  type FrameSpec,
  type FrameStyle,
} from "@/core/value-objects/frame-spec";

/**
 * Keep the long edge, reshape to the picture’s pixel aspect.
 * Stops square / invented hang sizes from stretching a landscape or portrait.
 */
export function fitSizeToAspect(
  width: number,
  height: number,
  aspect: number,
): { width: number; height: number } {
  if (!Number.isFinite(aspect) || aspect <= 0.05) {
    return { width, height };
  }
  const current = width / Math.max(height, 0.001);
  const slack = 0.05 * Math.max(current, aspect);
  if (Math.abs(current - aspect) <= slack) {
    return { width, height };
  }
  const long = Math.max(width, height);
  if (aspect >= 1) {
    return { width: long, height: long / aspect };
  }
  return { width: long * aspect, height: long };
}

/** Exhibition-scale size from pixel aspect — long edge ~120 cm by default. */
export function estimateExhibitionDimensions(
  pixelWidth: number,
  pixelHeight: number,
  targetLongEdgeCm = 120,
): Dimensions {
  if (pixelWidth <= 0 || pixelHeight <= 0) {
    return createDimensions(120, 120, "cm");
  }
  const aspect = pixelWidth / pixelHeight;
  const long = Math.min(180, Math.max(60, targetLongEdgeCm));
  if (aspect >= 1) {
    const height = Math.round(long / aspect);
    const width = Math.round(height * aspect);
    return createDimensions(
      Math.max(40, width),
      Math.max(40, height),
      "cm",
    );
  }
  const width = Math.round(long * aspect);
  const height = Math.round(width / aspect);
  return createDimensions(Math.max(40, width), Math.max(40, height), "cm");
}

export function dimensionsRoughlyMatch(
  current: Dimensions,
  suggested: Dimensions,
  toleranceCm = 2,
): boolean {
  if (current.unit !== suggested.unit) return false;
  return (
    Math.abs(current.width - suggested.width) <= toleranceCm &&
    Math.abs(current.height - suggested.height) <= toleranceCm
  );
}

export interface FrameSuggestion {
  readonly frame: FrameSpec;
  /** Short EN rationale for the inspector toast / hint. */
  readonly reasonKey:
    | "darkWork"
    | "lightWork"
    | "warmWork"
    | "coolWork"
    | "default";
}

/**
 * Suggest moulding + matte from dominant colour + hall category.
 * Starts from template defaults so suggestions stay on-brand.
 */
export function suggestFrameFromArtwork(input: {
  dominantColor: string | null;
  category: TemplateCategory;
  defaults: FrameSpec;
}): FrameSuggestion {
  const tone = analyzeColor(input.dominantColor);
  let style: FrameStyle = input.defaults.style;
  let color = input.defaults.color;
  let widthCm = input.defaults.widthCm;
  let matteCm = input.defaults.matteCm;
  let matteColor = input.defaults.matteColor;
  let reasonKey: FrameSuggestion["reasonKey"] = "default";

  const category = input.category;

  if (category === "black" || category === "night") {
    style = style === "none" ? "thin" : style;
    color = tone.lightness > 0.55 ? "#d8d4cc" : "#2a2a2a";
    matteCm = Math.max(matteCm, tone.lightness < 0.35 ? 4 : 2);
    matteColor = tone.lightness < 0.4 ? "#1a1a1a" : "#ece8e0";
    reasonKey = tone.lightness < 0.4 ? "darkWork" : "lightWork";
  } else if (category === "luxury" || category === "timber") {
    style = style === "thin" || style === "none" ? "classic" : style;
    color = tone.warm ? "#3d2e22" : "#2a2622";
    widthCm = Math.max(widthCm, 3.5);
    matteCm = Math.max(matteCm, 3);
    matteColor = tone.warm ? "#f3ebe0" : "#f0eee8";
    reasonKey = tone.warm ? "warmWork" : "coolWork";
  } else if (category === "white" || category === "museum" || category === "atrium") {
    style = "gallery";
    color = "#1a1a1a";
    widthCm = 2.5;
    if (tone.lightness > 0.7) {
      matteCm = Math.max(matteCm, 5);
      matteColor = "#f7f4ec";
      reasonKey = "lightWork";
    } else if (tone.lightness < 0.28) {
      matteCm = Math.max(matteCm, 6);
      matteColor = "#f5f2ea";
      reasonKey = "darkWork";
    } else {
      matteCm = Math.max(matteCm, 2);
      reasonKey = tone.warm ? "warmWork" : "coolWork";
    }
  } else if (category === "coastal" || category === "zen") {
    style = style === "ornate" ? "thin" : style === "none" ? "thin" : style;
    color = tone.cool ? "#2c3540" : "#4a4038";
    matteCm = Math.max(matteCm, 4);
    matteColor = "#f4f1ea";
    reasonKey = tone.cool ? "coolWork" : "warmWork";
  } else {
    // industrial / default
    if (tone.lightness < 0.3) {
      matteCm = Math.max(matteCm, 5);
      matteColor = "#f2efe8";
      color = "#111111";
      reasonKey = "darkWork";
    } else if (tone.lightness > 0.75) {
      matteCm = Math.max(matteCm, 3);
      color = "#222222";
      reasonKey = "lightWork";
    }
  }

  return {
    frame: createFrameSpec({ style, color, widthCm, matteCm, matteColor }),
    reasonKey,
  };
}

export interface CoverCandidate {
  readonly id: string;
  readonly url: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly label?: string;
}

/** Prefer wide, large, mid-contrast frames for profile heroes. */
export function scoreCoverCandidate(candidate: CoverCandidate): number {
  const w = candidate.width ?? 1;
  const h = candidate.height ?? 1;
  const aspect = w / h;
  // Landscape hero bias; square ok; tall portraits score lower.
  const aspectScore =
    aspect >= 1.35 ? 1 : aspect >= 1 ? 0.75 : aspect >= 0.85 ? 0.45 : 0.25;
  const megapixels = (w * h) / 1_000_000;
  const sizeScore = Math.min(1, megapixels / 2);
  return aspectScore * 0.65 + sizeScore * 0.35;
}

export function pickBestCover(
  candidates: readonly CoverCandidate[],
): CoverCandidate | null {
  if (candidates.length === 0) return null;
  let best = candidates[0]!;
  let bestScore = scoreCoverCandidate(best);
  for (const candidate of candidates.slice(1)) {
    const score = scoreCoverCandidate(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function analyzeColor(hex: string | null): {
  lightness: number;
  warm: boolean;
  cool: boolean;
} {
  if (!hex || !/^#([0-9a-fA-F]{6})$/.test(hex)) {
    return { lightness: 0.5, warm: false, cool: false };
  }
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const warm = r > g + 15 && r > b + 10;
  const cool = b > r + 10 && b >= g;
  return { lightness, warm, cool };
}
