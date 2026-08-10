/**
 * Platform-admin override of a workspace plan (testing / support).
 */

import { FieldValue } from "firebase-admin/firestore";

import type { PlanId } from "@/core/entities";
import { NotFoundError, ValidationError } from "@/core/errors";
import { limitsForPlan } from "@/core/services/enforce-plan-limits";
import { getAdminDb } from "@/infrastructure/firebase/admin";

const PLANS: readonly PlanId[] = ["free", "pro", "studio"];

export function isPlanId(value: string): value is PlanId {
  return (PLANS as readonly string[]).includes(value);
}

export async function setWorkspacePlan(
  workspaceId: string,
  plan: PlanId,
): Promise<{ workspaceId: string; plan: PlanId }> {
  if (!workspaceId.trim()) {
    throw new ValidationError("workspaceId is required");
  }
  if (!isPlanId(plan)) {
    throw new ValidationError("plan must be free, pro, or studio");
  }

  const db = getAdminDb();
  const ref = db.collection("workspaces").doc(workspaceId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new NotFoundError("workspace", workspaceId);
  }

  const limits = limitsForPlan(plan);
  await ref.update({
    plan,
    limits: {
      galleries: limits.galleries,
      artworksPerGallery: limits.artworksPerGallery,
      storageBytes: limits.storageBytes,
      customDomain: limits.customDomain,
      seats: limits.seats,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { workspaceId, plan };
}
