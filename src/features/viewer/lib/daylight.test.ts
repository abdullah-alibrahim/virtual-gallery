import { describe, expect, it } from "vitest";

import {
  daylightLook,
  isNightLikePeriod,
  nextDaylightPeriod,
} from "./daylight";

describe("daylight", () => {
  it("cycles morning → noon → evening → night → morning", () => {
    expect(nextDaylightPeriod("morning")).toBe("noon");
    expect(nextDaylightPeriod("noon")).toBe("evening");
    expect(nextDaylightPeriod("evening")).toBe("night");
    expect(nextDaylightPeriod("night")).toBe("morning");
  });

  it("marks evening and night as night-like", () => {
    expect(isNightLikePeriod("morning")).toBe(false);
    expect(isNightLikePeriod("noon")).toBe(false);
    expect(isNightLikePeriod("evening")).toBe(true);
    expect(isNightLikePeriod("night")).toBe(true);
  });

  it("gives noon a higher sun and morning a warmer key", () => {
    const morning = daylightLook("morning");
    const noon = daylightLook("noon");
    expect(noon.keyOffset[1]).toBeGreaterThan(morning.keyOffset[1]);
    expect(morning.keyColor.toLowerCase()).toContain("ff");
    expect(noon.floorPolish).toBeGreaterThan(morning.floorPolish);
  });
});
