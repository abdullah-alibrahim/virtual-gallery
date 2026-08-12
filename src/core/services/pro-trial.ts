/**
 * Product Pro trial (14 days, no card). Distinct from Stripe `trialing`:
 * Checkout never sets `trial_period_days` — converting still goes through Stripe.
 */

import type { PlanId, WorkspaceBilling } from "@/core/entities";

export const PRO_TRIAL_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export type BillingLike = {
  readonly status?: string | null;
  readonly subscriptionId?: string | null;
  readonly stripeCustomerId?: string | null;
  readonly periodEnd?: unknown;
} | null;

export function coerceDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object") {
    const withToDate = value as { toDate?: unknown };
    if (typeof withToDate.toDate === "function") {
      try {
        const parsed = (withToDate.toDate as () => Date)();
        return parsed instanceof Date && !Number.isNaN(parsed.getTime())
          ? parsed
          : null;
      } catch {
        return null;
      }
    }
    const seconds = (value as { seconds?: unknown }).seconds;
    if (typeof seconds === "number" && Number.isFinite(seconds)) {
      return new Date(seconds * 1000);
    }
  }
  return null;
}

export function trialPeriodEnd(from: Date = new Date()): Date {
  return new Date(from.getTime() + PRO_TRIAL_DAYS * DAY_MS);
}

/** Local 14-day Pro — empty Stripe subscription, not a Checkout trial. */
export function isProductTrial(billing: BillingLike): boolean {
  if (!billing || billing.status !== "trialing") return false;
  return !billing.subscriptionId;
}

export function isProTrialActive(
  billing: BillingLike,
  now: Date = new Date(),
): boolean {
  if (!isProductTrial(billing)) return false;
  const end = coerceDate(billing?.periodEnd);
  if (!end) return false;
  return end.getTime() > now.getTime();
}

export function proTrialDaysLeft(
  billing: BillingLike,
  now: Date = new Date(),
): number {
  if (!isProTrialActive(billing, now)) return 0;
  const end = coerceDate(billing?.periodEnd);
  if (!end) return 0;
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY_MS));
}

/** Existing Free accounts with no billing row get one product trial. */
export function shouldGrantProTrial(
  plan: PlanId,
  billing: BillingLike,
): boolean {
  return plan === "free" && billing == null;
}

export function shouldExpireProTrial(
  billing: BillingLike,
  now: Date = new Date(),
): boolean {
  if (!isProductTrial(billing)) return false;
  return !isProTrialActive(billing, now);
}

export function productTrialBilling(
  periodEnd: Date,
): Pick<
  WorkspaceBilling,
  "stripeCustomerId" | "subscriptionId" | "status" | "periodEnd"
> {
  return {
    stripeCustomerId: "",
    subscriptionId: null,
    status: "trialing",
    periodEnd,
  };
}
