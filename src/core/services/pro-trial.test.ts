import { describe, expect, it } from "vitest";

import { canUseTemplateTier } from "@/core/services/enforce-plan-limits";
import {
  coerceDate,
  isProductTrial,
  isProTrialActive,
  productTrialBilling,
  proTrialDaysLeft,
  shouldExpireProTrial,
  shouldGrantProTrial,
  trialPeriodEnd,
  PRO_TRIAL_DAYS,
} from "@/core/services/pro-trial";

const NOW = new Date("2026-08-13T00:00:00.000Z");

describe("pro-trial", () => {
  it("lasts 14 days", () => {
    expect(PRO_TRIAL_DAYS).toBe(14);
    const end = trialPeriodEnd(NOW);
    expect(end.toISOString()).toBe("2026-08-27T00:00:00.000Z");
  });

  it("grants a trial only to Free workspaces with no billing row", () => {
    expect(shouldGrantProTrial("free", null)).toBe(true);
    expect(shouldGrantProTrial("pro", null)).toBe(false);
    expect(
      shouldGrantProTrial("free", {
        status: "canceled",
        subscriptionId: null,
        periodEnd: NOW,
      }),
    ).toBe(false);
  });

  it("treats empty-subscription trialing as a product trial", () => {
    expect(
      isProductTrial({
        status: "trialing",
        subscriptionId: null,
        periodEnd: trialPeriodEnd(NOW),
      }),
    ).toBe(true);
    expect(
      isProductTrial({
        status: "trialing",
        subscriptionId: "sub_123",
        periodEnd: trialPeriodEnd(NOW),
      }),
    ).toBe(false);
  });

  it("counts remaining days and expires at periodEnd", () => {
    const billing = productTrialBilling(trialPeriodEnd(NOW));
    expect(isProTrialActive(billing, NOW)).toBe(true);
    expect(proTrialDaysLeft(billing, NOW)).toBe(14);
    expect(
      proTrialDaysLeft(billing, new Date("2026-08-26T12:00:00.000Z")),
    ).toBe(1);
    expect(shouldExpireProTrial(billing, trialPeriodEnd(NOW))).toBe(true);
    expect(isProTrialActive(billing, trialPeriodEnd(NOW))).toBe(false);
  });

  it("coerces Firestore-like timestamps", () => {
    const iso = "2026-08-20T00:00:00.000Z";
    expect(coerceDate(iso)?.toISOString()).toBe(iso);
    expect(coerceDate({ seconds: Date.parse(iso) / 1000 })?.toISOString()).toBe(
      iso,
    );
    expect(
      coerceDate({ toDate: () => new Date(iso) })?.toISOString(),
    ).toBe(iso);
    expect(coerceDate(null)).toBeNull();
  });

  it("unlocks Pro rooms while the trial is modeled as plan=pro", () => {
    expect(canUseTemplateTier("pro", "pro")).toBe(true);
    expect(canUseTemplateTier("free", "pro")).toBe(false);
  });
});
