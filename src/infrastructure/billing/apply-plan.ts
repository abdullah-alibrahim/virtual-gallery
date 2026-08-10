/**
 * Applies Stripe subscription state onto a workspace (plan + billing fields).
 */

import { FieldValue } from "firebase-admin/firestore";

import type { PlanId } from "@/core/entities";
import { limitsForPlan } from "@/core/services/enforce-plan-limits";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { planFromPriceId } from "./stripe";

export async function applyWorkspacePlan(input: {
  workspaceId: string;
  plan: PlanId;
  stripeCustomerId: string;
  subscriptionId: string | null;
  status: "active" | "past_due" | "canceled" | "trialing";
  periodEnd: Date | null;
}): Promise<void> {
  const limits = limitsForPlan(input.plan);
  await getAdminDb()
    .collection("workspaces")
    .doc(input.workspaceId)
    .update({
      plan: input.plan,
      limits: {
        galleries: limits.galleries,
        artworksPerGallery: limits.artworksPerGallery,
        storageBytes: limits.storageBytes,
        customDomain: limits.customDomain,
        seats: limits.seats,
      },
      billing: {
        stripeCustomerId: input.stripeCustomerId,
        subscriptionId: input.subscriptionId,
        status: input.status,
        periodEnd: input.periodEnd,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export function planFromSubscriptionItems(
  items: Array<{ price?: { id?: string } | string | null }>,
): PlanId {
  for (const item of items) {
    const priceId =
      typeof item.price === "string" ? item.price : item.price?.id;
    if (!priceId) continue;
    const plan = planFromPriceId(priceId);
    if (plan) return plan;
  }
  return "free";
}
