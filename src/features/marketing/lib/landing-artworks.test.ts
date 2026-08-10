import { describe, expect, it } from "vitest";

import { buildLandingArtworks } from "./landing-artworks";

describe("buildLandingArtworks", () => {
  it("fills the Soft Museum show walls with textured pieces", () => {
    const artworks = buildLandingArtworks();
    expect(artworks.length).toBeGreaterThanOrEqual(7);
    for (const art of artworks) {
      expect(art.textures.lod0).toMatch(/^\/demo\/artworks\/\d+\.jpg$/);
      expect(art.lighting.enabled).toBe(true);
      expect(art.lighting.intensity).toBeGreaterThan(1);
      expect(art.frame.widthCm).toBeGreaterThanOrEqual(3.5);
    }
  });

  it("puts the centrepiece on the north wall for the first glance", () => {
    const centre = buildLandingArtworks().find((a) => a.id === "hero-orbit");
    expect(centre).toBeDefined();
    expect(centre!.placement.position[0]).toBeCloseTo(0, 5);
    expect(centre!.placement.position[2]).toBeLessThan(-5);
  });
});
