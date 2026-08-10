import { ValidationError } from "@/core/errors";

/**
 * Frame styles the renderer knows how to build. Adding a style is a code
 * change in `src/three` (new geometry) plus a catalogue entry here — the
 * domain refuses unknown styles so a bad template or editor patch cannot
 * silently produce a missing mesh.
 */
export const FRAME_STYLES = [
  "none",
  "thin",
  "classic",
  "gallery",
  "floater",
  "ornate",
] as const;

export type FrameStyle = (typeof FRAME_STYLES)[number];

export interface FrameSpec {
  readonly style: FrameStyle;
  /** Hex colour of the moulding, e.g. "#1a1a1a". */
  readonly color: string;
  /** Outer moulding width in centimetres. */
  readonly widthCm: number;
  /** Matte (passepartout) width in centimetres. Zero means flush. */
  readonly matteCm: number;
  readonly matteColor: string;
}

const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export function createFrameSpec(input: {
  style: FrameStyle;
  color: string;
  widthCm?: number;
  matteCm?: number;
  matteColor?: string;
}): FrameSpec {
  if (!FRAME_STYLES.includes(input.style)) {
    throw new ValidationError("Unknown frame style", { style: input.style });
  }
  if (!HEX_COLOR.test(input.color)) {
    throw new ValidationError("Frame colour must be a hex value", {
      color: input.color,
    });
  }

  const widthCm = input.widthCm ?? defaultWidth(input.style);
  const matteCm = input.matteCm ?? 0;
  const matteColor = input.matteColor ?? "#f5f2ea";

  if (widthCm < 0 || widthCm > 20) {
    throw new ValidationError("Frame width must be between 0 and 20 cm", {
      widthCm,
    });
  }
  if (matteCm < 0 || matteCm > 30) {
    throw new ValidationError("Matte width must be between 0 and 30 cm", {
      matteCm,
    });
  }
  if (!HEX_COLOR.test(matteColor)) {
    throw new ValidationError("Matte colour must be a hex value", {
      matteColor,
    });
  }

  return {
    style: input.style,
    color: input.color.toLowerCase(),
    widthCm,
    matteCm,
    matteColor: matteColor.toLowerCase(),
  };
}

function defaultWidth(style: FrameStyle): number {
  switch (style) {
    case "none":
      return 0;
    case "thin":
      return 1.5;
    case "classic":
      return 4;
    case "gallery":
      return 2.5;
    case "floater":
      return 2;
    case "ornate":
      return 6;
  }
}

/** Sensible default when a template does not declare one. */
export const DEFAULT_FRAME: FrameSpec = createFrameSpec({
  style: "gallery",
  color: "#1a1a1a",
  widthCm: 2.5,
  matteCm: 0,
});
