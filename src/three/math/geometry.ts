/**
 * Pure geometry helpers shared by the editor and the viewer.
 *
 * No React, no Three.js objects — plain tuples in and out — so wall snapping
 * and fitting logic is unit-testable without a WebGL context.
 */

export type Vec3 = readonly [number, number, number];
export type Vec2 = readonly [number, number];

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale(v: Vec3, factor: number): Vec3 {
  return [v[0] * factor, v[1] * factor, v[2] * factor];
}

export function length(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

export function distance(a: Vec3, b: Vec3): number {
  return length(subtract(a, b));
}

export function normalize(v: Vec3): Vec3 {
  const len = length(v);
  return len === 0 ? [0, 0, 0] : scale(v, 1 / len);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Yaw needed to face along a wall's outward normal. Walls are vertical in v1,
 * so pitch and roll stay zero and artwork can never tilt off the wall.
 */
export function yawFromNormal(normal: Vec3): number {
  return Math.atan2(normal[0], normal[2]);
}

/**
 * Uniform scale that fits `width × height` inside `maxWidth × maxHeight` with a
 * margin. Never exceeds 1 — a small study must not be blown up into a mural.
 */
export function fitScale(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
  margin = 0.92,
): number {
  if (width <= 0 || height <= 0) return 0;
  return Math.min(1, (maxWidth * margin) / width, (maxHeight * margin) / height);
}

/**
 * Even-odd point-in-polygon test against a template's `walkBounds`.
 *
 * This is the viewer's collision check: the player's next position is only
 * accepted when it stays inside the walkable floor, which stops visitors from
 * walking through walls without needing a physics engine.
 */
export function isInsidePolygon(point: Vec2, polygon: readonly Vec2[]): boolean {
  if (polygon.length < 3) return false;

  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (!a || !b) continue;

    const [xi, yi] = a;
    const [xj, yj] = b;

    const straddles = yi > y !== yj > y;
    if (straddles) {
      const t = (y - yi) / (yj - yi);
      if (x < xi + t * (xj - xi)) inside = !inside;
    }
  }

  return inside;
}

/**
 * Projects a world position onto a wall plane, clamped to the wall's extent.
 * Used when the artist drags an artwork: the pointer ray gives a rough world
 * point, and this snaps it onto the wall surface within bounds.
 */
export function projectOntoWall(
  worldPoint: Vec3,
  wallOrigin: Vec3,
  wallNormal: Vec3,
  halfWidth: number,
  height: number,
): Vec3 {
  const n = normalize(wallNormal);
  const toPoint = subtract(worldPoint, wallOrigin);

  // Distance along the normal, removed so the point lies on the plane.
  const alongNormal = toPoint[0] * n[0] + toPoint[1] * n[1] + toPoint[2] * n[2];
  const onPlane = subtract(toPoint, scale(n, alongNormal));

  // Horizontal axis of the wall = normal rotated 90° about Y.
  const right: Vec3 = normalize([n[2], 0, -n[0]]);
  const horizontal = onPlane[0] * right[0] + onPlane[2] * right[2];

  const clampedH = clamp(horizontal, -halfWidth, halfWidth);
  const clampedY = clamp(onPlane[1], 0, height);

  return add(wallOrigin, add(scale(right, clampedH), [0, clampedY, 0]));
}
