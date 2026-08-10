import type { Dimensions } from "@/core/value-objects/dimensions";
import type { FrameSpec } from "@/core/value-objects/frame-spec";
import type { RoomMockupPreset } from "@/core/entities/room-mockup";
import { ValidationError } from "@/core/errors";

const INCHES_TO_CM = 2.54;

export type FitLevel = "comfortable" | "tight" | "too_large";

export interface SizeCm {
  readonly widthCm: number;
  readonly heightCm: number;
}

export interface FitVerdict {
  readonly level: FitLevel;
  /** Larger of width/height occupancy (0–1+). */
  readonly occupancy: number;
  readonly widthRatio: number;
  readonly heightRatio: number;
  readonly copy: {
    readonly en: string;
    readonly ar: string;
  };
}

export interface WallPlacement {
  /** Artwork width as a fraction of the wall plane width (0–1+). */
  readonly widthFraction: number;
  /** Artwork height as a fraction of the wall plane height (0–1+). */
  readonly heightFraction: number;
  /** Left edge of artwork within the wall plane (0–1), centred by default. */
  readonly offsetX: number;
  /** Top edge of artwork within the wall plane (0–1). */
  readonly offsetY: number;
}

/**
 * Converts artwork dimensions to centimetres. The mockup plane is always
 * measured in cm so inches never leak into ratio math.
 */
export function dimensionsToCm(dimensions: Dimensions): SizeCm {
  const factor = dimensions.unit === "in" ? INCHES_TO_CM : 1;
  return {
    widthCm: dimensions.width * factor,
    heightCm: dimensions.height * factor,
  };
}

/**
 * Outer framed size: canvas + 2 × (moulding + matte) on each axis.
 */
export function framedOuterSizeCm(
  dimensions: Dimensions,
  frame: FrameSpec,
): SizeCm {
  const canvas = dimensionsToCm(dimensions);
  const border = 2 * (frame.widthCm + frame.matteCm);
  return {
    widthCm: canvas.widthCm + border,
    heightCm: canvas.heightCm + border,
  };
}

/**
 * Maps physical centimetres onto a preset wall plane.
 *
 * `paintingWidthCm / wallWidthCm` is the fraction of the wall quad width the
 * framed work should occupy in image space.
 */
export function computeWallPlacement(
  outer: SizeCm,
  preset: Pick<
    RoomMockupPreset,
    "wallWidthCm" | "wallHeightCm" | "hangCenterY"
  >,
): WallPlacement {
  if (preset.wallWidthCm <= 0 || preset.wallHeightCm <= 0) {
    throw new ValidationError("Wall dimensions must be positive", {
      wallWidthCm: preset.wallWidthCm,
      wallHeightCm: preset.wallHeightCm,
    });
  }
  if (outer.widthCm <= 0 || outer.heightCm <= 0) {
    throw new ValidationError("Artwork outer size must be positive", {
      ...outer,
    });
  }

  const widthFraction = outer.widthCm / preset.wallWidthCm;
  const heightFraction = outer.heightCm / preset.wallHeightCm;
  const offsetX = (1 - widthFraction) / 2;
  const offsetY = preset.hangCenterY - heightFraction / 2;

  return {
    widthFraction,
    heightFraction,
    offsetX,
    offsetY,
  };
}

/**
 * Fit feedback: compare framed artwork to wall size.
 *
 * - comfortable — largest side ≤ 60% of wall
 * - tight — 60–90%
 * - too_large — exceeds 90% (or physically larger than the wall)
 */
export function evaluateFit(
  outer: SizeCm,
  wall: Pick<RoomMockupPreset, "wallWidthCm" | "wallHeightCm">,
): FitVerdict {
  const widthRatio = outer.widthCm / wall.wallWidthCm;
  const heightRatio = outer.heightCm / wall.wallHeightCm;
  const occupancy = Math.max(widthRatio, heightRatio);

  let level: FitLevel;
  if (occupancy > 0.9) level = "too_large";
  else if (occupancy > 0.6) level = "tight";
  else level = "comfortable";

  return {
    level,
    occupancy,
    widthRatio,
    heightRatio,
    copy: fitCopy(level),
  };
}

function fitCopy(level: FitLevel): FitVerdict["copy"] {
  switch (level) {
    case "comfortable":
      return {
        en: "Fits comfortably — balanced scale on this wall.",
        ar: "تناسب مريح — مقياس متوازن على هذا الجدار.",
      };
    case "tight":
      return {
        en: "A tight fit — it will dominate the wall.",
        ar: "تناسب ضيق — سيهيمن على الجدار.",
      };
    case "too_large":
      return {
        en: "Too large for this wall — try a wider room or a smaller work.",
        ar: "أكبر من هذا الجدار — جرّب غرفة أوسع أو عملاً أصغر.",
      };
  }
}

/**
 * Pixel size of the artwork when a room photo’s visible wall width is known.
 * Used by Personal Spaces for initial scale.
 */
export function pixelsForWallReference(
  outer: SizeCm,
  imageWidthPx: number,
  wallWidthCm: number,
): SizeCm {
  if (imageWidthPx <= 0 || wallWidthCm <= 0) {
    throw new ValidationError("Image width and wall width must be positive", {
      imageWidthPx,
      wallWidthCm,
    });
  }
  const pxPerCm = imageWidthPx / wallWidthCm;
  return {
    widthCm: outer.widthCm * pxPerCm, // width in px (reusing SizeCm shape)
    heightCm: outer.heightCm * pxPerCm,
  };
}

/**
 * Pixel size from a measured reference segment on the photo (two-point
 * calibration). `segmentPx` is the distance between markers; `segmentCm` is
 * the real-world length of that span.
 */
export function pixelsFromReferenceSegment(
  outer: SizeCm,
  segmentPx: number,
  segmentCm: number,
): SizeCm {
  if (segmentPx <= 0 || segmentCm <= 0) {
    throw new ValidationError(
      "Reference segment length and centimetres must be positive",
      { segmentPx, segmentCm },
    );
  }
  const pxPerCm = segmentPx / segmentCm;
  return {
    widthCm: outer.widthCm * pxPerCm,
    heightCm: outer.heightCm * pxPerCm,
  };
}

/** Euclidean distance between two normalized (0–1) points on an image. */
export function segmentLengthPx(
  a: { x: number; y: number },
  b: { x: number; y: number },
  imageWidthPx: number,
  imageHeightPx: number,
): number {
  const dx = (b.x - a.x) * imageWidthPx;
  const dy = (b.y - a.y) * imageHeightPx;
  return Math.hypot(dx, dy);
}

/**
 * Soft snap for placement controls — pulls values toward a target when within
 * a threshold (e.g. rotation → 0°, scale → 1×).
 */
export function softSnap(
  value: number,
  target: number,
  threshold: number,
): number {
  return Math.abs(value - target) <= threshold ? target : value;
}

/** Default residential wall height when the client does not mark a reference. */
export const DEFAULT_WALL_HEIGHT_CM = 270;

/** Sensible default visible wall width for a phone photo of a room. */
export const DEFAULT_PERSONAL_WALL_WIDTH_CM = 320;

/** Default real-world length for a two-point wall span on a phone photo. */
export const DEFAULT_REFERENCE_SEGMENT_CM = 200;
