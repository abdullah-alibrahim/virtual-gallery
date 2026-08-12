import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { GalleryViewer } from "@/features/viewer/components/gallery-viewer";
import { buildMaisonDemoManifest } from "@/features/viewer/lib/maison-demo-manifest";
import { getRequestLocale } from "@/i18n/server";
import { buildGalleryJsonLd } from "@/lib/seo/gallery-json-ld";

export const metadata: Metadata = {
  title: "Walk Maison Salon",
  description:
    "Walk Maison Salon — ivory plaster, brass light, polished limestone. A haute private viewing room. No sign-in.",
  robots: { index: false, follow: false },
};

/**
 * Public Maison Salon walk — luxurious interior demo.
 */
export default async function DemoMaisonPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const locale = await getRequestLocale();
  const manifest = buildMaisonDemoManifest(
    siteConfig.url,
    locale === "ar" ? "ar" : "en",
  );
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
        listHref="/demo/maison?view=list"
        walkHref="/demo/maison"
        catalogueHref="/demo/maison/catalogue"
        mockupRouteKind="demo"
        useRoom={{ templateId: "maison-salon", title: "Maison Salon" }}
      />
    </>
  );
}
