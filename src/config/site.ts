import { PLAN_LIMITS } from "@/core/services/plan-limits";

/**
 * Static product configuration. No secrets — safe to import from anywhere,
 * including client components.
 */
export const siteConfig = {
  name: "Virtual Gallery",
  tagline: "Exhibitions you walk into",
  description:
    "Walkable exhibitions for artists — hang work at museum scale, publish one link, and let collectors enter a real room on any device.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/**
 * Plan catalogue for the pricing page and usage meters. Numeric limits come
 * from the domain (`PLAN_LIMITS` / `PLANS`); only display labels live here for
 * legacy imports — prefer `src/core/billing/plans.ts` for new code.
 */
export const planLimits = {
  free: { label: "Free", ...PLAN_LIMITS.free },
  pro: { label: "Pro", ...PLAN_LIMITS.pro },
  studio: { label: "Studio", ...PLAN_LIMITS.studio },
} as const;

export type PlanId = keyof typeof planLimits;
