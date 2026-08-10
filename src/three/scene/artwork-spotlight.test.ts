import { describe, expect, it } from "vitest";

import {
  ARTWORK_SPOT_INTENSITY_SCALE,
  clampSpotlightAngle,
  spotlightThrowDistance,
} from "./artwork-spotlight";

describe("artwork-spotlight", () => {
  it("keeps museum cone angles readable under ACES", () => {
    expect(clampSpotlightAngle(0.1)).toBe(0.32);
    expect(clampSpotlightAngle(Math.PI / 6)).toBeCloseTo(Math.PI / 6, 5);
    expect(clampSpotlightAngle(1.4)).toBe(0.88);
  });

  it("scales throw with canvas size", () => {
    expect(spotlightThrowDistance(1, 1)).toBeCloseTo(3.2, 5);
    expect(spotlightThrowDistance(2, 1)).toBeGreaterThan(
      spotlightThrowDistance(1, 1),
    );
  });

  it("uses a soft intensity scale (frame/wall pool, not canvas crush)", () => {
    expect(ARTWORK_SPOT_INTENSITY_SCALE).toBeGreaterThan(1.5);
    expect(ARTWORK_SPOT_INTENSITY_SCALE).toBeLessThan(2.5);
  });
});
