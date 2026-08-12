import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { PrintCatalogue } from "@/features/viewer/components/print-catalogue";
import { buildMaisonDemoManifest } from "@/features/viewer/lib/maison-demo-manifest";
import { getRequestLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Catalogue · Maison Salon",
  description: "Printable catalogue for the Maison Salon demo exhibition.",
  robots: { index: false, follow: false },
};

export default async function DemoMaisonCataloguePage() {
  const locale = await getRequestLocale();
  const manifest = buildMaisonDemoManifest(
    siteConfig.url,
    locale === "ar" ? "ar" : "en",
  );
  return (
    <PrintCatalogue
      manifest={manifest}
      walkHref="/demo/maison"
      listHref="/demo/maison?view=list"
    />
  );
}
