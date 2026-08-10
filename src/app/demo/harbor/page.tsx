import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { GalleryViewer } from "@/features/viewer/components/gallery-viewer";
import { buildHarborDemoManifest } from "@/features/viewer/lib/harbor-demo-manifest";
import { buildGalleryJsonLd } from "@/lib/seo/gallery-json-ld";

export const metadata: Metadata = {
  title: "Walk Harbor Pavilion",
  description:
    "Walk Harbor Pavilion — a bright coastal gallery with pale stone and morning light. No sign-in required.",
  robots: { index: false, follow: false },
};

/**
 * Public Harbor Pavilion walk demo — free flagship coastal hall.
 */
export default async function DemoHarborPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const manifest = buildHarborDemoManifest(siteConfig.url);
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
        listHref="/demo/harbor?view=list"
        walkHref="/demo/harbor"
        catalogueHref="/demo/harbor/catalogue"
        mockupRouteKind="demo"
      />
    </>
  );
}
