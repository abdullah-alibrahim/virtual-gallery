import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { RoomMockupViewer } from "@/features/mockups";
import { buildDemoManifest } from "@/features/viewer/lib/demo-manifest";

export const metadata: Metadata = {
  title: "Room preview · Quiet Rooms demo",
  description:
    "See how a demo painting looks on living-room, office, salon, gallery, and restaurant walls.",
  robots: { index: false, follow: false },
};

export default async function DemoMockupsPage({
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
    <RoomMockupViewer
      artwork={artwork}
      artistName={manifest.artist.displayName}
      backHref="/demo/walk"
      spaceHref={`/demo/space?artwork=${encodeURIComponent(artwork.id)}`}
    />
  );
}
