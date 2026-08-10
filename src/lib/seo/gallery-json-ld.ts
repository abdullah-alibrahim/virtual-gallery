import type { SceneArtwork, SceneManifest } from "@/core/entities";
import { siteConfig } from "@/config/site";

/**
 * JSON-LD for a published gallery. Lighthouse SEO scores this; crawlers that
 * never run WebGL still understand the exhibition and each work.
 */
export function buildGalleryJsonLd(manifest: SceneManifest) {
  const url = `${siteConfig.url}/g/${manifest.slug}`;
  const artworks = manifest.artworks.map((artwork) =>
    buildVisualArtworkJsonLd(artwork, manifest, url),
  );

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ExhibitionEvent",
        "@id": `${url}#exhibition`,
        name: manifest.title,
        description: manifest.description || undefined,
        url,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        isAccessibleForFree: true,
        organizer: {
          "@type": "Person",
          name: manifest.artist.displayName,
          url: `${siteConfig.url}/a/${manifest.artist.slug}`,
        },
        about: artworks.map((a) => ({ "@id": a["@id"] })),
      },
      ...artworks,
    ],
  };
}

export function buildVisualArtworkJsonLd(
  artwork: SceneArtwork,
  manifest: SceneManifest,
  galleryUrl: string,
) {
  const artworkUrl = `${galleryUrl}/a/${artwork.id}`;
  return {
    "@type": "VisualArtwork",
    "@id": `${artworkUrl}#artwork`,
    name: artwork.title,
    description: artwork.description || undefined,
    url: artworkUrl,
    image: artwork.textures.lod1 || artwork.textures.lod0,
    creator: {
      "@type": "Person",
      name: manifest.artist.displayName,
    },
    ...(artwork.year ? { dateCreated: String(artwork.year) } : {}),
    ...(artwork.medium ? { artMedium: artwork.medium } : {}),
    ...(artwork.category ? { artform: artwork.category } : {}),
    width: {
      "@type": "Distance",
      name: `${artwork.dimensions.width} ${artwork.dimensions.unit}`,
    },
    height: {
      "@type": "Distance",
      name: `${artwork.dimensions.height} ${artwork.dimensions.unit}`,
    },
    isPartOf: { "@id": `${galleryUrl}#exhibition` },
  };
}
