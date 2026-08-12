import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ISMAIL_DISPLAY_NAME } from "@/core/samples/ismail-rifai";
import { PrintCatalogue } from "@/features/viewer/components/print-catalogue";
import { buildIsmailRifaiManifest } from "@/features/viewer/lib/ismail-rifai-manifest";
import { getRequestLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: `Catalogue · ${ISMAIL_DISPLAY_NAME}`,
  description: "Printable catalogue for Ismail Rifai’s Hall — all sections.",
};

export default async function DemoIsmailCataloguePage() {
  const locale = await getRequestLocale();
  const manifest = buildIsmailRifaiManifest(siteConfig.url, locale);
  return (
    <PrintCatalogue
      manifest={manifest}
      walkHref="/demo/ismail"
      listHref="/demo/ismail?view=list"
    />
  );
}
