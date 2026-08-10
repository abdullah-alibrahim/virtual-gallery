import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { NotFoundError } from "@/core/errors";
import { GalleryViewer } from "@/features/viewer/components/gallery-viewer";
import { loadPublishedManifestBySlug } from "@/infrastructure/publish/load-published-manifest";
import {
  buildGalleryJsonLd,
  buildVisualArtworkJsonLd,
} from "@/lib/seo/gallery-json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; artworkId: string }>;
}): Promise<Metadata> {
  const { slug, artworkId } = await params;
  try {
    const manifest = await loadPublishedManifestBySlug(slug);
    const artwork = manifest.artworks.find((a) => a.id === artworkId);
    if (!artwork) return { title: "Artwork not found", robots: { index: false } };

    const title = `${artwork.title} · ${manifest.title}`;
    const description =
      artwork.description ||
      `${artwork.title} in ${manifest.title} by ${manifest.artist.displayName}`;
    const image = artwork.textures.lod1 || artwork.textures.lod0;
    const url = `${siteConfig.url}/g/${manifest.slug}/a/${artwork.id}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        type: "article",
        url,
        images: [{ url: image }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: "Artwork not found", robots: { index: false } };
  }
}

export default async function ArtworkDeepLinkPage({
  params,
}: {
  params: Promise<{ slug: string; artworkId: string }>;
}) {
  const { slug, artworkId } = await params;

  let manifest;
  try {
    manifest = await loadPublishedManifestBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const artwork = manifest.artworks.find((a) => a.id === artworkId);
  if (!artwork) notFound();

  const galleryUrl = `${siteConfig.url}/g/${manifest.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildVisualArtworkJsonLd(artwork, manifest, galleryUrl),
      ...(buildGalleryJsonLd(manifest)["@graph"] as unknown[]).slice(0, 1),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GalleryViewer
        manifest={manifest}
        initialArtworkId={artworkId}
      />
    </>
  );
}
