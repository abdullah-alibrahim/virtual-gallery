/**
 * Replaces the artwork subcollection for a gallery (editor autosave).
 */

import { FieldValue } from "firebase-admin/firestore";

import type { Artwork, PlanId } from "@/core/entities";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { assertCanAddArtwork } from "@/core/services/enforce-plan-limits";
import { PLAN_LIMITS } from "@/core/services/plan-limits";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export async function saveGalleryArtworks(input: {
  galleryId: string;
  uid: string;
  artworks: readonly Artwork[];
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

  const workspaceSnap = await db.collection("workspaces").doc(workspaceId).get();
  const ws = workspaceSnap.data() ?? {};
  const plan = (ws.plan ?? "free") as PlanId;
  const fallback = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const limits = {
    galleries: Number(ws.limits?.galleries ?? fallback.galleries),
    artworksPerGallery: Number(
      ws.limits?.artworksPerGallery ?? fallback.artworksPerGallery,
    ),
    storageBytes: Number(ws.limits?.storageBytes ?? fallback.storageBytes),
    customDomain: Boolean(ws.limits?.customDomain ?? fallback.customDomain),
    seats: Number(ws.limits?.seats ?? fallback.seats),
  };

  // Enforce ceiling only when growing past the plan max (edits that shrink are fine).
  if (input.artworks.length > limits.artworksPerGallery) {
    assertCanAddArtwork(input.artworks.length, limits);
  }

  const existing = await galleryRef.collection("artworks").get();
  const batch = db.batch();

  for (const doc of existing.docs) {
    batch.delete(doc.ref);
  }

  input.artworks.forEach((artwork, index) => {
    const ref = galleryRef.collection("artworks").doc(artwork.id);
    batch.set(ref, {
      workspaceId,
      assetId: artwork.assetId,
      order: index,
      title: artwork.title,
      description: artwork.description,
      year: artwork.year,
      medium: artwork.medium,
      category: artwork.category,
      dimensions: artwork.dimensions,
      price: artwork.price,
      availability: artwork.availability,
      frame: artwork.frame,
      placement: artwork.placement,
      lighting: artwork.lighting,
      media: artwork.media,
      commerce: artwork.commerce,
      createdAt: artwork.createdAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  batch.update(galleryRef, {
    artworkCount: input.artworks.length,
    hasUnpublishedChanges: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
