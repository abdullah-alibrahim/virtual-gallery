import { describe, expect, it } from "vitest";

import {
  aspectRatio,
  convertUnit,
  createDimensions,
  estimateFromPixels,
  formatDimensions,
  toMetres,
} from "@/core/value-objects/dimensions";
import { ValidationError } from "@/core/errors";

describe("dimensions", () => {
  it("converts centimetres to metres for the renderer", () => {
    const d = createDimensions(120, 90, "cm");
    expect(toMetres(d)).toEqual({ width: 1.2, height: 0.9, depth: 0 });
  });

  it("converts inches to metres", () => {
    const d = createDimensions(40, 30, "in");
    const m = toMetres(d);
    expect(m.width).toBeCloseTo(1.016, 3);
    expect(m.height).toBeCloseTo(0.762, 3);
  });

  it("rejects non-positive sizes", () => {
    expect(() => createDimensions(0, 10, "cm")).toThrow(ValidationError);
  });

  it("estimates print size from pixels at 300 DPI", () => {
    // 3543 × 2657 px ≈ 30 × 22 cm at 300 DPI
    const d = estimateFromPixels(3543, 2657);
    expect(d.unit).toBe("cm");
    expect(d.width).toBe(30);
    expect(d.height).toBe(22);
  });

  it("round-trips unit conversion", () => {
    const cm = createDimensions(100, 80, "cm");
    const inches = convertUnit(cm, "in");
    expect(inches.unit).toBe("in");
    const back = convertUnit(inches, "cm");
    expect(back.width).toBeCloseTo(100, 0);
    expect(back.height).toBeCloseTo(80, 0);
  });

  it("formats for the inspector", () => {
    expect(formatDimensions(createDimensions(120, 90, "cm"))).toBe(
      "120 × 90 cm",
    );
    expect(formatDimensions(createDimensions(120, 90, "cm"), "ar")).toBe(
      "120 × 90 سم",
    );
  });

  it("computes aspect ratio", () => {
    expect(aspectRatio(createDimensions(120, 90, "cm"))).toBeCloseTo(1.333, 2);
  });
});
