/**
 * Loads a gallery draft + artworks for the editor, verifying membership.
 */

import type { DocumentData } from "firebase-admin/firestore";

import type { Artwork, Gallery } from "@/core/entities";
import { NotFoundError } from "@/core/errors";
import { createDimensions } from "@/core/value-objects/dimensions";
import { createFrameSpec } from "@/core/value-objects/frame-spec";
import { createMoney } from "@/core/value-objects/money";
import { toSlug } from "@/core/value-objects/slug";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export async function loadGalleryForEditor(input: {
  galleryId: string;
  uid: string;
}): Promise<{ gallery: Gallery; artworks: Artwork[] }> {
  const db = getAdminDb();
  const snap = await db.collection("galleries").doc(input.galleryId).get();
  if (!snap.exists || snap.data()?.deletedAt) {
    throw new NotFoundError("Gallery", input.galleryId);
  }

  const data = snap.data()!;
  const workspaceId = String(data.workspaceId);
  const member = await db
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();

  if (!member.exists) {
    // 404 rather than 403 — do not confirm the gallery exists.
    throw new NotFoundError("Gallery", input.galleryId);
  }

  const artworksSnap = await db
    .collection("galleries")
    .doc(input.galleryId)
    .collection("artworks")
    .orderBy("order", "asc")
    .get();

  return {
    gallery: mapGallery(input.galleryId, data),
    artworks: artworksSnap.docs.map((doc) =>
      mapArtwork(doc.id, doc.data(), input.galleryId, workspaceId),
    ),
  };
}

function mapGallery(id: string, data: DocumentData): Gallery {
  return {
    id,
    workspaceId: String(data.workspaceId),
    ownerId: String(data.ownerId),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    templateId: String(data.templateId),
    templateVersion: Number(data.templateVersion ?? 1),
    slug: toSlug(String(data.slug)),
    status: data.status,
    visibility: data.visibility,
    publishedVersion: data.publishedVersion ?? null,
    publishedAt: data.publishedAt?.toDate?.() ?? null,
    manifestPath: data.manifestPath ?? null,
    hasUnpublishedChanges: Boolean(data.hasUnpublishedChanges),
    cover: data.cover ?? null,
    seo: data.seo ?? { title: null, description: null, ogPath: null },
    settings: data.settings,
    materialOverrides: data.materialOverrides ?? null,
    lightingOverrides: data.lightingOverrides ?? null,
    environmentOverrides: data.environmentOverrides ?? null,
    architectureOverrides: data.architectureOverrides ?? null,
    counters: data.counters,
    artworkCount: Number(data.artworkCount ?? 0),
    createdAt: data.createdAt?.toDate?.() ?? new Date(0),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(0),
    deletedAt: data.deletedAt?.toDate?.() ?? null,
  };
}

function mapArtwork(
  id: string,
  data: DocumentData,
  galleryId: string,
  workspaceId: string,
): Artwork {
  const dims = data.dimensions ?? { width: 80, height: 80, unit: "cm" };
  const frame = data.frame ?? {
    style: "gallery",
    color: "#1a1a1a",
    widthCm: 2.5,
    matteCm: 0,
    matteColor: "#f5f2ea",
  };

  return {
    id,
    galleryId,
    workspaceId,
    assetId: String(data.assetId),
    order: Number(data.order ?? 0),
    title: String(data.title ?? "Untitled"),
    description: String(data.description ?? ""),
    year: data.year ?? null,
    medium: data.medium ?? null,
    category: data.category ?? null,
    dimensions: createDimensions(dims.width, dims.height, dims.unit, dims.depth),
    price: data.price
      ? createMoney(data.price.amount, data.price.currency)
      : null,
    availability: data.availability ?? "available",
    frame: createFrameSpec(frame),
    placement: data.placement,
    lighting: data.lighting,
    media: data.media,
    commerce: data.commerce ?? { externalUrl: null, allowInquiries: true },
    createdAt: data.createdAt?.toDate?.() ?? new Date(0),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(0),
  };
}
