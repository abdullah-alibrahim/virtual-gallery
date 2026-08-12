import {
  ISMAIL_BOAT_WORKS,
  ISMAIL_TREE_WORKS,
  ISMAIL_WORKS,
  ismailAssetId,
  ismailTextureUrl,
} from "@/core/samples/ismail-rifai";
import {
  SAMPLE_PAINTINGS,
  isSampleAssetId,
  sampleAssetId,
  sampleTextureUrl,
} from "@/core/samples/sample-paintings";
import type { AssetListItem } from "@/infrastructure/firebase/assets-client";

/** Editor list entries for Ismail Rifai’s local pack. */
export function buildIsmailAssetListItems(
  workspaceId: string,
  works: readonly { id: string; file: string; widthPx: number; heightPx: number; dominantColor: string }[] = ISMAIL_WORKS,
): AssetListItem[] {
  return works.map((work) => {
    const url = ismailTextureUrl(work.file);
    return {
      id: ismailAssetId(work.id),
      workspaceId,
      status: "ready" as const,
      fileName: work.file,
      bytes: 0,
      mime: "image/jpeg",
      width: work.widthPx,
      height: work.heightPx,
      thumbUrl: url,
      blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
      dominantColor: work.dominantColor,
      textureFormat: "jpeg",
      error: null,
      createdAt: null,
    };
  });
}

export function buildIsmailBoatAssetListItems(workspaceId: string): AssetListItem[] {
  return buildIsmailAssetListItems(workspaceId, ISMAIL_BOAT_WORKS);
}

export function buildIsmailTreeAssetListItems(workspaceId: string): AssetListItem[] {
  return buildIsmailAssetListItems(workspaceId, ISMAIL_TREE_WORKS);
}

/** Editor / Assets-panel list entries for the starter pack. */
export function buildSampleAssetListItems(
  workspaceId: string,
): AssetListItem[] {
  return SAMPLE_PAINTINGS.map((painting) => {
    const url = sampleTextureUrl(painting.file);
    return {
      id: sampleAssetId(painting.id),
      workspaceId,
      status: "ready" as const,
      fileName: `${painting.title.replace(/\s+/g, "-").toLowerCase()}.jpg`,
      bytes: 0,
      mime: "image/jpeg",
      width: painting.widthPx,
      height: painting.heightPx,
      thumbUrl: url,
      blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
      dominantColor: painting.dominantColor,
      textureFormat: "jpeg",
      error: null,
      createdAt: null,
    };
  });
}

/** Merge workspace uploads with the starter pack (samples first). */
export function mergeAssetsWithSamples(
  workspaceAssets: readonly AssetListItem[],
  workspaceId: string,
): AssetListItem[] {
  const samples = buildSampleAssetListItems(workspaceId);
  const byId = new Map<string, AssetListItem>();
  for (const sample of samples) byId.set(sample.id, sample);
  for (const asset of workspaceAssets) {
    if (!isSampleAssetId(asset.id)) byId.set(asset.id, asset);
  }
  return [...byId.values()];
}
