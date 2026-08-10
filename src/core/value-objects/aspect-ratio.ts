import { ValidationError } from "@/core/errors";

/**
 * Width ÷ height. Branded so a raw ratio cannot be confused with a scale
 * factor or a percentage. Used by the auto-arrange service to decide which
 * wall anchors an artwork can fit, and by the renderer to size the canvas
 * plane before the texture arrives.
 */
export type AspectRatio = number & { readonly __brand: "AspectRatio" };

export function toAspectRatio(width: number, height: number): AspectRatio {
  if (!(width > 0) || !(height > 0)) {
    throw new ValidationError("Aspect ratio requires positive width and height", {
      width,
      height,
    });
  }
  return (width / height) as AspectRatio;
}

export function isLandscape(ratio: AspectRatio): boolean {
  return ratio > 1.05;
}

export function isPortrait(ratio: AspectRatio): boolean {
  return ratio < 0.95;
}

export function isSquare(ratio: AspectRatio): boolean {
  return !isLandscape(ratio) && !isPortrait(ratio);
}
