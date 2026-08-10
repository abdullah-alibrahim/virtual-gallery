import { describe, expect, it } from "vitest";

import { modernWhiteTemplate } from "@/core/templates";
import type { Artwork, Gallery } from "@/core/entities";
import { makeArtwork, makeGallery } from "@/core/__fixtures__/domain";

/**
 * Lighting preset application mirrors editor-store.applyLightingPreset.
 */
function applyLightingPreset(
  gallery: Gallery,
  artworks: Artwork[],
  presetId: string,
): { gallery: Gallery; artworks: Artwork[] } | null {
  const preset = modernWhiteTemplate.lighting.presets.find(
    (p) => p.id === presetId,
  );
  if (!preset) return null;
  return {
    gallery: {
      ...gallery,
      settings: { ...gallery.settings, lightingPreset: preset.id },
    },
    artworks: artworks.map((artwork) =>
      artwork.lighting.enabled
        ? {
            ...artwork,
            lighting: {
              ...artwork.lighting,
              intensity: preset.spotIntensity,
              temperatureK: preset.temperatureK,
            },
          }
        : artwork,
    ),
  };
}

describe("lighting preset application", () => {
  it("updates gallery setting and enabled artwork spots", () => {
    const gallery = makeGallery({
      templateId: modernWhiteTemplate.id,
      settings: {
        walkSpeed: 1.5,
        showTitles: true,
        allowZoom: true,
        allowDownload: false,
        ambientAudioAssetId: null,
        lightingPreset: "soft",
      },
    });
    const lit = makeArtwork("lit", {
      lighting: {
        enabled: true,
        intensity: 0.5,
        angle: Math.PI / 6,
        temperatureK: 3000,
      },
    });
    const dark = makeArtwork("dark", {
      lighting: {
        enabled: false,
        intensity: 0.5,
        angle: Math.PI / 6,
        temperatureK: 3000,
      },
    });

    const next = applyLightingPreset(gallery, [lit, dark], "bright");
    expect(next).not.toBeNull();
    expect(next!.gallery.settings.lightingPreset).toBe("bright");
    expect(next!.artworks[0]!.lighting.intensity).toBe(1.2);
    expect(next!.artworks[0]!.lighting.temperatureK).toBe(4500);
    expect(next!.artworks[1]!.lighting.intensity).toBe(0.5);
  });
});
