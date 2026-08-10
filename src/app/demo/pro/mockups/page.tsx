import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { RoomMockupViewer } from "@/features/mockups";
import { buildProDemoManifest } from "@/features/viewer/lib/pro-demo-manifest";

export const metadata: Metadata = {
  title: "Room preview · Pro demo",
  description:
    "See how a Pro demo painting looks on living-room, office, salon, gallery, and restaurant walls.",
  robots: { index: false, follow: false },
};

export default async function DemoProMockupsPage({
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
    <RoomMockupViewer
      artwork={artwork}
      artistName={manifest.artist.displayName}
      backHref="/demo/pro"
      spaceHref={`/demo/pro/space?artwork=${encodeURIComponent(artwork.id)}`}
    />
  );
}
