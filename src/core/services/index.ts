export {
  arrangeArtworks,
  recomputeAutoPlacedWorldPositions,
  worldPositionOnWall,
  type ArrangeInput,
  type ArrangeResult,
  type ArrangeStrategy,
} from "./arrange-artworks";

export { assertAssetReady, validateScene } from "./validate-scene";

export {
  compileSceneManifest,
  latestPointerPath,
  manifestPath,
  ogImagePath,
  type CompileInput,
  type LatestPointer,
} from "./compile-scene-manifest";

export {
  applyMaterialOverrides,
  resolveGalleryMaterials,
} from "./resolve-gallery-materials";

export {
  assertCanAddArtwork,
  assertCanCreateGallery,
  assertCanInviteMember,
  assertCanUpload,
  canUseTemplateTier,
  limitsForPlan,
} from "./enforce-plan-limits";

export { PLAN_LIMITS } from "./plan-limits";

export {
  PRO_TRIAL_DAYS,
  coerceDate,
  isProTrialActive,
  proTrialDaysLeft,
  shouldExpireProTrial,
  shouldGrantProTrial,
} from "./pro-trial";

export {
  ACCEPTED_IMAGE_TYPES,
  LOD_SIZES,
  MAX_UPLOAD_BYTES,
  extensionForMime,
  isAcceptedImageType,
  originalStoragePath,
  variantStoragePath,
  type AcceptedImageType,
  type LodSize,
} from "./asset-upload";

export {
  DEFAULT_PERSONAL_WALL_WIDTH_CM,
  DEFAULT_REFERENCE_SEGMENT_CM,
  DEFAULT_WALL_HEIGHT_CM,
  computeWallPlacement,
  dimensionsToCm,
  evaluateFit,
  framedOuterSizeCm,
  pixelsForWallReference,
  pixelsFromReferenceSegment,
  segmentLengthPx,
  softSnap,
  type FitLevel,
  type FitVerdict,
  type SizeCm,
  type WallPlacement,
} from "./room-mockup-scale";
