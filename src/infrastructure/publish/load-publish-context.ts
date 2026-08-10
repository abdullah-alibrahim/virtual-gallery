/**
 * Loads everything needed to compile or republish a gallery.
 */

import type { DocumentData } from "firebase-admin/firestore";

import type {
  ArtistProfile,
  Artwork,
  Asset,
  Gallery,
  SceneTemplate,
} from "@/core/entities";
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import {
  buildSampleDomainAsset,
  isSampleAssetId,
} from "@/core/samples/sample-paintings";
import { getTemplateById } from "@/core/templates";
import { toSlug } from "@/core/value-objects/slug";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { loadGalleryForEditor } from "@/infrastructure/galleries/load-gallery";

import { mapAssetDocument } from "./map-asset";

export interface PublishContext {
  readonly gallery: Gallery;
  readonly artworks: readonly Artwork[];
  readonly template: SceneTemplate;
  readonly profile: ArtistProfile;
  readonly assets: ReadonlyMap<string, Asset>;
}

export async function loadPublishContext(input: {
  galleryId: string;
  uid: string;
}): Promise<PublishContext> {
  const { gallery, artworks } = await loadGalleryForEditor(input);

  const template = getTemplateById(gallery.templateId);
  if (!template || template.status === "deprecated") {
    throw new ValidationError("Template is unavailable");
  }

  const db = getAdminDb();
  const profileSnap = await db
    .collection("artistProfiles")
    .doc(gallery.workspaceId)
    .get();
  if (!profileSnap.exists) {
    throw new NotFoundError("ArtistProfile", gallery.workspaceId);
  }

  const profile = mapProfile(gallery.workspaceId, profileSnap.data()!);

  const assetIds = new Set<string>();
  for (const artwork of artworks) {
    assetIds.add(artwork.assetId);
    if (artwork.media.audioAssetId) assetIds.add(artwork.media.audioAssetId);
  }
  if (gallery.settings.ambientAudioAssetId) {
    assetIds.add(gallery.settings.ambientAudioAssetId);
  }

  const assets = new Map<string, Asset>();
  await Promise.all(
    [...assetIds].map(async (assetId) => {
      // Starter-pack paintings live under /public — no Firestore/Storage row.
      if (isSampleAssetId(assetId)) {
        const sample = buildSampleDomainAsset(assetId, gallery.workspaceId);
        if (sample) assets.set(assetId, sample);
        return;
      }
      const snap = await db.collection("assets").doc(assetId).get();
      if (!snap.exists) return;
      const asset = mapAssetDocument(snap.id, snap.data()!);
      if (asset.workspaceId !== gallery.workspaceId) {
        throw new ForbiddenError("asset belongs to another workspace");
      }
      assets.set(assetId, asset);
    }),
  );

  return { gallery, artworks, template, profile, assets };
}

function mapProfile(workspaceId: string, data: DocumentData): ArtistProfile {
  const contact = data.contact ?? {};
  return {
    workspaceId,
    slug: toSlug(String(data.slug)),
    displayName: String(data.displayName ?? "Artist"),
    bio: String(data.bio ?? ""),
    statement: String(data.statement ?? ""),
    avatarUrl: data.avatarUrl ?? null,
    coverUrl: data.coverUrl ?? null,
    location: data.location ?? null,
    socials: data.socials ?? {},
    contact: {
      allowInquiries: Boolean(contact.allowInquiries ?? true),
      showEmail: Boolean(contact.showEmail ?? false),
      ...(contact.email ? { email: String(contact.email) } : {}),
    },
    featuredGalleryIds: Array.isArray(data.featuredGalleryIds)
      ? data.featuredGalleryIds.map(String)
      : [],
    createdAt: data.createdAt?.toDate?.() ?? new Date(0),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(0),
  };
}
