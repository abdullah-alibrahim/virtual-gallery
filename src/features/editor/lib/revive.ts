/**
 * Revive Date fields after RSC → client serialization (JSON turns Dates into strings).
 */

import type { Artwork, Gallery } from "@/core/entities";
import type { AssetListItem } from "@/infrastructure/firebase/assets-client";

export function reviveGallery(gallery: Gallery): Gallery {
  return {
    ...gallery,
    materialOverrides: gallery.materialOverrides ?? null,
    lightingOverrides: gallery.lightingOverrides ?? null,
    environmentOverrides: gallery.environmentOverrides ?? null,
    architectureOverrides: gallery.architectureOverrides ?? null,
    createdAt: asDate(gallery.createdAt),
    updatedAt: asDate(gallery.updatedAt),
    publishedAt: gallery.publishedAt ? asDate(gallery.publishedAt) : null,
    deletedAt: gallery.deletedAt ? asDate(gallery.deletedAt) : null,
  };
}

export function reviveArtwork(artwork: Artwork): Artwork {
  return {
    ...artwork,
    createdAt: asDate(artwork.createdAt),
    updatedAt: asDate(artwork.updatedAt),
  };
}

export function reviveAsset(asset: AssetListItem): AssetListItem {
  return {
    ...asset,
    createdAt: asset.createdAt ? asDate(asset.createdAt) : null,
  };
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
