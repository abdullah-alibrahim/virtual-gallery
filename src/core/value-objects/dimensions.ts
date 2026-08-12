import { ValidationError } from "@/core/errors";

export type LengthUnit = "cm" | "in";

/**
 * Physical size of an artwork as the artist describes it. The renderer works in
 * metres, so `toMetres` is the single conversion point — nothing else in the
 * codebase should divide by 100.
 */
export interface Dimensions {
  readonly width: number;
  readonly height: number;
  /** Canvas depth. Optional because most artists do not know or care. */
  readonly depth?: number;
  readonly unit: LengthUnit;
}

const INCHES_TO_CM = 2.54;
const MAX_CM = 2000; // 20m — beyond any real canvas, catches unit-entry mistakes
const MIN_CM = 1;

export function createDimensions(
  width: number,
  height: number,
  unit: LengthUnit,
  depth?: number,
): Dimensions {
  for (const [label, value] of [
    ["Width", width],
    ["Height", height],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new ValidationError(`${label} must be a positive number`, { value });
    }
    const cm = unit === "in" ? value * INCHES_TO_CM : value;
    if (cm < MIN_CM || cm > MAX_CM) {
      throw new ValidationError(
        `${label} must be between ${MIN_CM}cm and ${MAX_CM}cm`,
        { value, unit },
      );
    }
  }
  if (depth !== undefined && (!Number.isFinite(depth) || depth < 0)) {
    throw new ValidationError("Depth must be zero or a positive number", {
      depth,
    });
  }

  return depth === undefined
    ? { width, height, unit }
    : { width, height, depth, unit };
}

/** Metres, for the renderer. The only place unit conversion happens. */
export function toMetres(dimensions: Dimensions): {
  width: number;
  height: number;
  depth: number;
} {
  const factor = dimensions.unit === "in" ? INCHES_TO_CM / 100 : 0.01;
  return {
    width: dimensions.width * factor,
    height: dimensions.height * factor,
    depth: (dimensions.depth ?? 0) * factor,
  };
}

export function aspectRatio(dimensions: Dimensions): number {
  return dimensions.width / dimensions.height;
}

export function convertUnit(
  dimensions: Dimensions,
  unit: LengthUnit,
): Dimensions {
  if (dimensions.unit === unit) return dimensions;
  const factor = unit === "cm" ? INCHES_TO_CM : 1 / INCHES_TO_CM;
  const round = (n: number) => Math.round(n * 100) / 100;

  const converted: Dimensions = {
    width: round(dimensions.width * factor),
    height: round(dimensions.height * factor),
    unit,
  };
  return dimensions.depth === undefined
    ? converted
    : { ...converted, depth: round(dimensions.depth * factor) };
}

/**
 * Estimates physical size from pixel dimensions assuming a 300 DPI print.
 *
 * This is what makes upload feel automatic: the artist gets sensible defaults
 * in the inspector immediately and only corrects them if they care. Always
 * overridable — we never present a guess as fact.
 */
export function estimateFromPixels(
  pixelWidth: number,
  pixelHeight: number,
  dpi = 300,
): Dimensions {
  if (pixelWidth <= 0 || pixelHeight <= 0) {
    throw new ValidationError("Image dimensions must be positive", {
      pixelWidth,
      pixelHeight,
    });
  }
  const clamp = (cm: number) => Math.min(MAX_CM, Math.max(MIN_CM, cm));
  const toCm = (px: number) => clamp(Math.round((px / dpi) * INCHES_TO_CM));

  return {
    width: toCm(pixelWidth),
    height: toCm(pixelHeight),
    unit: "cm",
  };
}

export function formatDimensions(
  dimensions: Dimensions,
  locale: "en" | "ar" = "en",
): string {
  const { width, height, unit } = dimensions;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const unitLabel =
    unit === "cm"
      ? locale === "ar"
        ? "سم"
        : "cm"
      : locale === "ar"
        ? "بوصة"
        : "in";
  return `${fmt(width)} × ${fmt(height)} ${unitLabel}`;
}
