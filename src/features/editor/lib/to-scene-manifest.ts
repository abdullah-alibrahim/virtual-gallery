import type {
  Artwork,
  Gallery,
  SceneArtwork,
  SceneManifest,
  SceneTemplate,
} from "@/core/entities";
import { resolveSampleTextureUrl } from "@/core/samples/sample-paintings";
import { applyGalleryOverrides } from "@/core/services/apply-gallery-overrides";
import type { AssetListItem } from "@/infrastructure/firebase/assets-client";

/**
 * Compiles the in-memory editor draft into a SceneManifest for the shared
 * renderer. Missing textures fall back to a neutral placeholder so the room
 * stays walkable while assets process.
 */
export function editorDraftToManifest(input: {
  gallery: Gallery;
  template: SceneTemplate;
  artworks: readonly Artwork[];
  assets: readonly AssetListItem[];
  placeholderUrl: string;
}): SceneManifest {
  const byId = new Map(input.assets.map((a) => [a.id, a]));

  const artworks: SceneArtwork[] = [...input.artworks]
    .sort((a, b) => a.order - b.order)
    .map((artwork) => {
      const asset = byId.get(artwork.assetId);
      const sampleUrl = resolveSampleTextureUrl(artwork.assetId);
      const thumb = sampleUrl ?? asset?.thumbUrl ?? input.placeholderUrl;
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
        textures: {
          lod0: thumb,
          lod1: thumb,
          lod2: thumb,
        },
        meta: {
          aspectRatio:
            asset?.width && asset.height
              ? asset.width / asset.height
              : artwork.dimensions.width / artwork.dimensions.height,
          blurhash: asset?.blurhash ?? "",
        },
      };
    });

  return {
    version: 1,
    galleryId: input.gallery.id,
    slug: input.gallery.slug,
    publishedVersion: input.gallery.publishedVersion ?? 0,
    title: input.gallery.title,
    description: input.gallery.description,
    visibility: input.gallery.visibility,
    artist: {
      displayName: "Studio",
      slug: input.gallery.slug,
      allowInquiries: true,
    },
    template: applyGalleryOverrides(input.template, input.gallery),
    artworks,
    settings: {
      walkSpeed: input.gallery.settings.walkSpeed,
      showTitles: input.gallery.settings.showTitles,
      allowZoom: input.gallery.settings.allowZoom,
    },
    compiledAt: new Date().toISOString(),
  };
}
