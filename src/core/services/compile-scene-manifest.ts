import { SceneInvalidError } from "@/core/errors";

import type {
  ArtistProfile,
  ArtistSocials,
  Artwork,
  Asset,
  Gallery,
  GalleryEnvironment,
  SceneArtwork,
  SceneManifest,
  SceneTemplate,
} from "../entities";
import { applyGalleryOverrides } from "./apply-gallery-overrides";
import { validateScene } from "./validate-scene";

export interface CompileInput {
  readonly gallery: Gallery;
  readonly artworks: readonly Artwork[];
  readonly template: SceneTemplate;
  readonly profile: ArtistProfile;
  readonly environment: GalleryEnvironment | null;
  /** Every asset referenced by an artwork or by gallery audio, keyed by id. */
  readonly assets: ReadonlyMap<string, Asset>;
  readonly publishedVersion: number;
  readonly compiledAt: Date;
}

/**
 * Compiles a publishable `SceneManifest`.
 *
 * Publishing is a compile step, not a status flag. The output is a
 * self-contained JSON document written to an immutable CDN path, which is why
 * the public viewer performs zero database reads: the template, absolute
 * texture URLs, and artist details are all inlined, and nothing is resolved at
 * runtime.
 *
 * Throws `SceneInvalidError` carrying every blocker at once, so the editor can
 * highlight them all inline instead of surfacing them one failed publish at a
 * time. A partially valid scene is never emitted.
 */
export function compileSceneManifest(input: CompileInput): SceneManifest {
  const assetReady = new Map<string, boolean>();
  for (const artwork of input.artworks) {
    assetReady.set(
      artwork.assetId,
      isRenderable(input.assets.get(artwork.assetId)),
    );
  }

  const issues = validateScene({
    artworks: input.artworks,
    template: input.template,
    settings: input.gallery.settings,
    assetReady,
  });
  if (issues.length > 0) throw new SceneInvalidError(issues);

  const artworks = [...input.artworks]
    .sort((a, b) => a.order - b.order)
    .map((artwork) => toSceneArtwork(artwork, input.assets));

  const ambientAudioUrl = resolveAmbientAudio(input);
  const template = toSceneTemplate(
    applyGalleryOverrides(input.template, input.gallery),
  );

  return {
    version: 1,
    galleryId: input.gallery.id,
    slug: input.gallery.slug,
    publishedVersion: input.publishedVersion,
    title: input.gallery.title,
    description: input.gallery.description,
    visibility: input.gallery.visibility,
    artist: {
      displayName: input.profile.displayName,
      slug: input.profile.slug,
      ...(input.profile.avatarUrl
        ? { avatarUrl: input.profile.avatarUrl }
        : {}),
      allowInquiries: input.profile.contact.allowInquiries,
      contact: {
        allowInquiries: input.profile.contact.allowInquiries,
        showEmail: input.profile.contact.showEmail,
      },
      ...(hasSocials(input.profile.socials)
        ? { socials: input.profile.socials }
        : {}),
    },
    ...(input.gallery.seo.website
      ? { galleryWebsite: input.gallery.seo.website }
      : {}),
    template,
    artworks,
    settings: {
      walkSpeed: input.gallery.settings.walkSpeed,
      showTitles: input.gallery.settings.showTitles,
      allowZoom: input.gallery.settings.allowZoom,
      ...(ambientAudioUrl ? { ambientAudioUrl } : {}),
      ...(input.gallery.settings.eveningTour?.enabled
        ? { eveningTour: input.gallery.settings.eveningTour }
        : {}),
    },
    compiledAt: input.compiledAt.toISOString(),
  };
}

function hasSocials(socials: ArtistSocials | undefined): boolean {
  if (!socials) return false;
  return Boolean(
    socials.website ||
      socials.facebook ||
      socials.instagram ||
      socials.twitter ||
      socials.linkedin ||
      socials.behance,
  );
}

/**
 * An asset is renderable only when the whole LOD ladder exists. Publishing with
 * one LOD missing would show a blank canvas to visitors whose device happens to
 * request that level.
 */
function isRenderable(asset: Asset | undefined): boolean {
  if (!asset || asset.status !== "ready") return false;
  const { ktx2_512, ktx2_1024, ktx2_2048 } = asset.variants;
  return Boolean(ktx2_512 && ktx2_1024 && ktx2_2048);
}

