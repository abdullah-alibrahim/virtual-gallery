/**
 * Lightweight workspace usage / limits read for studio UI gates.
 * Reconciles the 14-day product Pro trial (grant once, expire when due).
 */

import type { PlanId, WorkspaceLimits, WorkspaceUsage } from "@/core/entities";
import { reconcileWorkspacePlan } from "@/infrastructure/billing/pro-trial";

export interface WorkspaceUsageSnapshot {
  readonly workspaceId: string;
  readonly plan: PlanId;
  readonly usage: WorkspaceUsage;
  readonly limits: WorkspaceLimits;
  readonly trialActive: boolean;
  readonly trialDaysLeft: number;
  readonly billingStatus: "active" | "past_due" | "canceled" | "trialing" | null;
}

export async function loadWorkspaceUsage(
  workspaceId: string,
): Promise<WorkspaceUsageSnapshot | null> {
  return reconcileWorkspacePlan(workspaceId);
}
