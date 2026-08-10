/**
 * Platform-admin gallery mutations (unpublish, soft-delete, restore, status).
 */

import { FieldValue } from "firebase-admin/firestore";

import type { GalleryStatus } from "@/core/entities";
import {
  NotFoundError,
  ValidationError,
} from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { softDeleteGallery } from "@/infrastructure/galleries/soft-delete-gallery";
import { deleteLatestPointer } from "@/infrastructure/publish/manifest-storage";

const STATUSES: readonly GalleryStatus[] = [
  "draft",
  "published",
  "unpublished",
  "archived",
];

export function isGalleryStatus(value: string): value is GalleryStatus {
  return (STATUSES as readonly string[]).includes(value);
}

async function loadGalleryOrThrow(galleryId: string) {
  if (!galleryId.trim()) {
    throw new ValidationError("galleryId is required");
  }
  const ref = getAdminDb().collection("galleries").doc(galleryId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new NotFoundError("gallery", galleryId);
  }
  return { ref, data: snap.data()! };
}

/** Take a gallery offline (admin, no workspace membership required). */
export async function adminUnpublishGallery(galleryId: string): Promise<void> {
  const { ref, data } = await loadGalleryOrThrow(galleryId);
  if (data.deletedAt) {
    throw new ValidationError("Gallery is deleted");
  }
  if (data.status !== "published") {
    throw new ValidationError("Gallery is not published");
  }

  const slug = String(data.slug ?? "");
  if (slug) {
    await deleteLatestPointer(slug);
  }

  await ref.update({
    status: "unpublished",
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/** Soft-delete: hide from lists, unpublish if live, decrement usage. */
export async function adminSoftDeleteGallery(galleryId: string): Promise<void> {
  await softDeleteGallery({ galleryId });
}

/** Restore a soft-deleted gallery and re-count usage. */
export async function adminRestoreGallery(galleryId: string): Promise<void> {
  const db = getAdminDb();
  const { ref, data } = await loadGalleryOrThrow(galleryId);

  if (!data.deletedAt) {
    throw new ValidationError("Gallery is not deleted");
  }

  const workspaceId = String(data.workspaceId ?? "");
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(ref);
    if (!fresh.exists || !fresh.data()?.deletedAt) {
      throw new ValidationError("Gallery is not deleted");
    }

    tx.update(ref, {
      deletedAt: null,
      updatedAt: now,
    });

    if (workspaceId) {
      tx.update(db.collection("workspaces").doc(workspaceId), {
        "usage.galleries": FieldValue.increment(1),
        updatedAt: now,
      });
    }
  });
}

/**
 * Force a non-published status. Publishing still goes through the compile
 * pipeline — admins cannot invent a live pointer here.
 */
export async function adminSetGalleryStatus(
  galleryId: string,
  status: GalleryStatus,
): Promise<void> {
  if (!isGalleryStatus(status)) {
    throw new ValidationError("Invalid gallery status");
  }
  if (status === "published") {
    throw new ValidationError(
      "Cannot force published — use the studio publish flow",
    );
  }

  const { ref, data } = await loadGalleryOrThrow(galleryId);
  if (data.deletedAt) {
    throw new ValidationError("Restore the gallery before changing status");
  }

  if (data.status === "published") {
    const slug = String(data.slug ?? "");
    if (slug) {
      await deleteLatestPointer(slug);
    }
  }

  await ref.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