function toSceneTemplate(template: SceneTemplate): SceneTemplate {
  return {
    id: template.id,
    version: template.version,
    name: template.name,
    tagline: template.tagline,
    category: template.category,
    tier: template.tier,
    status: template.status,
    shell: template.shell,
    environment: template.environment,
    lighting: template.lighting,
    materials: template.materials,
    ...(template.architecture ? { architecture: template.architecture } : {}),
    walls: template.walls,
    spawn: template.spawn,
    walkBounds: template.walkBounds,
    capacity: template.capacity,
    frameDefaults: template.frameDefaults,
    preview: template.preview,
  };
}

function toSceneArtwork(
  artwork: Artwork,
  assets: ReadonlyMap<string, Asset>,
): SceneArtwork {
  const asset = assets.get(artwork.assetId);
  const { ktx2_512, ktx2_1024, ktx2_2048 } = asset?.variants ?? {
    ktx2_512: null,
    ktx2_1024: null,
    ktx2_2048: null,
  };

  // validateScene already rejected unready assets; this keeps the types honest
  // rather than asserting non-null.
  if (!asset || !ktx2_512 || !ktx2_1024 || !ktx2_2048) {
    throw new SceneInvalidError([
      {
        kind: "asset-not-ready",
        message: `Asset for "${artwork.title}" is not renderable`,
        artworkId: artwork.id,
      },
    ]);
  }

  const assetAudioUrl = artwork.media.audioAssetId
    ? assets.get(artwork.media.audioAssetId)?.variants.audio_m4a
    : null;
  const audioUrl =
    assetAudioUrl ??
    (artwork.media.audioUrl?.trim() ? artwork.media.audioUrl.trim() : null);

  const media =
    audioUrl || artwork.media.videoUrl
      ? {
          ...(audioUrl ? { audioUrl } : {}),
          ...(artwork.media.videoUrl
            ? { videoUrl: artwork.media.videoUrl }
            : {}),
        }
      : null;

  const innerWorld = artwork.media.innerWorld ?? null;

  return {
    id: artwork.id,
    title: artwork.title,
    description: artwork.description,
    ...(artwork.year !== null ? { year: artwork.year } : {}),
    ...(artwork.medium !== null ? { medium: artwork.medium } : {}),
    ...(artwork.category !== null ? { category: artwork.category } : {}),
    dimensions: artwork.dimensions,
    ...(artwork.price !== null ? { price: artwork.price } : {}),
    availability: artwork.availability,
    frame: artwork.frame,
    placement: {
      position: artwork.placement.position,
      rotation: artwork.placement.rotation,
      scale: artwork.placement.scale,
    },
    lighting: artwork.lighting,
    textures: { lod0: ktx2_2048, lod1: ktx2_1024, lod2: ktx2_512 },
    ...(asset.variants.thumb_512
      ? { previewUrl: asset.variants.thumb_512 }
      : {}),
    meta: {
      aspectRatio:
        asset.meta.aspectRatio ??
        artwork.dimensions.width / artwork.dimensions.height,
      blurhash: asset.meta.blurhash ?? "",
    },
    ...(media ? { media } : {}),
    ...(innerWorld ? { innerWorld } : {}),
  };
}

/** Gallery-level ambient audio wins over the environment's background track. */
function resolveAmbientAudio(input: CompileInput): string | null {
  const assetId =
    input.gallery.settings.ambientAudioAssetId ??
    input.environment?.bgmAssetId ??
    null;
  if (!assetId) return null;
  return input.assets.get(assetId)?.variants.audio_m4a ?? null;
}

/**
 * Immutable, versioned Storage paths. Versioning is what lets the manifest carry
 * a one-year cache header and makes rollback a single pointer write.
 */
export function manifestPath(slug: string, version: number): string {
  return `published/${slug}/v${version}/manifest.json`;
}

export function ogImagePath(slug: string, version: number): string {
  return `published/${slug}/v${version}/og.jpg`;
}

/** Short-cached pointer at the live version. Flipping this is the commit point. */
export function latestPointerPath(slug: string): string {
  return `published/${slug}/latest.json`;
}

export interface LatestPointer {
  readonly galleryId: string;
  readonly slug: string;
  readonly version: number;
  readonly manifestPath: string;
  readonly publishedAt: string;
}
