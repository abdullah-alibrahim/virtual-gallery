import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ISMAIL_DISPLAY_NAME } from "@/core/samples/ismail-rifai";
import { GalleryViewer } from "@/features/viewer/components/gallery-viewer";
import { buildIsmailRifaiManifest } from "@/features/viewer/lib/ismail-rifai-manifest";
import { buildGalleryJsonLd } from "@/lib/seo/gallery-json-ld";

export const metadata: Metadata = {
  title: `${ISMAIL_DISPLAY_NAME} · The Hall`,
  description:
    "Walk Ismail Rifai’s Mega Wing — Roads, Figures, Marakeb, and Bait Al Shamsi Tree. No sign-in required.",
};

/**
 * Public Ismail Rifai exhibition — hung from his Facebook works, no auth.
 */
export default async function DemoIsmailPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const manifest = buildIsmailRifaiManifest(siteConfig.url);
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
        listHref="/demo/ismail?view=list"
        walkHref="/demo/ismail"
        catalogueHref="/demo/ismail/catalogue"
        mockupRouteKind="demo"
      />
    </>
  );
}
