/**
 * Soft-deletes a gallery for a workspace owner/admin: hide from lists,
 * unpublish if live, decrement usage. Matches admin soft-delete semantics.
 */

import { FieldValue } from "firebase-admin/firestore";

import type { MemberRole } from "@/core/entities";
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { deleteLatestPointer } from "@/infrastructure/publish/manifest-storage";

const CAN_DELETE_ROLES: ReadonlySet<MemberRole> = new Set(["owner", "admin"]);

/**
 * Soft-delete used by studio and admin. When `uid` is provided, requires
 * workspace membership with owner/admin role (or gallery.ownerId match).
 * When omitted, skips membership checks (platform admin path).
 */
export async function softDeleteGallery(input: {
  galleryId: string;
  uid?: string;
}): Promise<void> {
  const galleryId = input.galleryId.trim();
  if (!galleryId) {
    throw new ValidationError("galleryId is required");
  }

  const db = getAdminDb();
  const ref = db.collection("galleries").doc(galleryId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new NotFoundError("gallery", galleryId);
  }

  const data = snap.data()!;
  if (data.deletedAt) {
    throw new ValidationError("Gallery is already deleted");
  }

  const workspaceId = String(data.workspaceId ?? "");
  if (input.uid) {
    await assertCanSoftDelete({
      uid: input.uid,
      galleryId,
      workspaceId,
      galleryOwnerId: String(data.ownerId ?? ""),
    });
  }

  const slug = String(data.slug ?? "");
  if (data.status === "published" && slug) {
    await deleteLatestPointer(slug);
  }

  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(ref);
    if (!fresh.exists || fresh.data()?.deletedAt) {
      throw new ValidationError("Gallery is already deleted");
    }

    const status = fresh.data()?.status;
    tx.update(ref, {
      deletedAt: now,
      status: status === "published" ? "unpublished" : status,
      updatedAt: now,
    });

    if (workspaceId) {
      tx.update(db.collection("workspaces").doc(workspaceId), {
        "usage.galleries": FieldValue.increment(-1),
        updatedAt: now,
      });
    }
  });
}

async function assertCanSoftDelete(input: {
  uid: string;
  galleryId: string;
  workspaceId: string;
  galleryOwnerId: string;
}): Promise<void> {
  if (!input.workspaceId) {
    throw new ForbiddenError("workspace missing");
  }

  const member = await getAdminDb()
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();

  if (!member.exists) {
    // 404 rather than 403 — do not confirm the gallery exists.
    throw new NotFoundError("gallery", input.galleryId);
  }

  const role = String(member.data()?.role ?? "") as MemberRole;
  const isOwnerOfGallery = input.galleryOwnerId === input.uid;
  if (!CAN_DELETE_ROLES.has(role) && !isOwnerOfGallery) {
    throw new ForbiddenError("Only workspace owners can delete galleries");
  }
}
