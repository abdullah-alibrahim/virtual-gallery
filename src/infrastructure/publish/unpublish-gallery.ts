/**
 * Takes a gallery offline by deleting the live pointer and marking unpublished.
 * Versioned manifests stay on Storage for later rollback / republish.
 */

import { FieldValue } from "firebase-admin/firestore";

import { ValidationError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { loadGalleryForEditor } from "@/infrastructure/galleries/load-gallery";

import { deleteLatestPointer } from "./manifest-storage";

export async function unpublishGallery(input: {
  galleryId: string;
  uid: string;
}): Promise<void> {
  const { gallery } = await loadGalleryForEditor({
    galleryId: input.galleryId,
    uid: input.uid,
  });

  if (gallery.status !== "published") {
    throw new ValidationError("Gallery is not published");
  }

  await deleteLatestPointer(gallery.slug);

  await getAdminDb()
    .collection("galleries")
    .doc(gallery.id)
    .update({
      status: "unpublished",
      updatedAt: FieldValue.serverTimestamp(),
    });
}
