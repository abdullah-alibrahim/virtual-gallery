/**
 * Shared 3D renderer.
 *
 * Takes a SceneManifest and knows nothing about editing, Firestore, or routing.
 * The editor mounts it with selection outlines and gizmos; the viewer mounts it
 * with first-person walk controls.
 */

export const SCENE_SCHEMA_VERSION = 1 as const;

export type { Vec2, Vec3 } from "./math/geometry";
export {
  add,
  clamp,
  distance,
  fitScale,
  isInsidePolygon,
  length,
  normalize,
  projectOntoWall,
  scale,
  subtract,
  yawFromNormal,
} from "./math/geometry";

export { SceneRoot } from "./scene/scene-root";
export type { SceneRootProps } from "./scene/scene-root";
export { TemplateShell } from "./scene/template-shell";
export { GalleryLights } from "./scene/gallery-lights";
export { GalleryEnvironment, GALLERY_HDRI_PATH } from "./scene/gallery-environment";
export { ArtworkFrame } from "./scene/artwork-frame";
export type { GalleryQuality } from "./scene/gallery-quality";
export {
  isWalkLikeQuality,
  shouldUseFloorReflection,
  shouldUsePolishedFloor,
  shouldUseSoftShadows,
  shouldUseGalleryEnvironment,
  shouldUsePostprocessing,
} from "./scene/gallery-quality";
export { FirstPersonWalkControls } from "./controls/first-person-walk-controls";
export { EditorOrbitControls } from "./controls/editor-orbit-controls";
