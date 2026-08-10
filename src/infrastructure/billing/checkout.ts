/**
 * Creates a Stripe Checkout session for upgrading a workspace plan.
 */

import { siteConfig } from "@/config/site";
import { ForbiddenError, ValidationError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import {
  getStripe,
  isStripeConfigured,
  priceIdForPlan,
} from "./stripe";

export async function createCheckoutSession(input: {
  uid: string;
  workspaceId: string;
  plan: "pro" | "studio";
  email: string;
}): Promise<{ url: string }> {
  if (!isStripeConfigured()) {
    throw new ValidationError(
      "Billing is not configured yet. Set Stripe env vars to enable upgrades.",
    );
  }

  const db = getAdminDb();
  const member = await db
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();
  if (!member.exists || member.data()?.role !== "owner") {
    throw new ForbiddenError("Only the workspace owner can manage billing");
  }

  const workspace = await db.collection("workspaces").doc(input.workspaceId).get();
  const billing = workspace.data()?.billing as
    | { stripeCustomerId?: string }
    | undefined;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: billing?.stripeCustomerId || undefined,
    customer_email: billing?.stripeCustomerId ? undefined : input.email,
    line_items: [{ price: priceIdForPlan(input.plan), quantity: 1 }],
    success_url: `${siteConfig.url}/settings/billing?checkout=success`,
    cancel_url: `${siteConfig.url}/settings/billing?checkout=cancel`,
    metadata: {
      workspaceId: input.workspaceId,
      uid: input.uid,
      plan: input.plan,
    },
    subscription_data: {
      metadata: {
        workspaceId: input.workspaceId,
        plan: input.plan,
      },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new ValidationError("Could not start checkout");
  }
  return { url: session.url };
}

export async function createBillingPortalSession(input: {
  uid: string;
  workspaceId: string;
}): Promise<{ url: string }> {
  if (!isStripeConfigured()) {
    throw new ValidationError("Billing is not configured yet");
  }

  const db = getAdminDb();
  const member = await db
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();
  if (!member.exists || member.data()?.role !== "owner") {
    throw new ForbiddenError("Only the workspace owner can manage billing");
  }

  const workspace = await db.collection("workspaces").doc(input.workspaceId).get();
  const customerId = workspace.data()?.billing?.stripeCustomerId as
    | string
    | undefined;
  if (!customerId) {
    throw new ValidationError("No billing account yet — upgrade first");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteConfig.url}/settings/billing`,
  });
  return { url: session.url };
}
