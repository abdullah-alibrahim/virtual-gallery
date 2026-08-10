/**
 * Domain fixtures for unit tests.
 *
 * Builders take partial overrides so a test states only the field it cares
 * about. Keeping them here means adding a required field to an entity breaks in
 * one place instead of across every test file.
 */

import type {
  ArtistProfile,
  Artwork,
  Asset,
  Gallery,
  GallerySettings,
  Template,
  TemplateAnchor,
  TemplateWall,
} from "@/core/entities";
import {
  createDimensions,
  createFrameSpec,
  toAspectRatio,
  toSlug,
} from "@/core/value-objects";

const EPOCH = new Date("2026-01-01T00:00:00.000Z");

export function makeWall(
  id: string,
  anchors: Array<{ preferred?: boolean; maxW?: number; maxH?: number }>,
  overrides: Partial<TemplateWall> = {},
): TemplateWall {
  return {
    id,
    label: id,
    origin: [0, 0, 0],
    normal: [0, 0, 1],
    width: 8,
    height: 3.5,
    anchors: anchors.map(
      (a, i): TemplateAnchor => ({
        position: [i * 2 - 2, 1.6, 0.05],
        maxWidth: a.maxW ?? 2,
        maxHeight: a.maxH ?? 2,
        ...(a.preferred !== undefined ? { preferred: a.preferred } : {}),
      }),
    ),
    ...overrides,
  };
}

export function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: "modern-white",
    version: 1,
    name: "Modern White",
    tagline: "Clean walls, soft light",
    category: "white",
    tier: "free",
    status: "active",
    shell: { glbPath: "/t/modern-white/v1/shell.glb", scale: 1 },
    environment: { exposure: 1, background: "#f5f5f2", toneMapping: "aces" },
    lighting: {
      ambient: { color: "#ffffff", intensity: 0.4 },
      presets: [
        { id: "soft", label: "Soft", spotIntensity: 1.2, temperatureK: 4000 },
      ],
    },
    materials: {
      wall: "#f7f6f2",
      floor: "#e8e6df",
      ceiling: "#faf9f6",
      trim: "#d9d6ce",
    },
    walls: [makeWall("north", [{ preferred: true }, {}, {}])],
    spawn: { position: [0, 1.6, 4], yaw: 0 },
    walkBounds: [
      [-4, -4],
      [4, -4],
      [4, 4],
      [-4, 4],
    ],
    capacity: { recommended: 8, max: 12 },
    frameDefaults: createFrameSpec({ style: "gallery", color: "#1a1a1a" }),
    preview: { imagePath: "/t/modern-white/preview.jpg" },
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

export function makeSettings(
  overrides: Partial<GallerySettings> = {},
): GallerySettings {
  return {
    walkSpeed: 1.4,
    showTitles: true,
    allowZoom: true,
    allowDownload: false,
    ambientAudioAssetId: null,
    lightingPreset: "soft",
    ...overrides,
  };
}

export function makeGallery(overrides: Partial<Gallery> = {}): Gallery {
  return {
    id: "g1",
    workspaceId: "w1",
    ownerId: "u1",
    title: "Quiet Rooms",
    description: "Twelve oils painted between 2023 and 2025.",
    templateId: "modern-white",
    templateVersion: 1,
    slug: toSlug("quiet-rooms"),
    status: "draft",
    visibility: "public",
    publishedVersion: null,
    publishedAt: null,
    manifestPath: null,
    hasUnpublishedChanges: true,
    cover: null,
    seo: { title: null, description: null, ogPath: null },
    settings: makeSettings(),
    materialOverrides: null,
    lightingOverrides: null,
    environmentOverrides: null,
    architectureOverrides: null,
    counters: { views: 0, uniqueVisitors: 0, artworkClicks: 0, leads: 0 },
    artworkCount: 0,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    deletedAt: null,
    ...overrides,
  };
}

export function makeArtwork(
  id: string,
  overrides: Partial<Artwork> = {},
): Artwork {
  return {
    id,
    galleryId: "g1",
    workspaceId: "w1",
    assetId: `asset-${id}`,
    order: 0,
    title: id,
    description: "",
    year: 2024,
    medium: "Oil on linen",
    category: null,
    dimensions: createDimensions(100, 80, "cm"),
    price: null,
    availability: "available",
    frame: createFrameSpec({ style: "gallery", color: "#1a1a1a" }),
    placement: {
      wallId: "north",
      anchorIndex: null,
      position: [0, 1.6, 0.05],
      rotation: [0, 0, 0],
      scale: 1,
      autoPlaced: true,
    },
    lighting: { enabled: true, intensity: 1, angle: 0.5, temperatureK: 4000 },
    media: {
      audioAssetId: null,
      videoUrl: null,
      hotspot: { enabled: true, offset: [0, 0, 0.1] },
    },
    commerce: { externalUrl: null, allowInquiries: true },
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

/** A fully processed image asset — the only state that may be published. */
export function makeAsset(id: string, overrides: Partial<Asset> = {}): Asset {
  return {
    id,
    workspaceId: "w1",
    kind: "image",
    status: "ready",
    original: {
      path: `workspaces/w1/originals/${id}.tif`,
      bytes: 12_000_000,
      mime: "image/tiff",
      width: 4000,
      height: 3200,
    },
    variants: {
      ktx2_512: `https://cdn.test/${id}/512.ktx2`,
      ktx2_1024: `https://cdn.test/${id}/1024.ktx2`,
      ktx2_2048: `https://cdn.test/${id}/2048.ktx2`,
      thumb_512: `https://cdn.test/${id}/thumb.webp`,
      audio_m4a: null,
    },
    meta: {
      aspectRatio: toAspectRatio(4000, 3200),
      dominantColor: "#8a8478",
      blurhash: "LEHV6nWB2yk8",
      exif: null,
    },
    error: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

export function makeProfile(
  overrides: Partial<ArtistProfile> = {},
): ArtistProfile {
  return {
    workspaceId: "w1",
    slug: toSlug("mona-atelier"),
    displayName: "Mona Atelier",
    bio: "Painter based in Amman.",
    statement: "",
    avatarUrl: null,
    coverUrl: null,
    location: "Amman, Jordan",
    socials: {
      website: "https://mona.atelier.example",
      instagram: "mona.atelier",
      twitter: "monaatelier",
      behance: "https://www.behance.net/monaatelier",
    },
    contact: { allowInquiries: true, showEmail: false },
    featuredGalleryIds: [],
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

/** Builds the `assets` map `compileSceneManifest` expects from a list. */
export function assetMap(assets: readonly Asset[]): Map<string, Asset> {
  return new Map(assets.map((a) => [a.id, a]));
}
