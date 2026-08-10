import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { GalleryViewer } from "@/features/viewer/components/gallery-viewer";
import { buildDemoManifest } from "@/features/viewer/lib/demo-manifest";
import { buildGalleryJsonLd } from "@/lib/seo/gallery-json-ld";

export const metadata: Metadata = {
  title: "Walk a gallery",
  description:
    "A walkable Modern White room — nine large hung works, first-person controls.",
  robots: { index: false, follow: false },
};

/**
 * Demo walk — same public viewer chrome as published galleries.
 */
export default async function DemoWalkPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const manifest = buildDemoManifest(siteConfig.url);
  const jsonLd = buildGalleryJsonLd(manifest);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GalleryViewer
        manifest={manifest}
        initialMode={view === "list" ? "list" : "walk"}
        listHref="/demo/walk?view=list"
        walkHref="/demo/walk"
        catalogueHref="/demo/walk/catalogue"
        mockupRouteKind="demo"
      />
    </>
  );
}
