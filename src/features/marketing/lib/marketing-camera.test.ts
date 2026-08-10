import { describe, expect, it } from "vitest";

import { softMuseumTemplate, modernWhiteTemplate } from "@/core/templates";

import {
  marketingCameraPosition,
  marketingLookTarget,
} from "./marketing-camera";

describe("marketing-camera", () => {
  it("reuses Soft Museum hero path for landing mode", () => {
    const pos = marketingCameraPosition(softMuseumTemplate, "hero", 0, false);
    expect(pos[1]).toBeGreaterThan(1.4);
    expect(pos[2]).toBeGreaterThan(0.5);
    const look = marketingLookTarget(softMuseumTemplate, "hero", 0);
    expect(look[2]).toBeLessThan(0);
  });

  it("returns finite orbit / static cameras for other templates", () => {
    for (const mode of ["orbit", "static"] as const) {
      const pos = marketingCameraPosition(modernWhiteTemplate, mode, 2.5, true);
      const look = marketingLookTarget(modernWhiteTemplate, mode, 2.5);
      expect(pos.every(Number.isFinite)).toBe(true);
      expect(look.every(Number.isFinite)).toBe(true);
    }
  });
});
