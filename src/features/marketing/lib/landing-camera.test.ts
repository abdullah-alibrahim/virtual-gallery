import { describe, expect, it } from "vitest";

import {
  LANDING_LOOK_FOCI,
  landingCameraPosition,
  landingLookTarget,
  smoothstep,
} from "./landing-camera";

describe("landing-camera", () => {
  it("smoothsteps into the blend window", () => {
    expect(smoothstep(0.7, 1, 0.5)).toBe(0);
    expect(smoothstep(0.7, 1, 0.7)).toBe(0);
    expect(smoothstep(0.7, 1, 1)).toBe(1);
    expect(smoothstep(0.7, 1, 0.85)).toBeGreaterThan(0);
    expect(smoothstep(0.7, 1, 0.85)).toBeLessThan(1);
  });

  it("starts facing the north-wall centrepiece", () => {
    const look = landingLookTarget(0);
    expect(look[0]).toBeCloseTo(LANDING_LOOK_FOCI[0]![0], 5);
    expect(look[2]).toBeCloseTo(LANDING_LOOK_FOCI[0]![2], 5);
  });

  it("keeps the camera in front of the show wall", () => {
    for (const t of [0, 4, 12, 40]) {
      const [x, y, z] = landingCameraPosition(t, false);
      expect(Math.abs(x)).toBeLessThan(2.2);
      expect(y).toBeGreaterThan(1.4);
      expect(y).toBeLessThan(1.7);
      // North of room centre — paintings at z≈-5 stay large in frame.
      expect(z).toBeGreaterThan(0.4);
      expect(z).toBeLessThan(2.2);
    }
  });

  it("blends toward the next focus near period end", () => {
    const midHold = landingLookTarget(2);
    const nearBlend = landingLookTarget(8.2);
    expect(midHold[0]).toBeCloseTo(0, 2);
    expect(nearBlend[0]).not.toBeCloseTo(0, 1);
  });
});
