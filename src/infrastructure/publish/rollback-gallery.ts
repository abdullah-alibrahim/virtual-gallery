/**
 * Rolls a published gallery back to a previous immutable version.
 * Commit = rewrite `latest.json` pointer (no recompile).
 */

import { FieldValue } from "firebase-admin/firestore";

import { siteConfig } from "@/config/site";
import { NotFoundError, ValidationError } from "@/core/errors";
import type { LatestPointer } from "@/core/services/compile-scene-manifest";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { loadGalleryForEditor } from "@/infrastructure/galleries/load-gallery";

import {
  readManifestAtPath,
  writeLatestPointer,
} from "./manifest-storage";

export interface RollbackResult {
  readonly version: number;
  readonly manifestPath: string;
  readonly viewerUrl: string;
}

export async function rollbackGallery(input: {
  galleryId: string;
  uid: string;
  version: number;
}): Promise<RollbackResult> {
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new ValidationError("Invalid version");
  }

  const { gallery } = await loadGalleryForEditor({
    galleryId: input.galleryId,
    uid: input.uid,
  });

  if (gallery.publishedVersion === null) {
    throw new ValidationError("Gallery has never been published");
  }
  if (input.version === gallery.publishedVersion) {
    throw new ValidationError("Already on that version");
  }

  const db = getAdminDb();
  const versionSnap = await db
    .collection("galleries")
    .doc(gallery.id)
    .collection("versions")
    .doc(String(input.version))
    .get();

  if (!versionSnap.exists) {
    throw new NotFoundError("GalleryVersion", String(input.version));
  }

  const storagePath = String(versionSnap.data()!.manifestPath);
  const manifest = await readManifestAtPath(storagePath);
  if (!manifest) {
    throw new NotFoundError("Manifest", storagePath);
  }

  const publishedAt = new Date().toISOString();
  const pointer: LatestPointer = {
    galleryId: gallery.id,
    slug: gallery.slug,
    version: input.version,
    manifestPath: storagePath,
    publishedAt,
  };
  await writeLatestPointer(pointer);

  const now = FieldValue.serverTimestamp();
  await db.collection("galleries").doc(gallery.id).update({
    status: "published",
    publishedVersion: input.version,
    publishedAt: now,
    manifestPath: storagePath,
    // Draft may still differ from the restored live version.
    hasUnpublishedChanges: true,
    updatedAt: now,
  });

  return {
    version: input.version,
    manifestPath: storagePath,
    viewerUrl: `${siteConfig.url}/g/${gallery.slug}`,
  };
}
