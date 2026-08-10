import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { GalleryViewer } from "@/features/viewer/components/gallery-viewer";
import { buildProDemoManifest } from "@/features/viewer/lib/pro-demo-manifest";
import { buildGalleryJsonLd } from "@/lib/seo/gallery-json-ld";

export const metadata: Metadata = {
  title: "Try the Pro hall",
  description:
    "Walk Mega Wing — a massive Pro gallery with twin side wings. No sign-in required.",
  robots: { index: false, follow: false },
};

/**
 * Public Pro walk demo — Mega Wing, logged-out visitors welcome.
 */
export default async function DemoProPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const manifest = buildProDemoManifest(siteConfig.url);
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
        listHref="/demo/pro?view=list"
        walkHref="/demo/pro"
        catalogueHref="/demo/pro/catalogue"
        mockupRouteKind="demo-pro"
      />
    </>
  );
}
