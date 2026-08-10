import { describe, expect, it } from "vitest";

import {
  isWalkLikeQuality,
  shouldUseFloorReflection,
  shouldUseGalleryEnvironment,
  shouldUsePolishedFloor,
  shouldUsePostprocessing,
  shouldUseSoftShadows,
} from "./gallery-quality";

describe("gallery-quality", () => {
  it("treats walk and marketing as polished tiers", () => {
    expect(isWalkLikeQuality("walk")).toBe(true);
    expect(isWalkLikeQuality("marketing")).toBe(true);
    expect(isWalkLikeQuality("edit")).toBe(false);
    expect(isWalkLikeQuality("mobile")).toBe(false);

    // PCSS SoftShadows disabled — Three r185 lacks unpackRGBAToDepth.
    expect(shouldUseSoftShadows("walk")).toBe(false);
    expect(shouldUseSoftShadows("marketing")).toBe(false);
    expect(shouldUseSoftShadows("edit")).toBe(false);
    expect(shouldUseSoftShadows("mobile")).toBe(false);
    expect(shouldUseGalleryEnvironment("walk")).toBe(true);
    expect(shouldUseGalleryEnvironment("marketing")).toBe(true);
    expect(shouldUseGalleryEnvironment("mobile")).toBe(false);
  });

  it("disables MeshReflector floors (shader crash) but keeps polished StandardMaterial", () => {
    expect(shouldUseFloorReflection("walk", "museum")).toBe(false);
    expect(shouldUseFloorReflection("marketing", "museum")).toBe(false);
    expect(shouldUsePolishedFloor("walk", "museum")).toBe(true);
    expect(shouldUsePolishedFloor("marketing", "museum")).toBe(true);
    expect(shouldUsePolishedFloor("walk", "luxury")).toBe(true);
    expect(shouldUsePolishedFloor("walk", "industrial")).toBe(false);
    expect(shouldUsePolishedFloor("edit", "museum")).toBe(false);
    expect(shouldUsePolishedFloor("mobile", "museum")).toBe(false);
  });

  it("disables postprocessing for edit and reduced motion", () => {
    expect(shouldUsePostprocessing("walk", false)).toBe(true);
    expect(shouldUsePostprocessing("marketing", false)).toBe(true);
    expect(shouldUsePostprocessing("mobile", false)).toBe(true);
    expect(shouldUsePostprocessing("edit", false)).toBe(false);
    expect(shouldUsePostprocessing("walk", true)).toBe(false);
  });
});
