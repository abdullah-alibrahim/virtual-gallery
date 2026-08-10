/**
 * Free-wall placement math for the editor.
 *
 * Anchors remain the auto-arrange slots; artists can also drag to any point on
 * a wall plane. Positions always sit on the inward face via `worldPositionOnWall`.
 */

import type { Artwork, ArtworkPlacement, TemplateWall } from "@/core/entities";

import { worldPositionOnWall } from "./arrange-artworks";

export const EYE_LINE_M = 1.55;
export const WALL_INSET_M = 0.06;
/** Snap radius when dropping near a declared anchor (metres). */
export const ANCHOR_SNAP_M = 0.28;
/** Keyboard nudge step along the wall / vertically (metres). */
export const NUDGE_STEP_M = 0.05;
export const NUDGE_STEP_FINE_M = 0.01;
export const NUDGE_STEP_COARSE_M = 0.15;

export type Vec3 = readonly [number, number, number];

export function wallRight(normal: Vec3): Vec3 {
  const [nx, , nz] = normal;
  const len = Math.hypot(nz, -nx);
  if (len < 1e-8) return [1, 0, 0];
  return [nz / len, 0, -nx / len];
}

/** Along-wall (signed metres from origin) and height above origin. */
export function wallCoords(
  wall: TemplateWall,
  worldPos: Vec3,
): { along: number; height: number } {
  const [nx, ny, nz] = wall.normal;
  const nLen = Math.hypot(nx, ny, nz) || 1;
  const nnx = nx / nLen;
  const nny = ny / nLen;
  const nnz = nz / nLen;
  const right = wallRight([nnx, nny, nnz]);

  const dx = worldPos[0] - wall.origin[0];
  const dy = worldPos[1] - wall.origin[1];
  const dz = worldPos[2] - wall.origin[2];
  const alongNormal = dx * nnx + dy * nny + dz * nnz;
  const lx = dx - nnx * alongNormal;
  const ly = dy - nny * alongNormal;
  const lz = dz - nnz * alongNormal;

  return {
    along: lx * right[0] + lz * right[2],
    height: ly,
  };
}

export function clampAlongWall(wall: TemplateWall, along: number): number {
  const half = wall.width / 2;
  return Math.min(half, Math.max(-half, along));
}

export function clampHeightOnWall(wall: TemplateWall, height: number): number {
  const min = 0.25;
  const max = Math.max(min + 0.05, wall.height - 0.15);
  return Math.min(max, Math.max(min, height));
}

/**
 * World hang position for free along/height on a wall (inward inset).
 */
export function positionOnWall(
  wall: TemplateWall,
  along: number,
  height: number,
  inset = WALL_INSET_M,
): Vec3 {
  const a = clampAlongWall(wall, along);
  const h = clampHeightOnWall(wall, height);
  const right = wallRight(wall.normal);
  const lateral: Vec3 = [right[0] * a, h, right[2] * a];
  return worldPositionOnWall(wall, lateral, inset);
}

export function yawForWall(wall: TemplateWall): number {
  return Math.atan2(wall.normal[0], wall.normal[2]);
}

export function buildPlacementOnWall(input: {
  wall: TemplateWall;
  along: number;
  height: number;
  scale: number;
  snapToAnchors?: boolean;
  snapRadius?: number;
}): ArtworkPlacement {
  const snapRadius = input.snapRadius ?? ANCHOR_SNAP_M;
  let along = clampAlongWall(input.wall, input.along);
  let height = clampHeightOnWall(input.wall, input.height);
  let anchorIndex: number | null = null;

  if (input.snapToAnchors) {
    const snapped = nearestAnchor(input.wall, along, height, snapRadius);
    if (snapped) {
      along = snapped.along;
      height = snapped.height;
      anchorIndex = snapped.anchorIndex;
    }
  }

  return {
    wallId: input.wall.id,
    anchorIndex,
    position: positionOnWall(input.wall, along, height),
    rotation: [0, yawForWall(input.wall), 0],
    scale: input.scale,
    autoPlaced: false,
    locked: false,
  };
}

export function nearestAnchor(
  wall: TemplateWall,
  along: number,
  height: number,
  radius = ANCHOR_SNAP_M,
): { along: number; height: number; anchorIndex: number } | null {
  let best: { along: number; height: number; anchorIndex: number; dist: number } | null =
    null;

  for (let i = 0; i < wall.anchors.length; i++) {
    const anchor = wall.anchors[i];
    if (!anchor) continue;
    const world = worldPositionOnWall(wall, anchor.position);
    const coords = wallCoords(wall, world);
    const dist = Math.hypot(coords.along - along, coords.height - height);
    if (dist > radius) continue;
    if (!best || dist < best.dist) {
      best = {
        along: coords.along,
        height: coords.height,
        anchorIndex: i,
        dist,
      };
    }
  }

  return best
    ? {
        along: best.along,
        height: best.height,
        anchorIndex: best.anchorIndex,
      }
    : null;
}

