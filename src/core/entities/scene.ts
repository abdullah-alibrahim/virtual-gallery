import type {
  Availability,
  ArtworkLighting,
  ArtworkPlacement,
  GalleryVisibility,
} from "./gallery";
import type { ArtistContact, ArtistSocials } from "./workspace";
import type { Dimensions } from "@/core/value-objects/dimensions";
import type { FrameSpec } from "@/core/value-objects/frame-spec";
import type { Money } from "@/core/value-objects/money";
import type { Template } from "./asset";

/**
 * The compiled artefact written to CDN on publish. The public viewer downloads
 * exactly one of these and renders it — zero Firestore reads.
 *
 * Schema version is bumped when the shape changes. Viewers migrate forward;
 * they never break on an older published version.
 */
export interface SceneManifest {
  readonly version: 1;
  readonly galleryId: string;
  readonly slug: string;
  readonly publishedVersion: number;
  readonly title: string;
  readonly description: string;
  readonly artist: SceneArtist;
  /**
   * Optional gallery / institution website from `gallery.seo.website`.
   * Prefer `artist.socials.website` when both exist.
   */
  readonly galleryWebsite?: string;
  /**
   * Optional for older CDN manifests. Newer compiles include it so the walk
   * chrome can show a private-link badge for unlisted exhibitions.
   */
  readonly visibility?: GalleryVisibility;
  /** Inlined so the viewer resolves nothing at runtime. */
  readonly template: SceneTemplate;
  readonly artworks: readonly SceneArtwork[];
  readonly settings: SceneSettings;
  readonly compiledAt: string;
}

/**
 * The template as it appears inside a manifest. Audit timestamps are dropped
 * because the manifest is JSON on a CDN — a `Date` would come back as a string
 * and silently break the type contract. The viewer has no use for them anyway.
 */
export type SceneTemplate = Omit<Template, "createdAt" | "updatedAt">;

export interface SceneArtist {
  readonly displayName: string;
  readonly slug: string;
  readonly avatarUrl?: string;
  readonly allowInquiries: boolean;
  readonly contact?: Pick<ArtistContact, "allowInquiries" | "showEmail">;
  /** Public socials inlined at publish — viewer needs no Firestore. */
  readonly socials?: ArtistSocials;
}

export interface SceneArtwork {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly year?: number;
  readonly medium?: string;
  readonly category?: string;
  readonly dimensions: Dimensions;
  readonly price?: Money;
  readonly availability: Availability;
  readonly frame: FrameSpec;
  readonly placement: Pick<ArtworkPlacement, "position" | "rotation" | "scale">;
  readonly lighting: ArtworkLighting;
  /** Absolute CDN URLs. The LOD manager picks based on camera distance. */
  readonly textures: {
    readonly lod0: string;
    readonly lod1: string;
    readonly lod2: string;
  };
  readonly meta: {
    readonly aspectRatio: number;
    readonly blurhash: string;
  };
  readonly media?: {
    readonly audioUrl?: string;
    readonly videoUrl?: string;
  };
}

export interface SceneSettings {
  readonly walkSpeed: number;
  readonly showTitles: boolean;
  readonly allowZoom: boolean;
  readonly ambientAudioUrl?: string;
}

/**
 * Proposed placement returned by `arrangeArtworks`. The editor applies these
 * as a batch of commands so the whole arrange is one undoable step.
 */
export interface PlacementProposal {
  readonly artworkId: string;
  readonly wallId: string;
  readonly anchorIndex: number;
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly scale: number;
  readonly lighting: Pick<ArtworkLighting, "intensity" | "angle" | "temperatureK">;
}
