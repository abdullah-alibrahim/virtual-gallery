import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { PersonalSpaceEditor } from "@/features/mockups";
import { buildProDemoManifest } from "@/features/viewer/lib/pro-demo-manifest";

export const metadata: Metadata = {
  title: "Your space · Pro demo",
  description: "Place a Pro demo painting on a photo of your own room.",
  robots: { index: false, follow: false },
};

export default async function DemoProSpacePage({
  searchParams,
}: {
  searchParams: Promise<{ artwork?: string }>;
}) {
  const { artwork: artworkId } = await searchParams;
  const manifest = buildProDemoManifest(siteConfig.url);
  const artwork =
    manifest.artworks.find((a) => a.id === artworkId) ??
    manifest.artworks[0];
  if (!artwork) notFound();

  return (
    <PersonalSpaceEditor
      artwork={artwork}
      artistName={manifest.artist.displayName}
      backHref="/demo/pro"
      mockupsHref={`/demo/pro/mockups?artwork=${encodeURIComponent(artwork.id)}`}
    />
  );
}
