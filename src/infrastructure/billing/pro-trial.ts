/**
 * Grants or expires the 14-day product Pro trial on a workspace document.
 */

import { FieldValue } from "firebase-admin/firestore";

import type { PlanId, WorkspaceLimits, WorkspaceUsage } from "@/core/entities";
import { limitsForPlan } from "@/core/services/enforce-plan-limits";
import {
  coerceDate,
  isProTrialActive,
  productTrialBilling,
  proTrialDaysLeft,
  shouldExpireProTrial,
  shouldGrantProTrial,
  trialPeriodEnd,
  type BillingLike,
} from "@/core/services/pro-trial";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export interface ReconciledWorkspacePlan {
  readonly workspaceId: string;
  readonly plan: PlanId;
  readonly usage: WorkspaceUsage;
  readonly limits: WorkspaceLimits;
  readonly trialActive: boolean;
  readonly trialDaysLeft: number;
  readonly billingStatus: "active" | "past_due" | "canceled" | "trialing" | null;
}

function limitsPayload(plan: PlanId): WorkspaceLimits {
  return limitsForPlan(plan);
}

function asPlanId(value: unknown): PlanId {
  if (value === "pro" || value === "studio" || value === "free") return value;
  return "free";
}

function asBilling(value: unknown): BillingLike {
  if (value == null || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    status: typeof row.status === "string" ? row.status : null,
    subscriptionId:
      typeof row.subscriptionId === "string" ? row.subscriptionId : null,
    stripeCustomerId:
      typeof row.stripeCustomerId === "string" ? row.stripeCustomerId : null,
    periodEnd: row.periodEnd,
  };
}

export async function reconcileWorkspacePlan(
  workspaceId: string,
): Promise<ReconciledWorkspacePlan | null> {
  if (!workspaceId) return null;

  const db = getAdminDb();
  const ref = db.collection("workspaces").doc(workspaceId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  const now = new Date();
  let plan = asPlanId(data.plan);
  let billing = asBilling(data.billing);
  let limits = {
    galleries: Number(data.limits?.galleries ?? limitsPayload(plan).galleries),
    artworksPerGallery: Number(
      data.limits?.artworksPerGallery ?? limitsPayload(plan).artworksPerGallery,
    ),
    storageBytes: Number(
      data.limits?.storageBytes ?? limitsPayload(plan).storageBytes,
    ),
    customDomain: Boolean(
      data.limits?.customDomain ?? limitsPayload(plan).customDomain,
    ),
    seats: Number(data.limits?.seats ?? limitsPayload(plan).seats),
  };

  if (shouldGrantProTrial(plan, billing)) {
    const periodEnd = trialPeriodEnd(now);
    const next = productTrialBilling(periodEnd);
    const nextLimits = limitsPayload("pro");
    await ref.update({
      plan: "pro",
      limits: nextLimits,
      billing: next,
      updatedAt: FieldValue.serverTimestamp(),
    });
    plan = "pro";
    billing = next;
    limits = nextLimits;
  } else if (shouldExpireProTrial(billing, now)) {
    const nextLimits = limitsPayload("free");
    const next = {
      stripeCustomerId: billing?.stripeCustomerId ?? "",
      subscriptionId: billing?.subscriptionId ?? null,
      status: "canceled" as const,
      periodEnd: coerceDate(billing?.periodEnd),
    };
    await ref.update({
      plan: "free",
      limits: nextLimits,
      billing: next,
      updatedAt: FieldValue.serverTimestamp(),
    });
    plan = "free";
    billing = next;
    limits = nextLimits;
  } else if (isProTrialActive(billing, now) && plan !== "pro") {
    const nextLimits = limitsPayload("pro");
    await ref.update({
      plan: "pro",
      limits: nextLimits,
      updatedAt: FieldValue.serverTimestamp(),
    });
    plan = "pro";
    limits = nextLimits;
  }

  const trialActive = isProTrialActive(billing, now);

  return {
    workspaceId,
    plan,
    usage: {
      galleries: Number(data.usage?.galleries ?? 0),
      artworks: Number(data.usage?.artworks ?? 0),
      storageBytes: Number(data.usage?.storageBytes ?? 0),
    },
    limits,
    trialActive,
    trialDaysLeft: proTrialDaysLeft(billing, now),
    billingStatus:
      billing?.status === "active" ||
      billing?.status === "past_due" ||
      billing?.status === "canceled" ||
      billing?.status === "trialing"
        ? billing.status
        : null,
  };
}
