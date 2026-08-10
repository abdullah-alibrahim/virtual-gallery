/**
 * Lightweight workspace usage / limits read for studio UI gates.
 */

import type { PlanId, WorkspaceLimits, WorkspaceUsage } from "@/core/entities";
import { PLAN_LIMITS } from "@/core/services/plan-limits";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export interface WorkspaceUsageSnapshot {
  readonly workspaceId: string;
  readonly plan: PlanId;
  readonly usage: WorkspaceUsage;
  readonly limits: WorkspaceLimits;
}

export async function loadWorkspaceUsage(
  workspaceId: string,
): Promise<WorkspaceUsageSnapshot | null> {
  if (!workspaceId) return null;

  const snap = await getAdminDb()
    .collection("workspaces")
    .doc(workspaceId)
    .get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  const plan = (data.plan ?? "free") as PlanId;
  const fallback = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  return {
    workspaceId,
    plan,
    usage: {
      galleries: Number(data.usage?.galleries ?? 0),
      artworks: Number(data.usage?.artworks ?? 0),
      storageBytes: Number(data.usage?.storageBytes ?? 0),
    },
    limits: {
      galleries: Number(data.limits?.galleries ?? fallback.galleries),
      artworksPerGallery: Number(
        data.limits?.artworksPerGallery ?? fallback.artworksPerGallery,
      ),
      storageBytes: Number(
        data.limits?.storageBytes ?? fallback.storageBytes,
      ),
      customDomain: Boolean(
        data.limits?.customDomain ?? fallback.customDomain,
      ),
      seats: Number(data.limits?.seats ?? fallback.seats),
    },
  };
}
