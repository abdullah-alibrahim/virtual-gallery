import { describe, expect, it } from "vitest";

import {
  applyGalleryOverrides,
  resolveGalleryArchitecture,
  resolveGalleryEnvironment,
  resolveGalleryLighting,
} from "@/core/services/apply-gallery-overrides";
import { makeGallery, makeTemplate } from "@/core/__fixtures__/domain";

describe("resolveGalleryLighting", () => {
  const base = makeTemplate({
    lighting: {
      ambient: { color: "#ffffff", intensity: 0.4 },
      key: {
        color: "#fff8f0",
        intensity: 1.0,
        position: [0, 5, 2],
      },
      fill: {
        color: "#e2e8f0",
        intensity: 0.3,
        position: [3, 3, -2],
      },
      presets: [
        { id: "soft", label: "Soft", spotIntensity: 1.2, temperatureK: 4000 },
      ],
    },
  }).lighting;

  it("returns base when overrides are null", () => {
    expect(resolveGalleryLighting(base, null)).toBe(base);
  });

  it("overrides ambient / key / fill intensities", () => {
    const merged = resolveGalleryLighting(base, {
      ambientIntensity: 0.7,
      keyIntensity: 1.8,
      fillIntensity: 0.5,
    });
    expect(merged.ambient.intensity).toBe(0.7);
    expect(merged.key?.intensity).toBe(1.8);
    expect(merged.fill?.intensity).toBe(0.5);
    expect(base.ambient.intensity).toBe(0.4);
  });

  it("synthesizes key light when template omits it", () => {
    const sparse = makeTemplate().lighting;
    const merged = resolveGalleryLighting(sparse, { keyIntensity: 2.2 });
    expect(merged.key?.intensity).toBe(2.2);
    expect(merged.key?.position).toBeDefined();
  });

  it("applies warm bias to key colour", () => {
    const merged = resolveGalleryLighting(base, { warmCool: 1 });
    expect(merged.key?.color.toLowerCase()).not.toBe(
      base.key!.color.toLowerCase(),
    );
  });
});

describe("resolveGalleryEnvironment", () => {
  const base = makeTemplate().environment;

  it("merges exposure and background", () => {
    const merged = resolveGalleryEnvironment(base, {
      exposure: 1.4,
      background: "#101010",
    });
    expect(merged.exposure).toBe(1.4);
    expect(merged.background).toBe("#101010");
    expect(base.exposure).toBe(1);
  });
});

describe("resolveGalleryArchitecture", () => {
  const architecture = {
    skylight: { width: 4, depth: 6 },
    window: {
      wallId: "north",
      width: 2,
      height: 2.5,
    },
    benches: [
      {
        position: [0, 0, 0] as const,
        size: [1.4, 0.45, 0.45] as const,
      },
    ],
    signs: [
      {
        text: "Show",
        position: [0, 1.5, -4] as const,
      },
    ],
    trackLights: {
      axis: "x" as const,
      count: 2,
      intensity: 1.2,
    },
    glbProps: [
      {
        model: "plant" as const,
        position: [2, 0, 2] as const,
      },
      {
        model: "bust" as const,
        position: [-2, 0, 2] as const,
      },
    ],
  };

  it("hides benches, plants, signs, tracks, skylight, window", () => {
    const merged = resolveGalleryArchitecture(
      architecture,
      {
        showBenches: false,
        showPlants: false,
        showSigns: false,
        showTracks: false,
      },
      { skylightEnabled: false, windowEnabled: false },
      null,
    );
    expect(merged?.benches).toBeUndefined();
    expect(merged?.signs).toBeUndefined();
    expect(merged?.trackLights).toBeUndefined();
    expect(merged?.skylight).toBeUndefined();
    expect(merged?.window).toBeUndefined();
    expect(merged?.glbProps).toEqual([
      { model: "bust", position: [-2, 0, 2] },
    ]);
  });

  it("applies track intensity without removing tracks", () => {
    const merged = resolveGalleryArchitecture(
      architecture,
      null,
      null,
      { trackIntensity: 3.5 },
    );
    expect(merged?.trackLights?.intensity).toBe(3.5);
  });
});

describe("applyGalleryOverrides", () => {
  it("bakes materials, lighting, environment, and architecture together", () => {
    const template = makeTemplate({
      lighting: {
        ambient: { color: "#ffffff", intensity: 0.4 },
        key: {
          color: "#fff8f0",
          intensity: 1,
          position: [0, 5, 2],
        },
        presets: [
          { id: "soft", label: "Soft", spotIntensity: 1.2, temperatureK: 4000 },
        ],
      },
      architecture: {
        benches: [
          {
            position: [0, 0, 0],
            size: [1.2, 0.4, 0.4],
          },
        ],
        skylight: { width: 3, depth: 4 },
      },
    });

    const gallery = makeGallery({
      materialOverrides: { wall: "#112233", floorStyle: "stone" },
      lightingOverrides: { ambientIntensity: 0.9, keyIntensity: 2 },
      environmentOverrides: { exposure: 1.25, skylightEnabled: false },
      architectureOverrides: { showBenches: false },
    });

    const next = applyGalleryOverrides(template, gallery);
    expect(next).not.toBe(template);
    expect(next.materials.wall).toBe("#112233");
    expect(next.materials.floorStyle).toBe("stone");
    expect(next.lighting.ambient.intensity).toBe(0.9);
    expect(next.lighting.key?.intensity).toBe(2);
    expect(next.environment.exposure).toBe(1.25);
    expect(next.architecture?.skylight).toBeUndefined();
    expect(next.architecture?.benches).toBeUndefined();
    expect(template.architecture?.skylight).toBeDefined();
  });

  it("returns the same template when no overrides are set", () => {
    const template = makeTemplate();
    const gallery = makeGallery();
    expect(applyGalleryOverrides(template, gallery)).toBe(template);
  });
});
