import { describe, expect, it } from "vitest";

import {
  assetMap,
  makeArtwork,
  makeAsset,
  makeGallery,
  makeProfile,
  makeTemplate,
  makeWall,
} from "@/core/__fixtures__/domain";
import { SceneInvalidError } from "@/core/errors";
import {
  compileSceneManifest,
  latestPointerPath,
  manifestPath,
  ogImagePath,
} from "@/core/services/compile-scene-manifest";

describe("compileSceneManifest", () => {
  it("compiles a ready gallery into a self-contained manifest", () => {
    const artwork = makeArtwork("dawn", {
      order: 0,
      title: "Dawn Study",
      year: 2024,
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });
    const asset = makeAsset(artwork.assetId);
    const compiledAt = new Date("2026-08-01T12:00:00.000Z");

    const manifest = compileSceneManifest({
      gallery: makeGallery({ title: "Quiet Rooms" }),
      artworks: [artwork],
      template: makeTemplate(),
      profile: makeProfile(),
      environment: null,
      assets: assetMap([asset]),
      publishedVersion: 1,
      compiledAt,
    });

    expect(manifest.version).toBe(1);
    expect(manifest.publishedVersion).toBe(1);
    expect(manifest.compiledAt).toBe(compiledAt.toISOString());
    expect(manifest.visibility).toBe("public");
    expect(manifest.artist.displayName).toBe("Mona Atelier");
    expect(manifest.artworks).toHaveLength(1);
    expect(manifest.artworks[0]).toMatchObject({
      id: "dawn",
      title: "Dawn Study",
      year: 2024,
      textures: {
        lod0: asset.variants.ktx2_2048,
        lod1: asset.variants.ktx2_1024,
        lod2: asset.variants.ktx2_512,
      },
    });
    // Dates stripped — manifest must be JSON-safe.
    expect(manifest.template).not.toHaveProperty("createdAt");
    expect(manifest.template).not.toHaveProperty("updatedAt");
    expect(manifest.template.id).toBe("modern-white");
  });

  it("orders artworks by order before emitting", () => {
    const first = makeArtwork("a", {
      order: 2,
      title: "Last",
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });
    const second = makeArtwork("b", {
      order: 0,
      title: "First",
      placement: {
        wallId: "north",
        anchorIndex: 1,
        position: [2, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });

    const manifest = compileSceneManifest({
      gallery: makeGallery(),
      artworks: [first, second],
      template: makeTemplate(),
      profile: makeProfile(),
      environment: null,
      assets: assetMap([makeAsset(first.assetId), makeAsset(second.assetId)]),
      publishedVersion: 1,
      compiledAt: new Date(0),
    });

    expect(manifest.artworks.map((a) => a.id)).toEqual(["b", "a"]);
  });

  it("rejects an empty gallery with SceneInvalidError", () => {
    expect(() =>
      compileSceneManifest({
        gallery: makeGallery(),
        artworks: [],
        template: makeTemplate(),
        profile: makeProfile(),
        environment: null,
        assets: assetMap([]),
        publishedVersion: 1,
        compiledAt: new Date(0),
      }),
    ).toThrow(SceneInvalidError);
  });

  it("rejects when an artwork asset is still processing", () => {
    const artwork = makeArtwork("slow", {
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });
    const asset = makeAsset(artwork.assetId, {
      status: "processing",
      variants: {
        ktx2_512: null,
        ktx2_1024: null,
        ktx2_2048: null,
        thumb_512: null,
        audio_m4a: null,
      },
    });

    try {
      compileSceneManifest({
        gallery: makeGallery(),
        artworks: [artwork],
        template: makeTemplate(),
        profile: makeProfile(),
        environment: null,
        assets: assetMap([asset]),
        publishedVersion: 1,
        compiledAt: new Date(0),
      });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(SceneInvalidError);
      const issues = (error as SceneInvalidError).issues;
      expect(issues.some((i) => i.kind === "asset-not-ready")).toBe(true);
    }
  });

  it("rejects when capacity is exceeded", () => {
    const template = makeTemplate({
      walls: [makeWall("north", [{}, {}, {}])],
      capacity: { recommended: 1, max: 1 },
    });
    const artworks = [
      makeArtwork("a", {
        placement: {
          wallId: "north",
          anchorIndex: 0,
          position: [0, 1.6, 0.05],
          rotation: [0, 0, 0],
          scale: 1,
          autoPlaced: true,
        },
      }),
      makeArtwork("b", {
        order: 1,
        placement: {
          wallId: "north",
          anchorIndex: 1,
          position: [2, 1.6, 0.05],
          rotation: [0, 0, 0],
          scale: 1,
          autoPlaced: true,
        },
      }),
    ];

    expect(() =>
      compileSceneManifest({
        gallery: makeGallery(),
        artworks,
        template,
        profile: makeProfile(),
        environment: null,
        assets: assetMap(artworks.map((a) => makeAsset(a.assetId))),
        publishedVersion: 1,
        compiledAt: new Date(0),
      }),
    ).toThrow(SceneInvalidError);
  });

  it("inlines ambient audio from gallery settings when present", () => {
    const artwork = makeArtwork("piece", {
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });
    const audio = makeAsset("ambience", {
      kind: "audio",
      variants: {
        ktx2_512: null,
        ktx2_1024: null,
        ktx2_2048: null,
        thumb_512: null,
        audio_m4a: "https://cdn.test/ambience.m4a",
      },
    });

    const manifest = compileSceneManifest({
      gallery: makeGallery({
        settings: {
          walkSpeed: 1.4,
          showTitles: true,
          allowZoom: true,
          allowDownload: false,
          ambientAudioAssetId: "ambience",
          lightingPreset: "soft",
        },
      }),
      artworks: [artwork],
      template: makeTemplate(),
      profile: makeProfile(),
      environment: null,
      assets: assetMap([makeAsset(artwork.assetId), audio]),
      publishedVersion: 2,
      compiledAt: new Date(0),
    });

    expect(manifest.settings.ambientAudioUrl).toBe(
      "https://cdn.test/ambience.m4a",
    );
  });

  it("bakes gallery materialOverrides into the published template", () => {
    const artwork = makeArtwork("dawn", {
      order: 0,
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });

    const manifest = compileSceneManifest({
      gallery: makeGallery({
        materialOverrides: {
          wall: "#1a1a1a",
          floor: "#2b2b2b",
          floorStyle: "stone",
        },
      }),
      artworks: [artwork],
      template: makeTemplate(),
      profile: makeProfile(),
      environment: null,
      assets: assetMap([makeAsset(artwork.assetId)]),
      publishedVersion: 1,
      compiledAt: new Date(0),
    });

    expect(manifest.template.materials).toMatchObject({
      wall: "#1a1a1a",
      floor: "#2b2b2b",
      floorStyle: "stone",
    });
  });

  it("bakes lighting and architecture overrides into the published template", () => {
    const artwork = makeArtwork("dusk", {
      order: 0,
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });

    const manifest = compileSceneManifest({
      gallery: makeGallery({
        lightingOverrides: { ambientIntensity: 0.85, keyIntensity: 1.7 },
        environmentOverrides: { exposure: 1.3, background: "#0a0a0a" },
        architectureOverrides: { showBenches: false },
      }),
      artworks: [artwork],
      template: makeTemplate({
        lighting: {
          ambient: { color: "#ffffff", intensity: 0.4 },
          key: {
            color: "#fff8f0",
            intensity: 1,
            position: [0, 5, 2],
          },
          presets: [
            {
              id: "soft",
              label: "Soft",
              spotIntensity: 1.2,
              temperatureK: 4000,
            },
          ],
        },
        architecture: {
          benches: [
            {
              position: [0, 0, 0],
              size: [1.2, 0.4, 0.4],
            },
          ],
        },
      }),
      profile: makeProfile(),
      environment: null,
      assets: assetMap([makeAsset(artwork.assetId)]),
      publishedVersion: 1,
      compiledAt: new Date(0),
    });

    expect(manifest.template.lighting.ambient.intensity).toBe(0.85);
    expect(manifest.template.lighting.key?.intensity).toBe(1.7);
    expect(manifest.template.environment.exposure).toBe(1.3);
    expect(manifest.template.environment.background).toBe("#0a0a0a");
    expect(manifest.template.architecture?.benches).toBeUndefined();
  });
});

describe("manifest paths", () => {
  it("versions every published artefact", () => {
    expect(manifestPath("quiet-rooms", 3)).toBe(
      "published/quiet-rooms/v3/manifest.json",
    );
    expect(ogImagePath("quiet-rooms", 3)).toBe(
      "published/quiet-rooms/v3/og.jpg",
    );
    expect(latestPointerPath("quiet-rooms")).toBe(
      "published/quiet-rooms/latest.json",
    );
  });
});
