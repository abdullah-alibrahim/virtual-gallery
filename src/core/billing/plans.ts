/**
 * SaaS plan catalogue — single source of truth for limits, seats, marketing
 * copy, and feature flags. Numeric ceilings also live in `PLAN_LIMITS` (re-exported
 * here) so enforcement helpers stay pure.
 */

import type { PlanId, WorkspaceLimits } from "@/core/entities";
import { PLAN_LIMITS } from "@/core/services/plan-limits";

export type TemplateTier = "free" | "pro";

export interface PlanDefinition {
  readonly id: PlanId;
  readonly label: string;
  readonly priceMonthlyUsd: number;
  /** Ten months billed yearly (two months free). Zero on Free. */
  readonly priceYearlyUsd: number;
  readonly blurb: string;
  readonly featured: boolean;
  readonly limits: WorkspaceLimits & {
    readonly templateTiers: readonly TemplateTier[];
    readonly analyticsRetentionDays: number;
    readonly seats: number;
  };
  readonly features: readonly string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    label: "Free",
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    blurb: "Publish your first walkable show.",
    featured: false,
    limits: PLAN_LIMITS.free,
    features: [
      "Up to 3 galleries",
      "15 works per gallery",
      "500 MB storage",
      "Free room templates",
      "30-day analytics",
      "1 seat (you)",
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    priceMonthlyUsd: 29,
    priceYearlyUsd: 290,
    blurb: "More rooms, Pro templates, deeper analytics.",
    featured: true,
    limits: PLAN_LIMITS.pro,
    features: [
      "Up to 10 galleries",
      "80 works per gallery",
      "10 GB storage",
      "Free + Pro room templates",
      "1-year analytics",
      "3 team seats",
    ],
  },
  studio: {
    id: "studio",
    label: "Studio",
    priceMonthlyUsd: 99,
    priceYearlyUsd: 990,
    blurb: "Serious volume for working artists and small teams.",
    featured: false,
    limits: PLAN_LIMITS.studio,
    features: [
      "Up to 50 galleries",
      "250 works per gallery",
      "100 GB storage",
      "Custom domain",
      "2-year analytics",
      "10 team seats",
    ],
  },
} as const;

export const PLAN_ORDER: readonly PlanId[] = ["free", "pro", "studio"];

export function planDefinition(plan: PlanId): PlanDefinition {
  return PLANS[plan] ?? PLANS.free;
}

export type BillingInterval = "month" | "year";

export function formatPlanPrice(
  plan: PlanId,
  interval: BillingInterval = "month",
): {
  price: string;
  period: string;
} {
  const def = planDefinition(plan);
  if (def.priceMonthlyUsd <= 0) return { price: "$0", period: "" };
  if (interval === "year") {
    return { price: `$${def.priceYearlyUsd}`, period: "/yr" };
  }
  return { price: `$${def.priceMonthlyUsd}`, period: "/mo" };
}

/** Comparison rows for the pricing table. */
export const PLAN_COMPARISON_ROWS: readonly {
  readonly label: string;
  readonly values: Record<PlanId, string>;
}[] = [
  {
    label: "Galleries",
    values: {
      free: String(PLAN_LIMITS.free.galleries),
      pro: String(PLAN_LIMITS.pro.galleries),
      studio: String(PLAN_LIMITS.studio.galleries),
    },
  },
  {
    label: "Works per gallery",
    values: {
      free: String(PLAN_LIMITS.free.artworksPerGallery),
      pro: String(PLAN_LIMITS.pro.artworksPerGallery),
      studio: String(PLAN_LIMITS.studio.artworksPerGallery),
    },
  },
  {
    label: "Storage",
    values: {
      free: "500 MB",
      pro: "10 GB",
      studio: "100 GB",
    },
  },
  {
    label: "Templates",
    values: {
      free: "Free rooms",
      pro: "Free + Pro",
      studio: "Free + Pro",
    },
  },
  {
    label: "Team seats",
    values: {
      free: String(PLAN_LIMITS.free.seats),
      pro: String(PLAN_LIMITS.pro.seats),
      studio: String(PLAN_LIMITS.studio.seats),
    },
  },
  {
    label: "Custom domain",
    values: {
      free: "—",
      pro: "—",
      studio: "Included",
    },
  },
  {
    label: "Analytics retention",
    values: {
      free: "30 days",
      pro: "1 year",
      studio: "2 years",
    },
  },
];
