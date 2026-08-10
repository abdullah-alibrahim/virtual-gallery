import { describe, expect, it } from "vitest";

import { canUseTemplateTier } from "@/core/services/enforce-plan-limits";

describe("canUseTemplateTier", () => {
  it("gates Luxury and Industrial behind Pro", () => {
    expect(canUseTemplateTier("free", "free")).toBe(true);
    expect(canUseTemplateTier("free", "pro")).toBe(false);
    expect(canUseTemplateTier("pro", "pro")).toBe(true);
    expect(canUseTemplateTier("studio", "pro")).toBe(true);
  });
});
