import { describe, expect, it } from "vitest";

import {
  modernWhiteTemplate,
  softMuseumTemplate,
} from "@/core/templates";

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
});
