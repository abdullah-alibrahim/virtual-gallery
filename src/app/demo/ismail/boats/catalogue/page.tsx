import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import {
  ISMAIL_BOATS_TITLE,
  ISMAIL_DISPLAY_NAME,
} from "@/core/samples/ismail-rifai";
import { PrintCatalogue } from "@/features/viewer/components/print-catalogue";
import { buildIsmailBoatsManifest } from "@/features/viewer/lib/ismail-rifai-manifest";
import { getRequestLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: `Catalogue · ${ISMAIL_DISPLAY_NAME} · ${ISMAIL_BOATS_TITLE}`,
  description: "Printable catalogue for Ismail Rifai’s Marakeb series.",
};

export default async function DemoIsmailBoatsCataloguePage() {
  const locale = await getRequestLocale();
  const manifest = buildIsmailBoatsManifest(siteConfig.url, locale);
  return (
    <PrintCatalogue
      manifest={manifest}
      walkHref="/demo/ismail/boats"
      listHref="/demo/ismail/boats?view=list"
    />
  );
}
