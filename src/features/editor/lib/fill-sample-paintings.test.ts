import { describe, expect, it } from "vitest";

import { modernWhiteTemplate } from "@/core/templates";
import { isSampleAssetId } from "@/core/samples/sample-paintings";
import { fillWithSamplePaintings } from "@/features/editor/lib/fill-sample-paintings";
import { buildSampleAssetListItems } from "@/features/editor/lib/sample-assets";

describe("fillWithSamplePaintings", () => {
  it("builds ready AssetListItems for the editor", () => {
    const assets = buildSampleAssetListItems("ws-1");
    expect(assets).toHaveLength(9);
    expect(
      assets.every((a) => a.status === "ready" && a.thumbUrl?.endsWith(".jpg")),
    ).toBe(true);
  });

  it("fills Modern White anchors with curated sample titles", () => {
    const result = fillWithSamplePaintings({
      galleryId: "g1",
      workspaceId: "ws-1",
      template: modernWhiteTemplate,
      existing: [],
      assets: [],
    });

    expect(result.hung).toBe(9);
    expect(result.artworks.map((a) => a.title)).toContain("The Starry Night");
    expect(result.artworks.map((a) => a.title)).toContain("Sunflowers");
    expect(result.artworks.every((a) => isSampleAssetId(a.assetId))).toBe(true);
    expect(result.artworks.every((a) => a.placement.anchorIndex !== null)).toBe(
      true,
    );
  });

  it("does not stack sample paintings on the same wall anchor", () => {
    const result = fillWithSamplePaintings({
      galleryId: "g1",
      workspaceId: "ws-1",
      template: modernWhiteTemplate,
      existing: [],
      assets: [],
    });

    expect(result.hung).toBe(9);

    const keys = result.artworks.map(
      (a) => `${a.placement.wallId}:${a.placement.anchorIndex}`,
    );
    expect(new Set(keys).size).toBe(keys.length);

    const positions = result.artworks.map((a) =>
      a.placement.position.map((n) => n.toFixed(3)).join(","),
    );
    expect(new Set(positions).size).toBe(positions.length);

    const wallsUsed = new Set(result.artworks.map((a) => a.placement.wallId));
    expect(wallsUsed.size).toBeGreaterThan(1);
  });

  it("skips samples that are already hanging", () => {
    const first = fillWithSamplePaintings({
      galleryId: "g1",
      workspaceId: "ws-1",
      template: modernWhiteTemplate,
      existing: [],
      assets: [],
    });
    const second = fillWithSamplePaintings({
      galleryId: "g1",
      workspaceId: "ws-1",
      template: modernWhiteTemplate,
      existing: first.artworks,
      assets: first.assets,
    });
    expect(second.hung).toBe(0);
    expect(second.skipped).toBe(9);
  });
});
