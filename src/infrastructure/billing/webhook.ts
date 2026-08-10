/**
 * Handles Stripe webhooks — subscription lifecycle → workspace plan.
 */

import type Stripe from "stripe";

import { getAdminDb } from "@/infrastructure/firebase/admin";
import {
  applyWorkspacePlan,
  planFromSubscriptionItems,
} from "./apply-plan";
import { getStripe } from "./stripe";

export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
): Promise<void> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId || !session.subscription || !session.customer) break;

      const sub = await stripe.subscriptions.retrieve(
        String(session.subscription),
      );
      await syncSubscription(workspaceId, sub, String(session.customer));
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId =
        sub.metadata?.workspaceId ??
        (await workspaceIdForCustomer(String(sub.customer)));
      if (!workspaceId) break;
      await syncSubscription(workspaceId, sub, String(sub.customer));
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId =
        sub.metadata?.workspaceId ??
        (await workspaceIdForCustomer(String(sub.customer)));
      if (!workspaceId) break;
      await applyWorkspacePlan({
        workspaceId,
        plan: "free",
        stripeCustomerId: String(sub.customer),
        subscriptionId: null,
        status: "canceled",
        periodEnd: null,
      });
      break;
    }
    default:
      break;
  }
}

async function syncSubscription(
  workspaceId: string,
  sub: Stripe.Subscription,
  customerId: string,
): Promise<void> {
  const plan = planFromSubscriptionItems(sub.items.data);
  const status = mapStatus(sub.status);
  const periodEndSec = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const periodEnd =
    typeof periodEndSec === "number" ? new Date(periodEndSec * 1000) : null;

  await applyWorkspacePlan({
    workspaceId,
    plan: status === "canceled" ? "free" : plan,
    stripeCustomerId: customerId,
    subscriptionId: sub.id,
    status,
    periodEnd,
  });
}

function mapStatus(
  status: Stripe.Subscription.Status,
): "active" | "past_due" | "canceled" | "trialing" {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "past_due";
  return "canceled";
}

async function workspaceIdForCustomer(
  customerId: string,
): Promise<string | null> {
  const snap = await getAdminDb()
    .collection("workspaces")
    .where("billing.stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  return snap.docs[0]?.id ?? null;
}
