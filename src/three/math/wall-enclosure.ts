/**
 * Geometric checks that walkable interiors stay visually enclosed by wall slabs.
 * Used by tests to catch white-void regressions (missing segments / open corners).
 */

import type { SceneTemplate, TemplateWall } from "@/core/entities";

import { isInsidePolygon, type Vec2 } from "./geometry";

/** Half-extent along the wall's horizontal axis. */
function wallTangentAxis(wall: TemplateWall): "x" | "z" {
  return Math.abs(wall.normal[0]) > 0.5 ? "z" : "x";
}

/** Sample points just inside walkBounds near each edge midpoint. */
export function sampleInteriorEdgePoints(
  walkBounds: SceneTemplate["walkBounds"],
  inset = 0.35,
): Vec2[] {
  const pts: Vec2[] = [];
  const n = walkBounds.length;
  if (n < 3) return pts;

  for (let i = 0; i < n; i++) {
    const a = walkBounds[i]!;
    const b = walkBounds[(i + 1) % n]!;
    const mx = (a[0] + b[0]) / 2;
    const mz = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    // Inward normal (left of edge for CCW; try both if needed).
    const nx = -dz / len;
    const nz = dx / len;
    for (const sign of [1, -1] as const) {
      const p: Vec2 = [mx + nx * inset * sign, mz + nz * inset * sign];
      if (isInsidePolygon(p, walkBounds)) {
        pts.push(p);
        break;
      }
    }
  }
  return pts;
}

/**
 * Approximate distance from a floor point to the nearest wall slab face
 * along a horizontal ray in direction (dx, dz). Returns Infinity if none.
 */
export function rayHitWallDistance(
  origin: Vec2,
  dir: Vec2,
  walls: readonly TemplateWall[],
  maxDist = 40,
): number {
  const len = Math.hypot(dir[0], dir[1]) || 1;
  const dx = dir[0] / len;
  const dz = dir[1] / len;
  let best = Infinity;

  for (const wall of walls) {
    // Elevated lintels / headers don't block eye-height walk rays.
    if ((wall.origin[1] ?? 0) > 0.45) continue;
    const nx = wall.normal[0];
    const nz = wall.normal[2];
    const denom = dx * nx + dz * nz;
    // Only hit the front face (approaching against the inward normal).
    if (denom >= -1e-6) continue;

    const ox = origin[0] - wall.origin[0];
    const oz = origin[1] - wall.origin[2];
    const t = -(ox * nx + oz * nz) / denom;
    if (t < 0.02 || t > maxDist) continue;

    const hx = origin[0] + dx * t;
    const hz = origin[1] + dz * t;
    const along =
      wallTangentAxis(wall) === "x"
        ? hx - wall.origin[0]
        : hz - wall.origin[2];
    if (Math.abs(along) <= wall.width / 2 + 0.12) {
      best = Math.min(best, t);
    }
  }
  return best;
}

const CARDINALS: Vec2[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.707, 0.707],
  [0.707, -0.707],
  [-0.707, 0.707],
  [-0.707, -0.707],
];

/**
 * From interior samples, every cardinal/diagonal ray should hit a wall within
 * `maxDist` — otherwise the camera can see clearColor through a gap.
 */
function walkBoundsDiagonal(walkBounds: SceneTemplate["walkBounds"]): number {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of walkBounds) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  if (!Number.isFinite(minX)) return 28;
  return Math.hypot(maxX - minX, maxZ - minZ) + 6;
}

export function findEnclosureGaps(
  template: SceneTemplate,
  options?: { maxDist?: number; inset?: number },
): Array<{ from: Vec2; dir: Vec2; dist: number }> {
  const maxDist =
    options?.maxDist ?? Math.max(28, walkBoundsDiagonal(template.walkBounds));
  const samples = sampleInteriorEdgePoints(
    template.walkBounds,
    options?.inset ?? 0.4,
  );
  // Always include spawn and a few interior probes.
  const [sx, , sz] = template.spawn.position;
  const probes: Vec2[] = [[sx, sz], ...samples];
  if (isInsidePolygon([0, 0], template.walkBounds)) {
    probes.push([0, 0]);
  }

  const gaps: Array<{ from: Vec2; dir: Vec2; dist: number }> = [];
  for (const from of probes) {
    if (!isInsidePolygon(from, template.walkBounds)) continue;
    for (const dir of CARDINALS) {
      const dist = rayHitWallDistance(from, dir, template.walls, maxDist);
      if (!Number.isFinite(dist) || dist > maxDist) {
        gaps.push({ from, dir, dist });
      }
    }
  }
  return gaps;
}

export function assertEnclosed(
  template: SceneTemplate,
  options?: { maxDist?: number },
): void {
  const gaps = findEnclosureGaps(template, options);
  if (gaps.length === 0) return;
  const preview = gaps
    .slice(0, 6)
    .map(
      (g) =>
        `(${g.from[0].toFixed(1)},${g.from[1].toFixed(1)}) dir (${g.dir[0]},${g.dir[1]})`,
    )
    .join("; ");
  throw new Error(
    `${template.id}: ${gaps.length} enclosure gap(s) — e.g. ${preview}`,
  );
}
