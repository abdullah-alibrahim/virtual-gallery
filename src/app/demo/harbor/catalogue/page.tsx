import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { PrintCatalogue } from "@/features/viewer/components/print-catalogue";
import { buildHarborDemoManifest } from "@/features/viewer/lib/harbor-demo-manifest";

export const metadata: Metadata = {
  title: "Catalogue · Harbor Pavilion",
  description: "Printable catalogue for the Harbor Pavilion demo exhibition.",
  robots: { index: false, follow: false },
};

export default function DemoHarborCataloguePage() {
  const manifest = buildHarborDemoManifest(siteConfig.url);
  return (
    <PrintCatalogue
      manifest={manifest}
      walkHref="/demo/harbor"
      listHref="/demo/harbor?view=list"
    />
  );
}
