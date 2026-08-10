/**
 * Publishes a gallery: compile → immutable Storage write → flip latest pointer.
 */

import { FieldValue } from "firebase-admin/firestore";

import { siteConfig } from "@/config/site";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import {
  compileSceneManifest,
  type LatestPointer,
} from "@/core/services/compile-scene-manifest";
import { getAdminDb } from "@/infrastructure/firebase/admin";

import { loadPublishContext } from "./load-publish-context";
import {
  writeLatestPointer,
  writePublishedManifest,
} from "./manifest-storage";

export interface PublishResult {
  readonly version: number;
  readonly manifestPath: string;
  readonly publicUrl: string;
  readonly viewerUrl: string;
}

export async function publishGallery(input: {
  galleryId: string;
  uid: string;
}): Promise<PublishResult> {
  const ctx = await loadPublishContext(input);
  const { gallery } = ctx;

  const member = await getAdminDb()
    .collection("workspaces")
    .doc(gallery.workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();
  if (!member.exists) {
    throw new ForbiddenError("not a workspace member");
  }

  const nextVersion = (gallery.publishedVersion ?? 0) + 1;
  const compiledAt = new Date();

  const manifest = compileSceneManifest({
    gallery,
    artworks: ctx.artworks,
    template: ctx.template,
    profile: ctx.profile,
    environment: null,
    assets: ctx.assets,
    publishedVersion: nextVersion,
    compiledAt,
  });

  const { storagePath, publicUrl } = await writePublishedManifest({
    slug: gallery.slug,
    version: nextVersion,
    manifest,
  });

  const pointer: LatestPointer = {
    galleryId: gallery.id,
    slug: gallery.slug,
    version: nextVersion,
    manifestPath: storagePath,
    publishedAt: compiledAt.toISOString(),
  };
  await writeLatestPointer(pointer);

  const db = getAdminDb();
  const galleryRef = db.collection("galleries").doc(gallery.id);
  const versionRef = galleryRef.collection("versions").doc(String(nextVersion));
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(galleryRef);
    if (!snap.exists || snap.data()?.deletedAt) {
      throw new NotFoundError("Gallery", gallery.id);
    }

    tx.set(versionRef, {
      version: nextVersion,
      manifestPath: storagePath,
      manifestUrl: publicUrl,
      artworkCount: ctx.artworks.length,
      publishedBy: input.uid,
      compiledAt: compiledAt.toISOString(),
      createdAt: now,
    });

    tx.update(galleryRef, {
      status: "published",
      publishedVersion: nextVersion,
      publishedAt: now,
      manifestPath: storagePath,
      hasUnpublishedChanges: false,
      updatedAt: now,
    });
  });

  return {
    version: nextVersion,
    manifestPath: storagePath,
    publicUrl,
    viewerUrl: `${siteConfig.url}/g/${gallery.slug}`,
  };
}
