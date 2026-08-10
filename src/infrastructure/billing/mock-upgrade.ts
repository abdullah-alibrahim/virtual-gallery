/**
 * Billing mock mode — local / emulator upgrades without Stripe.
 *
 * Enabled when Stripe is not configured and either Firebase emulators are on
 * or `BILLING_MOCK=true`. Real Stripe Checkout takes precedence when keys exist.
 */

import { FieldValue } from "firebase-admin/firestore";

import type { PlanId } from "@/core/entities";
import { ForbiddenError, ValidationError } from "@/core/errors";
import { limitsForPlan } from "@/core/services/enforce-plan-limits";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { isStripeConfigured } from "./stripe";

export function isBillingMockEnabled(): boolean {
  if (isStripeConfigured()) return false;
  if (process.env.BILLING_MOCK === "true") return true;
  return (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
    Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) ||
    Boolean(process.env.FIRESTORE_EMULATOR_HOST)
  );
}

export async function applyMockPlanUpgrade(input: {
  uid: string;
  workspaceId: string;
  plan: PlanId;
}): Promise<{ plan: PlanId; mock: true }> {
  if (!isBillingMockEnabled()) {
    throw new ValidationError(
      "Mock billing is disabled. Configure Stripe or set BILLING_MOCK=true / use emulators.",
    );
  }

  if (input.plan !== "free" && input.plan !== "pro" && input.plan !== "studio") {
    throw new ValidationError("Invalid plan");
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

  const limits = limitsForPlan(input.plan);
  const now = FieldValue.serverTimestamp();

  await db
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
      billing:
        input.plan === "free"
          ? null
          : {
              stripeCustomerId: `mock_${input.workspaceId}`,
              subscriptionId: `mock_sub_${input.plan}`,
              status: "active",
              periodEnd: null,
            },
      updatedAt: now,
    });

  return { plan: input.plan, mock: true };
}
