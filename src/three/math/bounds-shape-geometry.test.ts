import { describe, expect, it } from "vitest";

import {
  createBoundsShapeGeometry,
  SURFACE_UV_PER_METER,
} from "./bounds-shape-geometry";

describe("createBoundsShapeGeometry", () => {
  it("lays the polygon onto XZ with walkBounds Z preserved (no mirror)", () => {
    const walkBounds = [
      [-5.7, -4.7],
      [4.7, -4.7],
      [4.7, 3.7],
      [1.35, 3.7],
      [1.35, 0.7],
      [-5.7, 0.7],
    ] as const;

    const geometry = createBoundsShapeGeometry(walkBounds, { facing: "up" });
    const pos = geometry.getAttribute("position");
    expect(pos).toBeTruthy();

    const corners = new Set<string>();
    for (let i = 0; i < pos!.count; i++) {
      const y = pos!.getY(i);
      expect(Math.abs(y)).toBeLessThan(1e-6);
      corners.add(
        `${pos!.getX(i).toFixed(2)},${pos!.getZ(i).toFixed(2)}`,
      );
    }

    for (const [x, z] of walkBounds) {
      expect(corners.has(`${x.toFixed(2)},${z.toFixed(2)}`)).toBe(true);
    }
    // Mirrored Z must not appear as the only coverage for +Z rooms.
    expect(corners.has("-5.70,4.70")).toBe(false);
  });

  it("bakes metre UVs so every vertex tiles across the full polygon", () => {
    const walkBounds = [
      [-4.4, -4.4],
      [4.4, -4.4],
      [4.4, 4.4],
      [-4.4, 4.4],
    ] as const;
    const geometry = createBoundsShapeGeometry(walkBounds, {
      facing: "up",
      uvPerMeter: SURFACE_UV_PER_METER,
    });
    const pos = geometry.getAttribute("position");
    const uv = geometry.getAttribute("uv");
    expect(pos && uv).toBeTruthy();

    for (let i = 0; i < pos!.count; i++) {
      const x = pos!.getX(i);
      const z = pos!.getZ(i);
      expect(uv!.getX(i)).toBeCloseTo(x * SURFACE_UV_PER_METER, 5);
      expect(uv!.getY(i)).toBeCloseTo(z * SURFACE_UV_PER_METER, 5);
    }
  });

  it("orients floor normals upward", () => {
    const geometry = createBoundsShapeGeometry(
      [
        [-2, -2],
        [2, -2],
        [2, 2],
        [-2, 2],
      ],
      { facing: "up" },
    );
    const norm = geometry.getAttribute("normal");
    expect(norm).toBeTruthy();
    expect(norm!.getY(0)).toBeGreaterThan(0.9);
  });

  it("orients ceiling normals downward", () => {
    const geometry = createBoundsShapeGeometry(
      [
        [-2, -2],
        [2, -2],
        [2, 2],
        [-2, 2],
      ],
      { facing: "down" },
    );
    const norm = geometry.getAttribute("normal");
    expect(norm).toBeTruthy();
    expect(norm!.getY(0)).toBeLessThan(-0.9);
  });

  it("punches an axis-aligned rectangular skylight hole", () => {
    const geometry = createBoundsShapeGeometry(
      [
        [-5, -5],
        [5, -5],
        [5, 5],
        [-5, 5],
      ],
      {
        facing: "down",
        hole: { centerX: 0, centerZ: 0, width: 4, depth: 6 },
      },
    );
    const pos = geometry.getAttribute("position");
    expect(pos).toBeTruthy();
    // Hole corners should appear among vertices.
    const corners = new Set<string>();
    for (let i = 0; i < pos!.count; i++) {
      corners.add(`${pos!.getX(i).toFixed(1)},${pos!.getZ(i).toFixed(1)}`);
    }
    expect(corners.has("-2.0,-3.0")).toBe(true);
    expect(corners.has("2.0,3.0")).toBe(true);
    // Outer quad (4) + hole quad (4); triangulation reuses these verts.
    expect(pos!.count).toBeGreaterThanOrEqual(8);
  });
});
