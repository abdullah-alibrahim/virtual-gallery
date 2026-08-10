import { describe, expect, it } from "vitest";

import { modernWhiteTemplate } from "@/core/templates";
import { hangAssetAsArtwork } from "@/features/editor/lib/hang-artwork";
import type { AssetListItem } from "@/infrastructure/firebase/assets-client";

function asset(id: string): AssetListItem {
  return {
    id,
    workspaceId: "w1",
    status: "ready",
    fileName: "dawn-study.jpg",
    bytes: 1000,
    mime: "image/jpeg",
    width: 1200,
    height: 900,
    thumbUrl: "https://cdn.test/thumb.webp",
    blurhash: null,
    dominantColor: null,
    textureFormat: "webp",
    error: null,
    createdAt: new Date(),
  };
}

describe("hangAssetAsArtwork", () => {
  it("places a work on a preferred Modern White anchor", () => {
    const artwork = hangAssetAsArtwork({
      asset: asset("a1"),
      galleryId: "g1",
      workspaceId: "w1",
      template: modernWhiteTemplate,
      existing: [],
    });

    expect(artwork).not.toBeNull();
    expect(artwork?.title).toBe("Dawn Study");
    expect(artwork?.placement.autoPlaced).toBe(true);
    expect(artwork?.placement.wallId).toBeTruthy();
    expect(artwork?.placement.anchorIndex).not.toBeNull();
  });

  it("does not stack a larger hang onto an occupied preferred anchor", () => {
    const small = hangAssetAsArtwork({
      asset: asset("small"),
      galleryId: "g1",
      workspaceId: "w1",
      template: modernWhiteTemplate,
      existing: [],
    });
    expect(small).not.toBeNull();

    // Wider than the first asset so balanced arrange would prefer this draft
    // for the preferred slot if existing auto-placements were reshuffled.
    // Keep under ~2m so it still fits Modern White envelopes.
    const largeAsset: AssetListItem = {
      ...asset("large"),
      width: 1800,
      height: 900,
    };
    const large = hangAssetAsArtwork({
      asset: largeAsset,
      galleryId: "g1",
      workspaceId: "w1",
      template: modernWhiteTemplate,
      existing: [small!],
    });
    expect(large).not.toBeNull();

    expect(`${large!.placement.wallId}:${large!.placement.anchorIndex}`).not.toBe(
      `${small!.placement.wallId}:${small!.placement.anchorIndex}`,
    );
    expect(large!.placement.position).not.toEqual(small!.placement.position);
  });

  it("returns null when every anchor is occupied", () => {
    let filled: NonNullable<ReturnType<typeof hangAssetAsArtwork>>[] = [];
    for (let i = 0; i < 20; i++) {
      const next = hangAssetAsArtwork({
        asset: asset(`fill-${i}`),
        galleryId: "g1",
        workspaceId: "w1",
        template: modernWhiteTemplate,
        existing: filled,
      });
      if (!next) break;
      filled = [...filled, next];
    }

    expect(filled.length).toBeGreaterThan(0);
    expect(
      hangAssetAsArtwork({
        asset: asset("overflow"),
        galleryId: "g1",
        workspaceId: "w1",
        template: modernWhiteTemplate,
        existing: filled,
      }),
    ).toBeNull();
  });
});
