import type { PlanId, WorkspaceLimits } from "@/core/entities";

/**
 * Plan limits are domain rules, not UI configuration. They live here so
 * `enforcePlanLimits` stays pure and so the same numbers gate the upload
 * callable, the editor, and the billing page.
 *
 * Marketing labels / prices live in `src/core/billing/plans.ts`.
 */
export const PLAN_LIMITS: Record<
  PlanId,
  WorkspaceLimits & {
    readonly templateTiers: readonly ("free" | "pro")[];
    readonly analyticsRetentionDays: number;
  }
> = {
  free: {
    galleries: 3,
    artworksPerGallery: 15,
    storageBytes: 500 * 1024 * 1024,
    customDomain: false,
    seats: 1,
    templateTiers: ["free"],
    analyticsRetentionDays: 30,
  },
  pro: {
    galleries: 10,
    artworksPerGallery: 80,
    storageBytes: 10 * 1024 * 1024 * 1024,
    customDomain: false,
    seats: 3,
    templateTiers: ["free", "pro"],
    analyticsRetentionDays: 365,
  },
  studio: {
    galleries: 50,
    artworksPerGallery: 250,
    storageBytes: 100 * 1024 * 1024 * 1024,
    customDomain: true,
    seats: 10,
    templateTiers: ["free", "pro"],
    analyticsRetentionDays: 730,
  },
} as const;
