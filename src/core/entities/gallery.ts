import type { TemplateMaterials } from "@/core/entities/asset";
import type { Dimensions } from "@/core/value-objects/dimensions";
import type { FrameSpec } from "@/core/value-objects/frame-spec";
import type { Money } from "@/core/value-objects/money";
import type { Slug } from "@/core/value-objects/slug";

/**
 * Per-gallery surface overrides. Extends template materials with a band toggle
 * so artists can enable/disable the museum dado without mutating the catalogue.
 */
export type GalleryMaterialOverrides = Partial<TemplateMaterials> & {
  /** When false, strips wallBand even if the template defines one. */
  readonly wallBandEnabled?: boolean;
};

/**
 * Room-light / track / exhibition-spot overrides. Multipliers and absolute
 * intensities are applied at compile/preview — catalogue lighting is untouched.
 */
export interface GalleryLightingOverrides {
  readonly ambientIntensity?: number;
  readonly keyIntensity?: number;
  readonly fillIntensity?: number;
  readonly rimIntensity?: number;
  /** Absolute intensity for architecture track rails (when present). */
  readonly trackIntensity?: number;
  /** Gallery-wide artwork spot intensity (applied to enabled spots). */
  readonly spotIntensity?: number;
  /** Gallery-wide artwork colour temperature (Kelvin). */
  readonly temperatureK?: number;
  /** Warm (+) / cool (−) bias for key + ambient, range −1…1. */
  readonly warmCool?: number;
}

/** Background / exposure / daylight feature overrides. */
export interface GalleryEnvironmentOverrides {
  readonly exposure?: number;
  readonly background?: string;
  /** When false, hides the coffered skylight cut (architecture must have one). */
  readonly skylightEnabled?: boolean;
  /** When false, hides the morning/daylight window (architecture must have one). */
  readonly windowEnabled?: boolean;
}

/** Show/hide dressing already present on the template architecture. */
export interface GalleryArchitectureOverrides {
  readonly showBenches?: boolean;
  readonly showPlants?: boolean;
  readonly showSigns?: boolean;
  readonly showTracks?: boolean;
  readonly showPlinths?: boolean;
  readonly showBeams?: boolean;
}

export type GalleryStatus =
  | "draft"
  | "published"
  | "unpublished"
  | "archived";

export type GalleryVisibility = "public" | "unlisted" | "password";

/**
 * Top-level aggregate. Carries `workspaceId` as a field rather than living
 * under a workspace path so a gallery is addressable by a single id in every
 * URL and function call, and so security rules reduce to one claim comparison.
 */
export interface Gallery {
  readonly id: string;
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly title: string;
  readonly description: string;
  readonly templateId: string;
  readonly templateVersion: number;
  readonly slug: Slug;
  readonly status: GalleryStatus;
  readonly visibility: GalleryVisibility;
  readonly publishedVersion: number | null;
  readonly publishedAt: Date | null;
  readonly manifestPath: string | null;
  readonly hasUnpublishedChanges: boolean;
  readonly cover: GalleryCover | null;
  readonly seo: GallerySeo;
  readonly settings: GallerySettings;
  /**
   * Per-gallery wall/floor/ceiling overrides. Merged onto the template at
   * compile/preview time — never writes back to the shared template catalogue.
   */
  readonly materialOverrides: GalleryMaterialOverrides | null;
  /** Room lights, tracks, and gallery-wide spot defaults. */
  readonly lightingOverrides: GalleryLightingOverrides | null;
  /** Exposure / background / skylight-window visibility. */
  readonly environmentOverrides: GalleryEnvironmentOverrides | null;
  /** Show/hide benches, plants, signs, tracks, etc. */
  readonly architectureOverrides: GalleryArchitectureOverrides | null;
  readonly counters: GalleryCounters;
  readonly artworkCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface GalleryCover {
  readonly assetId: string;
  readonly thumbUrl: string;
  readonly blurhash: string;
}

export interface GallerySeo {
  readonly title: string | null;
  readonly description: string | null;
  readonly ogPath: string | null;
  /**
   * Optional exhibition / institution site. Artist profile socials take
   * precedence in the viewer; this fills in when the artist has no website.
   */
  readonly website?: string | null;
}

export interface GallerySettings {
  readonly walkSpeed: number;
  readonly showTitles: boolean;
  readonly allowZoom: boolean;
  /** Always false in the viewer. Artists' originals never leave private storage. */
  readonly allowDownload: false;
  readonly ambientAudioAssetId: string | null;
  readonly lightingPreset: string;
}

export interface GalleryCounters {
  readonly views: number;
  readonly uniqueVisitors: number;
  readonly artworkClicks: number;
  readonly leads: number;
  /** Guestbook ♥ reactions from the public walk (optional on older docs). */
  readonly hearts?: number;
  /** Guestbook “I visited” marks (optional on older docs). */
  readonly guestbookVisits?: number;
}

export type Availability =
  | "available"
  | "sold"
  | "reserved"
  | "nfs"
  | "priceOnRequest";

/**
 * The aggregate root for one painting. Placement lives here, not in a scene
 * document, so every drag is one document write and two people editing do not
 * collide on a shared blob.
 *
 * Titles, spotlights, and hotspots are DERIVED at render time from this
 * document — they are never stored as separate entities. Rename an artwork and
 * the plate, the hotspot label, the detail sheet, and the OG image all follow.
 */
export interface Artwork {
  readonly id: string;
  readonly galleryId: string;
  readonly workspaceId: string;
  readonly assetId: string;
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly year: number | null;
  readonly medium: string | null;
  readonly category: string | null;
  readonly dimensions: Dimensions;
  readonly price: Money | null;
  readonly availability: Availability;
  readonly frame: FrameSpec;
  readonly placement: ArtworkPlacement;
  readonly lighting: ArtworkLighting;
  readonly media: ArtworkMedia;
  readonly commerce: ArtworkCommerce;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Where and how the artwork hangs. Coordinates are metres relative to the
 * template's world origin. `autoPlaced` is true until the artist moves it —
 * that flag is what lets "Auto arrange" leave hand-positioned works alone.
 */
export interface ArtworkPlacement {
  readonly wallId: string;
  readonly anchorIndex: number | null;
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly scale: number;
  readonly autoPlaced: boolean;
  /** When true, drag / arrange / distribute leave this work alone. */
  readonly locked?: boolean;
}

export interface ArtworkLighting {
  readonly enabled: boolean;
  readonly intensity: number;
  readonly angle: number;
  readonly temperatureK: number;
}

export interface ArtworkMedia {
  readonly audioAssetId: string | null;
  readonly videoUrl: string | null;
  readonly hotspot: {
    readonly enabled: boolean;
    readonly offset: readonly [number, number, number];
  };
}

export interface ArtworkCommerce {
  readonly externalUrl: string | null;
  readonly allowInquiries: boolean;
}

export interface GalleryEnvironment {
  readonly hdriAssetId: string | null;
  readonly exposure: number;
  readonly fog: { readonly color: string; readonly near: number; readonly far: number } | null;
  readonly bgmAssetId: string | null;
  readonly camera: {
    readonly spawn: readonly [number, number, number];
    readonly yaw: number;
  };
}
