import { describe, expect, it } from "vitest";

import {
  clamp,
  distance,
  fitScale,
  isInsidePolygon,
  normalize,
  projectOntoWall,
  yawFromNormal,
} from "@/three/math/geometry";

describe("geometry", () => {
  it("normalizes a vector to unit length", () => {
    const n = normalize([3, 0, 4]);
    expect(n[0]).toBeCloseTo(0.6);
    expect(n[1]).toBe(0);
    expect(n[2]).toBeCloseTo(0.8);
  });

  it("returns zero for a zero-length vector", () => {
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("computes distance between points", () => {
    expect(distance([0, 0, 0], [3, 4, 0])).toBe(5);
  });

  it("clamps values into a range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("derives yaw from a wall normal", () => {
    expect(yawFromNormal([0, 0, 1])).toBeCloseTo(0);
    expect(yawFromNormal([1, 0, 0])).toBeCloseTo(Math.PI / 2);
  });

  it("never upscales when fitting into a larger slot", () => {
    expect(fitScale(0.5, 0.5, 3, 3)).toBe(1);
  });

  it("downscales when the artwork exceeds the slot", () => {
    const scale = fitScale(4, 2, 2, 2, 1);
    expect(scale).toBeCloseTo(0.5);
  });

  it("detects points inside a rectangular walk bound", () => {
    const square: Array<readonly [number, number]> = [
      [-4, -4],
      [4, -4],
      [4, 4],
      [-4, 4],
    ];
    expect(isInsidePolygon([0, 0], square)).toBe(true);
    expect(isInsidePolygon([5, 0], square)).toBe(false);
    expect(isInsidePolygon([0, 0], [])).toBe(false);
  });

  it("projects a world point onto a wall plane and clamps to extents", () => {
    const projected = projectOntoWall(
      [10, 5, 2],
      [0, 0, 0],
      [0, 0, 1],
      2,
      3,
    );
    // Horizontal clamped to ±2, Y clamped to [0, 3], Z on the plane (= 0).
    expect(projected[0]).toBeCloseTo(2);
    expect(projected[1]).toBeCloseTo(3);
    expect(projected[2]).toBeCloseTo(0);
  });
});
