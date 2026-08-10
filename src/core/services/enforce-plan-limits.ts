import type { PlanId, WorkspaceLimits, WorkspaceUsage } from "@/core/entities";
import { PlanLimitError } from "@/core/errors";
import { PLAN_LIMITS } from "./plan-limits";

/**
 * Plan enforcement. The server is always the authority — the UI gates
 * optimistically from the same numbers so the artist never hits a surprising
 * 402 on submit.
 */

export function limitsForPlan(plan: PlanId): WorkspaceLimits {
  const p = PLAN_LIMITS[plan];
  return {
    galleries: p.galleries,
    artworksPerGallery: p.artworksPerGallery,
    storageBytes: p.storageBytes,
    customDomain: p.customDomain,
    seats: p.seats,
  };
}

export function assertCanCreateGallery(
  usage: WorkspaceUsage,
  limits: WorkspaceLimits,
): void {
  if (usage.galleries >= limits.galleries) {
    throw new PlanLimitError("galleries", usage.galleries, limits.galleries);
  }
}

export function assertCanAddArtwork(
  artworkCount: number,
  limits: WorkspaceLimits,
): void {
  if (artworkCount >= limits.artworksPerGallery) {
    throw new PlanLimitError(
      "artworksPerGallery",
      artworkCount,
      limits.artworksPerGallery,
    );
  }
}

export function assertCanUpload(
  usage: WorkspaceUsage,
  limits: WorkspaceLimits,
  additionalBytes: number,
): void {
  if (usage.storageBytes + additionalBytes > limits.storageBytes) {
    throw new PlanLimitError(
      "storageBytes",
      usage.storageBytes,
      limits.storageBytes,
    );
  }
}

export function canUseTemplateTier(
  plan: PlanId,
  tier: "free" | "pro",
): boolean {
  return PLAN_LIMITS[plan].templateTiers.includes(tier);
}

/** Member count includes owner; pending invites count toward the seat ceiling. */
export function assertCanInviteMember(
  occupiedSeats: number,
  limits: WorkspaceLimits,
): void {
  if (occupiedSeats >= limits.seats) {
    throw new PlanLimitError("seats", occupiedSeats, limits.seats);
  }
}
