/**
 * Local CC0 / free-commercial gallery props under `/public/assets/props`.
 * Paths are rooted at the site origin for drei `useGLTF`.
 */

export type GalleryPropModel =
  | "bench"
  | "plant"
  | "bust"
  | "vase"
  | "plinth_table";

/** Authored mesh AABB size (metres) — used to fit template `size` / target height. */
export const GALLERY_PROP_NATIVE_SIZE: Record<
  GalleryPropModel,
  readonly [number, number, number]
> = {
  bench: [1.165, 0.889, 0.497],
  // Full pot + foliage AABB (not pot-only) — leaves top ≈ 0.84 m at scale 1.
  plant: [0.79, 0.841, 0.643],
  bust: [0.272, 0.515, 0.3],
  vase: [0.204, 0.4, 0.204],
  plinth_table: [0.55, 0.551, 0.45],
};

export const GALLERY_PROP_PATHS: Record<GalleryPropModel, string> = {
  bench: "/assets/props/bench/painted_wooden_bench.gltf",
  plant: "/assets/props/plant/potted_plant_02.gltf",
  bust: "/assets/props/bust/marble_bust_01.gltf",
  vase: "/assets/props/vase/ceramic_vase_01.gltf",
  plinth_table: "/assets/props/plinth_table/side_table_01.gltf",
};

/** Low-poly Kenney CC0 fallbacks (tiny GLBs) — optional mobile swap. */
export const KENNEY_PROP_PATHS = {
  bench: "/assets/props/kenney/bench.glb",
  plant: "/assets/props/kenney/plantSmall2.glb",
} as const;

export const FLAGSHIP_PROP_PRELOAD: readonly string[] = [
  GALLERY_PROP_PATHS.bench,
  GALLERY_PROP_PATHS.plant,
  GALLERY_PROP_PATHS.bust,
  GALLERY_PROP_PATHS.vase,
  GALLERY_PROP_PATHS.plinth_table,
];
