import type { Artwork, SceneTemplate } from "@/core/entities";
import { SAMPLE_PAINTINGS, sampleAssetId } from "@/core/samples/sample-paintings";
import type { AssetListItem } from "@/infrastructure/firebase/assets-client";

import { hangAssetAsArtwork } from "./hang-artwork";
import { buildSampleAssetListItems } from "./sample-assets";

/**
 * Hangs every starter-pack painting that is not already on a wall, claiming
 * free anchors via `arrangeArtworks`. Returns how many were added.
 */
export function fillWithSamplePaintings(input: {
  galleryId: string;
  workspaceId: string;
  template: SceneTemplate;
  existing: readonly Artwork[];
  assets: readonly AssetListItem[];
}): {
  artworks: Artwork[];
  assets: AssetListItem[];
  hung: number;
  skipped: number;
} {
  const sampleAssets = buildSampleAssetListItems(input.workspaceId);
  const byId = new Map(input.assets.map((a) => [a.id, a]));
  for (const sample of sampleAssets) byId.set(sample.id, sample);
  const mergedAssets = [...byId.values()];

  const hung: Artwork[] = [];
  let existing = [...input.existing];
  let skipped = 0;

  for (const painting of SAMPLE_PAINTINGS) {
    const assetId = sampleAssetId(painting.id);
    if (existing.some((a) => a.assetId === assetId)) {
      skipped += 1;
      continue;
    }
    const asset = byId.get(assetId);
    if (!asset) continue;

    const artwork = hangAssetAsArtwork({
      asset,
      galleryId: input.galleryId,
      workspaceId: input.workspaceId,
      template: input.template,
      existing,
    });
    if (!artwork) break;

    const titled = {
      ...artwork,
      title: painting.title,
      year: painting.year,
      medium: painting.medium,
    };
    hung.push(titled);
    existing = [...existing, titled];
  }

  return {
    artworks: hung,
    assets: mergedAssets,
    hung: hung.length,
    skipped,
  };
}
