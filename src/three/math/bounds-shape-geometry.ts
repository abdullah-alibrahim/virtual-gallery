/**
 * Walk-bounds → horizontal ShapeGeometry with metre-based UVs.
 *
 * THREE.Shape lives in XY; we promote it to the XZ plane with Z preserved
 * (not the common rotateX(-π/2) path, which mirrors Z and leaves gray void
 * under asymmetric / multi-room plans).
 */

import { Path, Shape, ShapeGeometry } from "three";

import type { SceneTemplate } from "@/core/entities";

/** Plank / plaster tile density when UVs are baked in metres. */
export const SURFACE_UV_PER_METER = 0.45;

export type BoundsShapeFacing = "up" | "down";

/**
 * Build a floor (facing up) or ceiling (facing down) mesh from walkBounds.
 * UVs are world metres × `uvPerMeter` so texture.repeat can stay at (1,1).
 */
export function createBoundsShapeGeometry(
  walkBounds: SceneTemplate["walkBounds"],
  opts: {
    facing?: BoundsShapeFacing;
    uvPerMeter?: number;
    /** Optional axis-aligned rectangular hole (skylight well), metres in XZ. */
    hole?: {
      readonly centerX: number;
      readonly centerZ: number;
      readonly width: number;
      readonly depth: number;
    };
  } = {},
): ShapeGeometry {
  const facing = opts.facing ?? "up";
  const uvPerMeter = opts.uvPerMeter ?? SURFACE_UV_PER_METER;
  const shape = buildWalkBoundsShape(walkBounds);

  if (opts.hole) {
    const { centerX, centerZ, width, depth } = opts.hole;
    const hw = width / 2;
    const hd = depth / 2;
    const hole = new Path();
    // Opposite winding from the outer path so Three punches a hole.
    hole.moveTo(centerX - hw, centerZ - hd);
    hole.lineTo(centerX - hw, centerZ + hd);
    hole.lineTo(centerX + hw, centerZ + hd);
    hole.lineTo(centerX + hw, centerZ - hd);
    hole.closePath();
    shape.holes.push(hole);
  }

  return finishBoundsShapeGeometry(new ShapeGeometry(shape), facing, uvPerMeter);
}

function buildWalkBoundsShape(
  walkBounds: SceneTemplate["walkBounds"],
): Shape {
  const shape = new Shape();
  if (walkBounds.length < 3) {
    shape.moveTo(-4, -4);
    shape.lineTo(4, -4);
    shape.lineTo(4, 4);
    shape.lineTo(-4, 4);
    shape.closePath();
    return shape;
  }
  const first = walkBounds[0]!;
  shape.moveTo(first[0], first[1]);
  for (let i = 1; i < walkBounds.length; i++) {
    const p = walkBounds[i]!;
    shape.lineTo(p[0], p[1]);
  }
  shape.closePath();
  return shape;
}

export function finishBoundsShapeGeometry(
  geometry: ShapeGeometry,
  facing: BoundsShapeFacing,
  uvPerMeter: number,
): ShapeGeometry {
  const pos = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  if (!pos) return geometry;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    // Shape Y was authored as walkBounds Z — keep Z, lay onto XZ.
    const z = pos.getY(i);
    pos.setXYZ(i, x, 0, z);
    if (uv) {
      uv.setXY(i, x * uvPerMeter, z * uvPerMeter);
    }
  }
  pos.needsUpdate = true;
  if (uv) uv.needsUpdate = true;

  // XY→XZ flips winding (normals land on −Y). Floor wants +Y; ceiling −Y.
  if (facing === "up") {
    reverseIndexWinding(geometry);
  }

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function reverseIndexWinding(geometry: ShapeGeometry): void {
  const index = geometry.getIndex();
  if (!index) return;
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const c = index.getX(i + 2);
    index.setX(i, c);
    index.setX(i + 2, a);
  }
  index.needsUpdate = true;
}
