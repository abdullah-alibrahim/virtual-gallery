import { describe, expect, it } from "vitest";

import { footstepIntervalMs } from "./webaudio-ambience";

describe("footstepIntervalMs", () => {
  it("slows the cadence for a quiet stroll", () => {
    const slow = footstepIntervalMs(0.008, false);
    const brisk = footstepIntervalMs(0.03, false);
    expect(slow).toBeGreaterThan(brisk);
    expect(slow).toBeLessThanOrEqual(620);
    expect(brisk).toBeGreaterThanOrEqual(360);
  });

  it("adds a little space between steps at night", () => {
    const day = footstepIntervalMs(0.015, false);
    const night = footstepIntervalMs(0.015, true);
    expect(night).toBeGreaterThan(day);
  });
});
