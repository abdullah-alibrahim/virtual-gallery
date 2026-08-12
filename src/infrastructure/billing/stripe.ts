/**
 * Stripe client + Checkout / Customer Portal helpers.
 * When keys are missing, billing APIs return a clear “not configured” error
 * so local/dev keeps working without Stripe.
 */

import Stripe from "stripe";

import type { PlanId } from "@/core/entities";
import type { BillingInterval } from "@/core/billing/plans";

let stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_PRO &&
      process.env.STRIPE_PRICE_STUDIO,
  );
}

export function isYearlyStripeConfigured(): boolean {
  return Boolean(
    isStripeConfigured() &&
      process.env.STRIPE_PRICE_PRO_YEARLY &&
      process.env.STRIPE_PRICE_STUDIO_YEARLY,
  );
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    });
  }
  return stripe;
}

export function priceIdForPlan(
  plan: Exclude<PlanId, "free">,
  interval: BillingInterval = "month",
): string {
  const id =
    interval === "year"
      ? plan === "pro"
        ? process.env.STRIPE_PRICE_PRO_YEARLY
        : process.env.STRIPE_PRICE_STUDIO_YEARLY
      : plan === "pro"
        ? process.env.STRIPE_PRICE_PRO
        : process.env.STRIPE_PRICE_STUDIO;
  if (!id) throw new Error(`Missing Stripe price for ${plan} (${interval})`);
  return id;
}

export function planFromPriceId(priceId: string): PlanId | null {
  if (
    priceId === process.env.STRIPE_PRICE_PRO ||
    priceId === process.env.STRIPE_PRICE_PRO_YEARLY
  ) {
    return "pro";
  }
  if (
    priceId === process.env.STRIPE_PRICE_STUDIO ||
    priceId === process.env.STRIPE_PRICE_STUDIO_YEARLY
  ) {
    return "studio";
  }
  return null;
}
