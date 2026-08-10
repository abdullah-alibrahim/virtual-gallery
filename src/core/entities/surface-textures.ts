/**
 * CC0 surface texture catalogue under `/public/assets/textures`.
 * IDs persist in gallery `materialOverrides` and drive photo albedos in the shell.
 */

export const FLOOR_TEXTURE_PRESETS = [
  {
    id: "wood_plank",
    label: "Wood plank",
    albedo: "/assets/textures/wood_floor/diff_1k.jpg",
    styleHint: "plank",
  },
  {
    id: "wood_parquet",
    label: "Wood parquet",
    albedo: "/assets/textures/wood_floor/ambientcg_color.jpg",
    styleHint: "parquet",
  },
  {
    id: "wood_planks",
    label: "Wide planks",
    albedo: "/assets/textures/wood_planks/diff_1k.jpg",
    styleHint: "plank",
  },
  {
    id: "wood_deck",
    label: "Wood deck",
    albedo: "/assets/textures/wood_deck/diff_1k.jpg",
    styleHint: "plank",
  },
  {
    id: "concrete",
    label: "Concrete",
    albedo: "/assets/textures/concrete_floor/diff_1k.jpg",
    styleHint: "concrete",
  },
  {
    id: "stone_tile",
    label: "Stone tile",
    albedo: "/assets/textures/stone_floor/diff_1k.jpg",
    styleHint: "stone",
  },
  {
    id: "ceramic_tile",
    label: "Ceramic tile",
    albedo: "/assets/textures/tile_floor/diff_1k.jpg",
    styleHint: "stone",
  },
  {
    id: "tile_pattern",
    label: "Patterned tile",
    albedo: "/assets/textures/stone_floor/ambientcg_color.jpg",
    styleHint: "stone",
  },
  {
    id: "cobblestone",
    label: "Cobblestone",
    albedo: "/assets/textures/cobblestone_floor/diff_1k.jpg",
    styleHint: "stone",
  },
] as const;

export const WALL_TEXTURE_PRESETS = [
  {
    id: "plaster",
    label: "Concrete plaster",
    albedo: "/assets/textures/plaster_wall/diff_1k.jpg",
  },
  {
    id: "plaster_paint",
    label: "Painted plaster",
    albedo: "/assets/textures/plaster_paint/diff_1k.jpg",
  },
  {
    id: "plaster_smooth",
    label: "Smooth plaster",
    albedo: "/assets/textures/plaster_smooth/diff_1k.jpg",
  },
  {
    id: "concrete",
    label: "Concrete wall",
    albedo: "/assets/textures/concrete_wall/diff_1k.jpg",
  },
] as const;

export const CEILING_TEXTURE_PRESETS = [
  {
    id: "plaster",
    label: "White plaster",
    albedo: "/assets/textures/ceiling_plaster/diff_1k.jpg",
  },
] as const;

/** Sentinel: clear photo map and use procedural / style albedo. */
export const SURFACE_TEXTURE_NONE = "none" as const;

export type FloorTextureId = (typeof FLOOR_TEXTURE_PRESETS)[number]["id"];
export type WallTextureId = (typeof WALL_TEXTURE_PRESETS)[number]["id"];
export type CeilingTextureId = (typeof CEILING_TEXTURE_PRESETS)[number]["id"];

export type FloorTextureOverrideId = FloorTextureId | typeof SURFACE_TEXTURE_NONE;
export type WallTextureOverrideId = WallTextureId | typeof SURFACE_TEXTURE_NONE;
export type CeilingTextureOverrideId =
  | CeilingTextureId
  | typeof SURFACE_TEXTURE_NONE;

export const FLOOR_TEXTURE_IDS: readonly FloorTextureId[] =
  FLOOR_TEXTURE_PRESETS.map((p) => p.id);

export const WALL_TEXTURE_IDS: readonly WallTextureId[] =
  WALL_TEXTURE_PRESETS.map((p) => p.id);

export const CEILING_TEXTURE_IDS: readonly CeilingTextureId[] =
  CEILING_TEXTURE_PRESETS.map((p) => p.id);

const FLOOR_BY_ID = new Map(
  FLOOR_TEXTURE_PRESETS.map((p) => [p.id, p] as const),
);
const WALL_BY_ID = new Map(WALL_TEXTURE_PRESETS.map((p) => [p.id, p] as const));
const CEILING_BY_ID = new Map(
  CEILING_TEXTURE_PRESETS.map((p) => [p.id, p] as const),
);

export function isFloorTextureId(value: string): value is FloorTextureId {
  return FLOOR_BY_ID.has(value as FloorTextureId);
}

export function isWallTextureId(value: string): value is WallTextureId {
  return WALL_BY_ID.has(value as WallTextureId);
}

export function isCeilingTextureId(value: string): value is CeilingTextureId {
  return CEILING_BY_ID.has(value as CeilingTextureId);
}

export function floorTextureAlbedoPath(
  id: string | null | undefined,
): string | undefined {
  if (!id || id === SURFACE_TEXTURE_NONE) return undefined;
  return FLOOR_BY_ID.get(id as FloorTextureId)?.albedo;
}

export function wallTextureAlbedoPath(
  id: string | null | undefined,
): string | undefined {
  if (!id || id === SURFACE_TEXTURE_NONE) return undefined;
  return WALL_BY_ID.get(id as WallTextureId)?.albedo;
}

export function ceilingTextureAlbedoPath(
  id: string | null | undefined,
): string | undefined {
  if (!id || id === SURFACE_TEXTURE_NONE) return undefined;
  return CEILING_BY_ID.get(id as CeilingTextureId)?.albedo;
}
