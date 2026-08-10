import type {
  FloorStyle,
  GalleryMaterialOverrides,
  TemplateMaterials,
} from "@/core/entities";
import {
  SURFACE_TEXTURE_NONE,
  isCeilingTextureId,
  isFloorTextureId,
  isWallTextureId,
} from "@/core/entities";

const FLOOR_STYLES: ReadonlySet<FloorStyle> = new Set([
  "plank",
  "parquet",
  "concrete",
  "stone",
]);

const DEFAULT_BAND = "#d4cfc4";

/**
 * Applies a texture-id override onto a mutable materials bag.
 * `"none"` / `""` clears any inherited photo map.
 */
function applyTextureId(
  target: TemplateMaterials,
  key: "floorTextureId" | "wallTextureId" | "ceilingTextureId",
  value: string | undefined,
  isValid: (id: string) => boolean,
): TemplateMaterials {
  if (value === undefined) return target;
  if (value === SURFACE_TEXTURE_NONE || value === "") {
    if (target[key] === undefined) return target;
    const { [key]: _cleared, ...rest } = target;
    return rest;
  }
  if (!isValid(value)) return target;
  return { ...target, [key]: value };
}

/**
 * Merges gallery-level material overrides onto a template's materials.
 * Shared catalogue templates are never mutated — callers receive a new object.
 */
export function resolveGalleryMaterials(
  base: TemplateMaterials,
  overrides: GalleryMaterialOverrides | null | undefined,
): TemplateMaterials {
  if (!overrides) return base;

  let merged: TemplateMaterials = {
    ...base,
    ...(overrides.wall !== undefined ? { wall: overrides.wall } : {}),
    ...(overrides.floor !== undefined ? { floor: overrides.floor } : {}),
    ...(overrides.ceiling !== undefined ? { ceiling: overrides.ceiling } : {}),
    ...(overrides.trim !== undefined ? { trim: overrides.trim } : {}),
    ...(overrides.wallRoughness !== undefined
      ? { wallRoughness: overrides.wallRoughness }
      : {}),
    ...(overrides.floorRoughness !== undefined
      ? { floorRoughness: overrides.floorRoughness }
      : {}),
    ...(overrides.floorMetalness !== undefined
      ? { floorMetalness: overrides.floorMetalness }
      : {}),
    ...(overrides.ceilingRoughness !== undefined
      ? { ceilingRoughness: overrides.ceilingRoughness }
      : {}),
    ...(overrides.floorStyle !== undefined &&
    FLOOR_STYLES.has(overrides.floorStyle)
      ? { floorStyle: overrides.floorStyle }
      : {}),
    ...(overrides.wallBand !== undefined ? { wallBand: overrides.wallBand } : {}),
    ...(overrides.wallBandBottomM !== undefined
      ? { wallBandBottomM: overrides.wallBandBottomM }
      : {}),
    ...(overrides.wallBandTopM !== undefined
      ? { wallBandTopM: overrides.wallBandTopM }
      : {}),
  };

  merged = applyTextureId(
    merged,
    "floorTextureId",
    overrides.floorTextureId,
    isFloorTextureId,
  );
  merged = applyTextureId(
    merged,
    "wallTextureId",
    overrides.wallTextureId,
    isWallTextureId,
  );
  merged = applyTextureId(
    merged,
    "ceilingTextureId",
    overrides.ceilingTextureId,
    isCeilingTextureId,
  );

  if (overrides.wallBandEnabled === false) {
    const {
      wallBand: _band,
      wallBandBottomM: _bottom,
      wallBandTopM: _top,
      ...withoutBand
    } = merged;
    return withoutBand;
  }

  if (overrides.wallBandEnabled === true && merged.wallBand === undefined) {
    return {
      ...merged,
      wallBand: DEFAULT_BAND,
      wallBandBottomM: merged.wallBandBottomM ?? 0.9,
      wallBandTopM: merged.wallBandTopM ?? 2.4,
    };
  }

  return merged;
}

/** Returns a template clone with materials resolved from optional overrides. */
export function applyMaterialOverrides<
  T extends { readonly materials: TemplateMaterials },
>(
  template: T,
  overrides: GalleryMaterialOverrides | null | undefined,
): T {
  if (!overrides) return template;
  return {
    ...template,
    materials: resolveGalleryMaterials(template.materials, overrides),
  };
}
