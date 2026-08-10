/**
 * Persists gallery-level room overrides (materials, lighting, environment,
 * architecture). Does not mutate the shared template catalogue.
 */

import { FieldValue } from "firebase-admin/firestore";

import type {
  GalleryArchitectureOverrides,
  GalleryEnvironmentOverrides,
  GalleryLightingOverrides,
  GalleryMaterialOverrides,
} from "@/core/entities";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export async function updateGalleryRoomOverrides(input: {
  galleryId: string;
  uid: string;
  materialOverrides?: GalleryMaterialOverrides | null;
  lightingOverrides?: GalleryLightingOverrides | null;
  environmentOverrides?: GalleryEnvironmentOverrides | null;
  architectureOverrides?: GalleryArchitectureOverrides | null;
}): Promise<void> {
  const db = getAdminDb();
  const galleryRef = db.collection("galleries").doc(input.galleryId);
  const snap = await galleryRef.get();
  if (!snap.exists || snap.data()?.deletedAt) {
    throw new NotFoundError("Gallery", input.galleryId);
  }

  const workspaceId = String(snap.data()!.workspaceId);
  const member = await db
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();
  if (!member.exists) {
    throw new ForbiddenError("not a workspace member");
  }

  const patch: Record<string, unknown> = {
    hasUnpublishedChanges: true,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.materialOverrides !== undefined) {
    patch.materialOverrides = sanitizeObject(input.materialOverrides);
  }
  if (input.lightingOverrides !== undefined) {
    patch.lightingOverrides = sanitizeObject(input.lightingOverrides);
  }
  if (input.environmentOverrides !== undefined) {
    patch.environmentOverrides = sanitizeObject(input.environmentOverrides);
  }
  if (input.architectureOverrides !== undefined) {
    patch.architectureOverrides = sanitizeObject(input.architectureOverrides);
  }

  await galleryRef.update(patch);
}

function sanitizeObject<T extends object>(
  overrides: T | null,
): Record<string, unknown> | null {
  if (overrides === null) return null;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    next[key] = value;
  }
  return Object.keys(next).length === 0 ? null : next;
}
