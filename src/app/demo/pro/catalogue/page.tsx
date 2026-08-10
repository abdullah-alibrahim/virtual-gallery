import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { PrintCatalogue } from "@/features/viewer/components/print-catalogue";
import { buildProDemoManifest } from "@/features/viewer/lib/pro-demo-manifest";

export const metadata: Metadata = {
  title: "Catalogue · Mega Wing",
  description: "Printable catalogue for the Pro Mega Wing demo exhibition.",
  robots: { index: false, follow: false },
};

export default function DemoProCataloguePage() {
  const manifest = buildProDemoManifest(siteConfig.url);
  return (
    <PrintCatalogue
      manifest={manifest}
      walkHref="/demo/pro"
      listHref="/demo/pro?view=list"
    />
  );
}
