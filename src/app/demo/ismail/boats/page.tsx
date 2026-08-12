import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import {
  ISMAIL_BOATS_TITLE,
  ISMAIL_DISPLAY_NAME,
} from "@/core/samples/ismail-rifai";
import { GalleryViewer } from "@/features/viewer/components/gallery-viewer";
import { buildIsmailBoatsManifest } from "@/features/viewer/lib/ismail-rifai-manifest";
import { buildGalleryJsonLd } from "@/lib/seo/gallery-json-ld";

export const metadata: Metadata = {
  title: `${ISMAIL_DISPLAY_NAME} · ${ISMAIL_BOATS_TITLE}`,
  description:
    "Walk Ismail Rifai’s Marakeb boat series in the Pro Noir Salon. No sign-in required.",
};

/**
 * Public Ismail Rifai Marakeb exhibition — boat paintings, no auth.
 */
export default async function DemoIsmailBoatsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const manifest = buildIsmailBoatsManifest(siteConfig.url);
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
        listHref="/demo/ismail/boats?view=list"
        walkHref="/demo/ismail/boats"
        catalogueHref="/demo/ismail/boats/catalogue"
        mockupRouteKind="demo"
      />
    </>
  );
}
