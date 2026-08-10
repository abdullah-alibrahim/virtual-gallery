/**
 * Picks a texture LOD URL from camera distance.
 * Near → lod0, mid → lod1, far → lod2. Mobile never promotes above lod1.
 */

export type LodLevel = 0 | 1 | 2;

export function pickLodLevel(distanceMetres: number, mobile: boolean): LodLevel {
  if (mobile) {
    if (distanceMetres < 3.2) return 1;
    return 2;
  }
  if (distanceMetres < 2.4) return 0;
  if (distanceMetres < 5.5) return 1;
  return 2;
}

/**
 * Hysteresis around LOD thresholds so walking near a boundary does not
 * thrash React state / reload textures every few frames.
 */
export function pickLodLevelStable(
  distanceMetres: number,
  mobile: boolean,
  current: LodLevel,
): LodLevel {
  if (mobile) {
    if (current === 1) return distanceMetres < 3.7 ? 1 : 2;
    return distanceMetres < 2.7 ? 1 : 2;
  }
  if (current === 0) {
    if (distanceMetres < 2.9) return 0;
    return distanceMetres < 5.5 ? 1 : 2;
  }
  if (current === 1) {
    if (distanceMetres < 2.0) return 0;
    if (distanceMetres < 6.0) return 1;
    return 2;
  }
  if (distanceMetres < 2.4) return 0;
  if (distanceMetres < 5.0) return 1;
  return 2;
}

export function textureUrlForLod(
  textures: { lod0: string; lod1: string; lod2: string },
  level: LodLevel,
): string {
  if (level === 0) return textures.lod0 || textures.lod1 || textures.lod2;
  if (level === 1) return textures.lod1 || textures.lod0 || textures.lod2;
  return textures.lod2 || textures.lod1 || textures.lod0;
}
