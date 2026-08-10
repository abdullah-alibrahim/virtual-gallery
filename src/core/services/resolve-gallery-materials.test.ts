import { describe, expect, it } from "vitest";

import {
  applyMaterialOverrides,
  resolveGalleryMaterials,
} from "@/core/services/resolve-gallery-materials";
import { makeTemplate } from "@/core/__fixtures__/domain";

describe("resolveGalleryMaterials", () => {
  const base = makeTemplate().materials;

  it("returns base materials when overrides are null", () => {
    expect(resolveGalleryMaterials(base, null)).toBe(base);
    expect(resolveGalleryMaterials(base, undefined)).toBe(base);
  });

  it("merges partial wall and floor overrides", () => {
    const merged = resolveGalleryMaterials(base, {
      wall: "#112233",
      floor: "#445566",
      floorStyle: "stone",
    });
    expect(merged.wall).toBe("#112233");
    expect(merged.floor).toBe("#445566");
    expect(merged.floorStyle).toBe("stone");
    expect(merged.ceiling).toBe(base.ceiling);
    expect(merged.trim).toBe(base.trim);
  });

  it("merges floor and wall texture catalogue ids", () => {
    const merged = resolveGalleryMaterials(base, {
      floorTextureId: "wood_deck",
      wallTextureId: "plaster_paint",
      ceilingTextureId: "plaster",
    });
    expect(merged.floorTextureId).toBe("wood_deck");
    expect(merged.wallTextureId).toBe("plaster_paint");
    expect(merged.ceilingTextureId).toBe("plaster");
  });

  it("clears texture ids when set to none", () => {
    const withMaps = {
      ...base,
      floorTextureId: "concrete",
      wallTextureId: "plaster",
    };
    const merged = resolveGalleryMaterials(withMaps, {
      floorTextureId: "none",
      wallTextureId: "none",
    });
    expect(merged.floorTextureId).toBeUndefined();
    expect(merged.wallTextureId).toBeUndefined();
    expect(merged.floor).toBe(base.floor);
  });

  it("ignores unknown texture ids", () => {
    const merged = resolveGalleryMaterials(base, {
      floorTextureId: "not-a-real-texture",
    });
    expect(merged.floorTextureId).toBeUndefined();
  });

  it("merges museum wall-band overrides", () => {
    const withBand = resolveGalleryMaterials(
      { ...base, wallBand: "#888888", wallBandBottomM: 1, wallBandTopM: 2 },
      { wallBand: "#9a9a9a", wallBandBottomM: 0.9 },
    );
    expect(withBand.wallBand).toBe("#9a9a9a");
    expect(withBand.wallBandBottomM).toBe(0.9);
    expect(withBand.wallBandTopM).toBe(2);
  });

  it("disables wall band when wallBandEnabled is false", () => {
    const withBand = {
      ...base,
      wallBand: "#888888",
      wallBandBottomM: 1,
      wallBandTopM: 2,
    };
    const merged = resolveGalleryMaterials(withBand, {
      wallBandEnabled: false,
    });
    expect(merged.wallBand).toBeUndefined();
    expect(withBand.wallBand).toBe("#888888");
  });

  it("enables a default wall band when wallBandEnabled is true", () => {
    const merged = resolveGalleryMaterials(base, { wallBandEnabled: true });
    expect(merged.wallBand).toBeDefined();
    expect(merged.wallBandBottomM).toBe(0.9);
    expect(merged.wallBandTopM).toBe(2.4);
  });
});

describe("applyMaterialOverrides", () => {
  it("clones the template with merged materials", () => {
    const template = makeTemplate();
    const next = applyMaterialOverrides(template, {
      wall: "#aa0000",
      floorStyle: "parquet",
    });
    expect(next).not.toBe(template);
    expect(next.materials.wall).toBe("#aa0000");
    expect(next.materials.floorStyle).toBe("parquet");
    expect(template.materials.wall).not.toBe("#aa0000");
  });

  it("returns the same template reference when overrides are absent", () => {
    const template = makeTemplate();
    expect(applyMaterialOverrides(template, null)).toBe(template);
  });
});