export function placementFromWorldPoint(input: {
  wall: TemplateWall;
  worldPoint: Vec3;
  scale: number;
  snapToAnchors?: boolean;
  locked?: boolean;
}): ArtworkPlacement {
  const { along, height } = wallCoords(input.wall, input.worldPoint);
  const placement = buildPlacementOnWall({
    wall: input.wall,
    along,
    height,
    scale: input.scale,
    snapToAnchors: input.snapToAnchors,
  });
  return {
    ...placement,
    locked: input.locked ?? false,
  };
}

export function nudgePlacement(input: {
  wall: TemplateWall;
  placement: ArtworkPlacement;
  dAlong: number;
  dHeight: number;
  snapToAnchors?: boolean;
}): ArtworkPlacement {
  if (input.placement.locked) return input.placement;
  const { along, height } = wallCoords(input.wall, input.placement.position);
  return {
    ...buildPlacementOnWall({
      wall: input.wall,
      along: along + input.dAlong,
      height: height + input.dHeight,
      scale: input.placement.scale,
      snapToAnchors: input.snapToAnchors,
    }),
    locked: input.placement.locked,
  };
}

export function alignPlacementToEyeLine(
  wall: TemplateWall,
  placement: ArtworkPlacement,
  eyeLine = EYE_LINE_M,
): ArtworkPlacement {
  if (placement.locked) return placement;
  const { along } = wallCoords(wall, placement.position);
  return {
    ...buildPlacementOnWall({
      wall,
      along,
      height: eyeLine,
      scale: placement.scale,
      snapToAnchors: false,
    }),
    locked: placement.locked,
  };
}

/**
 * Space artworks evenly along their shared wall between the outermost pair
 * (or wall margins when only one work). Preserves each work's height & scale.
 */
export function distributePlacementsOnWall(input: {
  wall: TemplateWall;
  artworks: readonly Artwork[];
  margin?: number;
}): ReadonlyMap<string, ArtworkPlacement> {
  const margin = input.margin ?? 0.45;
  const movable = input.artworks.filter(
    (a) => a.placement.wallId === input.wall.id && !a.placement.locked,
  );
  const result = new Map<string, ArtworkPlacement>();
  if (movable.length === 0) return result;

  const ranked = movable
    .map((artwork) => {
      const { along, height } = wallCoords(input.wall, artwork.placement.position);
      return { artwork, along, height };
    })
    .sort((a, b) => a.along - b.along);

  const half = input.wall.width / 2;
  const left = -half + margin;
  const right = half - margin;

  if (ranked.length === 1) {
    const only = ranked[0]!;
    result.set(
      only.artwork.id,
      {
        ...buildPlacementOnWall({
          wall: input.wall,
          along: 0,
          height: only.height,
          scale: only.artwork.placement.scale,
          snapToAnchors: false,
        }),
        locked: only.artwork.placement.locked,
      },
    );
    return result;
  }

  for (let i = 0; i < ranked.length; i++) {
    const entry = ranked[i]!;
    const t = i / (ranked.length - 1);
    const along = left + (right - left) * t;
    result.set(entry.artwork.id, {
      ...buildPlacementOnWall({
        wall: input.wall,
        along,
        height: entry.height,
        scale: entry.artwork.placement.scale,
        snapToAnchors: false,
      }),
      locked: entry.artwork.placement.locked,
    });
  }

  return result;
}

/** Ray–plane hit on a wall, or null if behind / outside extents. */
export function intersectRayWithWall(
  origin: Vec3,
  direction: Vec3,
  wall: TemplateWall,
): { point: Vec3; distance: number } | null {
  const [nx, ny, nz] = wall.normal;
  const nLen = Math.hypot(nx, ny, nz) || 1;
  const nnx = nx / nLen;
  const nny = ny / nLen;
  const nnz = nz / nLen;

  const denom = direction[0] * nnx + direction[1] * nny + direction[2] * nnz;
  if (Math.abs(denom) < 1e-6) return null;

  const ox = wall.origin[0] - origin[0];
  const oy = wall.origin[1] - origin[1];
  const oz = wall.origin[2] - origin[2];
  const t = (ox * nnx + oy * nny + oz * nnz) / denom;
  if (t < 0.02) return null;

  const point: Vec3 = [
    origin[0] + direction[0] * t,
    origin[1] + direction[1] * t,
    origin[2] + direction[2] * t,
  ];

  const { along, height } = wallCoords(wall, point);
  const half = wall.width / 2;
  if (Math.abs(along) > half + 0.15) return null;
  if (height < -0.2 || height > wall.height + 0.2) return null;

  return { point, distance: t };
}

export function pickWallFromRay(
  walls: readonly TemplateWall[],
  origin: Vec3,
  direction: Vec3,
): { wall: TemplateWall; point: Vec3; distance: number } | null {
  let best: { wall: TemplateWall; point: Vec3; distance: number } | null = null;
  for (const wall of walls) {
    const hit = intersectRayWithWall(origin, direction, wall);
    if (!hit) continue;
    if (!best || hit.distance < best.distance) {
      best = { wall, point: hit.point, distance: hit.distance };
    }
  }
  return best;
}

export function findWall(
  walls: readonly TemplateWall[],
  wallId: string,
): TemplateWall | undefined {
  return walls.find((w) => w.id === wallId);
}
