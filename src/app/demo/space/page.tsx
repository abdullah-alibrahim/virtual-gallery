import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { PersonalSpaceEditor } from "@/features/mockups";
import { buildDemoManifest } from "@/features/viewer/lib/demo-manifest";

export const metadata: Metadata = {
  title: "Your space · Quiet Rooms demo",
  description: "Place a demo painting on a photo of your own room.",
  robots: { index: false, follow: false },
};

export default async function DemoSpacePage({
  searchParams,
}: {
  searchParams: Promise<{ artwork?: string }>;
}) {
  const { artwork: artworkId } = await searchParams;
  const manifest = buildDemoManifest(siteConfig.url);
  const artwork =
    manifest.artworks.find((a) => a.id === artworkId) ??
    manifest.artworks[0];
  if (!artwork) notFound();

  return (
    <PersonalSpaceEditor
      artwork={artwork}
      artistName={manifest.artist.displayName}
      backHref="/demo/walk"
      mockupsHref={`/demo/mockups?artwork=${encodeURIComponent(artwork.id)}`}
    />
  );
}
