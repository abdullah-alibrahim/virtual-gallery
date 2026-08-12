import { describe, expect, it } from "vitest";

import {
  modernWhiteTemplate,
  softMuseumTemplate,
} from "@/core/templates";

import { DEMO_ARTWORK_PIXELS } from "./demo-artwork-pixels";
import { buildMarketingPreviewArtworks } from "./marketing-preview-artworks";

describe("buildMarketingPreviewArtworks", () => {
  it("hangs demo textures on preferred anchors", () => {
    const artworks = buildMarketingPreviewArtworks(softMuseumTemplate, 5);
    expect(artworks.length).toBe(5);
    expect(artworks.every((a) => a.textures.lod0.startsWith("/demo/"))).toBe(
      true,
    );
    expect(artworks[0]?.placement.position[2]).toBeLessThan(0);
  });

  it("respects max and works for Modern White", () => {
    const artworks = buildMarketingPreviewArtworks(modernWhiteTemplate, 3);
    expect(artworks).toHaveLength(3);
    expect(artworks[0]?.id).toContain("modern-white");
  });

  it("hangs each demo JPEG at its native pixel aspect", () => {
    const artworks = buildMarketingPreviewArtworks(softMuseumTemplate, 9);
    expect(artworks).toHaveLength(9);
    for (const [index, artwork] of artworks.entries()) {
      const file = DEMO_ARTWORK_PIXELS[index]!;
      const hung = artwork.dimensions.width / artwork.dimensions.height;
      const native = file.widthPx / file.heightPx;
      expect(Math.abs(hung - native)).toBeLessThan(0.04);
      expect(artwork.meta.aspectRatio).toBeCloseTo(native, 5);
    }
    const landscape = artworks[0]!;
    const portrait = artworks[1]!;
    expect(landscape.dimensions.width).toBeGreaterThan(landscape.dimensions.height);
    expect(portrait.dimensions.height).toBeGreaterThan(portrait.dimensions.width);
  });
});
