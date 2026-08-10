import { describe, expect, it } from "vitest";

import {
  assertCanAddArtwork,
  assertCanCreateGallery,
  assertCanInviteMember,
  assertCanUpload,
  canUseTemplateTier,
  limitsForPlan,
} from "@/core/services/enforce-plan-limits";
import { PLAN_LIMITS } from "@/core/services/plan-limits";
import { PlanLimitError } from "@/core/errors";

describe("enforce-plan-limits", () => {
  it("exposes free / pro / studio ceilings", () => {
    expect(limitsForPlan("free").galleries).toBe(PLAN_LIMITS.free.galleries);
    expect(limitsForPlan("pro").storageBytes).toBe(
      PLAN_LIMITS.pro.storageBytes,
    );
  });

  it("blocks a new gallery when the plan is full", () => {
    const limits = limitsForPlan("free");
    expect(() =>
      assertCanCreateGallery(
        { galleries: limits.galleries, artworks: 0, storageBytes: 0 },
        limits,
      ),
    ).toThrow(PlanLimitError);
  });

  it("allows a gallery under the ceiling", () => {
    const limits = limitsForPlan("free");
    expect(() =>
      assertCanCreateGallery(
        { galleries: 0, artworks: 0, storageBytes: 0 },
        limits,
      ),
    ).not.toThrow();
  });

  it("blocks adding artwork past the per-gallery limit", () => {
    const limits = limitsForPlan("free");
    expect(() =>
      assertCanAddArtwork(limits.artworksPerGallery, limits),
    ).toThrow(PlanLimitError);
  });

  it("blocks uploads that would exceed storage", () => {
    const limits = limitsForPlan("free");
    expect(() =>
      assertCanUpload(
        {
          galleries: 1,
          artworks: 1,
          storageBytes: limits.storageBytes - 100,
        },
        limits,
        200,
      ),
    ).toThrow(PlanLimitError);
  });

  it("gates pro templates behind paid plans", () => {
    expect(canUseTemplateTier("free", "pro")).toBe(false);
    expect(canUseTemplateTier("pro", "pro")).toBe(true);
    expect(canUseTemplateTier("free", "free")).toBe(true);
  });

  it("blocks invites past seat limit", () => {
    const limits = limitsForPlan("free");
    expect(() => assertCanInviteMember(limits.seats, limits)).toThrow(
      PlanLimitError,
    );
    expect(() => assertCanInviteMember(0, limits)).not.toThrow();
  });

  it("exposes seats on each plan", () => {
    expect(limitsForPlan("free").seats).toBe(1);
    expect(limitsForPlan("pro").seats).toBe(3);
    expect(limitsForPlan("studio").seats).toBe(10);
  });
});
