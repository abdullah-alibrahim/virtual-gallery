import type { TemplateCategory } from "@/core/entities";

/**
 * Quality tiers for the shared renderer:
 * - `edit` — orbit editor, lightest
 * - `walk` — public / demo first-person, museum grade
 * - `marketing` — landing / templates / auth previews (walk polish + cinematic)
 * - `mobile` — phones: no soft shadows / reflector / env
 */
export type GalleryQuality = "edit" | "walk" | "marketing" | "mobile";

/** Soft floor reflections — museum / polished rooms only. */
const REFLECTIVE_CATEGORIES: ReadonlySet<TemplateCategory> = new Set([
  "museum",
  "luxury",
  "white",
  "atrium",
]);

export function isWalkLikeQuality(quality: GalleryQuality): boolean {
  return quality === "walk" || quality === "marketing";
}

/**
 * Floor “reflection” is simulated with envMapIntensity on a StandardMaterial.
 * drei `MeshReflectorMaterial` pulls soft-shadow shader chunks that call
 * `unpackRGBAToDepth`, which Three r170+ removed — that produced WebGL compile
 * failures and Next.js render error overlays on landing / demo / walk.
 */
export function shouldUseFloorReflection(
  quality: GalleryQuality,
  category: TemplateCategory,
): boolean {
  void quality;
  void category;
  return false;
}

/** Polished rooms still get a glossier StandardMaterial floor. */
export function shouldUsePolishedFloor(
  quality: GalleryQuality,
  category: TemplateCategory,
): boolean {
  return isWalkLikeQuality(quality) && REFLECTIVE_CATEGORIES.has(category);
}

/**
 * Whether walk/marketing would prefer PCSS soft shadows.
 *
 * Always false for now: drei `<SoftShadows>` is incompatible with Three
 * ≥0.170 (`unpackRGBAToDepth` removed). Callers use `PCFSoftShadowMap` instead.
 */
export function shouldUseSoftShadows(_quality: GalleryQuality): boolean {
  return false;
}

export function shouldUseGalleryEnvironment(quality: GalleryQuality): boolean {
  return isWalkLikeQuality(quality);
}

export function shouldUsePostprocessing(
  quality: GalleryQuality,
  reducedMotion: boolean,
): boolean {
  if (reducedMotion || quality === "edit") return false;
  return true;
}
