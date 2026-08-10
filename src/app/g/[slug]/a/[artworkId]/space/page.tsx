import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NotFoundError } from "@/core/errors";
import { PersonalSpaceEditor } from "@/features/mockups";
import { loadPublishedManifestBySlug } from "@/infrastructure/publish/load-published-manifest";

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
    return {
      title: `Your space · ${artwork.title}`,
      description: `Place ${artwork.title} on a photo of your own room.`,
      robots: { index: false, follow: true },
    };
  } catch {
    return { title: "Your space", robots: { index: false } };
  }
}

export default async function ArtworkPersonalSpacePage({
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

  return (
    <PersonalSpaceEditor
      artwork={artwork}
      artistName={manifest.artist.displayName}
      backHref={`/g/${manifest.slug}/a/${artwork.id}`}
      mockupsHref={`/g/${manifest.slug}/a/${artwork.id}/mockups`}
    />
  );
}
