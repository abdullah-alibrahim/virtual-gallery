import { describe, expect, it } from "vitest";

import {
  PLAN_COMPARISON_ROWS,
  PLAN_ORDER,
  formatPlanPrice,
  planDefinition,
} from "@/core/billing/plans";
import { PLAN_LIMITS } from "@/core/services/plan-limits";

describe("plans catalogue", () => {
  it("keeps Free / Pro / Studio aligned with PLAN_LIMITS", () => {
    for (const id of PLAN_ORDER) {
      const def = planDefinition(id);
      expect(def.limits.galleries).toBe(PLAN_LIMITS[id].galleries);
      expect(def.limits.seats).toBe(PLAN_LIMITS[id].seats);
      expect(def.limits.artworksPerGallery).toBe(
        PLAN_LIMITS[id].artworksPerGallery,
      );
    }
  });

  it("formats prices for marketing", () => {
    expect(formatPlanPrice("free")).toEqual({ price: "$0", period: "" });
    expect(formatPlanPrice("pro")).toEqual({ price: "$29", period: "/mo" });
    expect(formatPlanPrice("studio")).toEqual({ price: "$99", period: "/mo" });
    expect(formatPlanPrice("pro", "year")).toEqual({
      price: "$290",
      period: "/yr",
    });
    expect(formatPlanPrice("studio", "year")).toEqual({
      price: "$990",
      period: "/yr",
    });
  });

  it("gives two months free on yearly Pro and Studio", () => {
    expect(planDefinition("pro").priceYearlyUsd).toBe(
      planDefinition("pro").priceMonthlyUsd * 10,
    );
    expect(planDefinition("studio").priceYearlyUsd).toBe(
      planDefinition("studio").priceMonthlyUsd * 10,
    );
  });

  it("exposes a comparison matrix", () => {
    expect(PLAN_COMPARISON_ROWS.length).toBeGreaterThan(3);
    for (const row of PLAN_COMPARISON_ROWS) {
      expect(row.values.free).toBeTruthy();
      expect(row.values.pro).toBeTruthy();
      expect(row.values.studio).toBeTruthy();
    }
  });
});
