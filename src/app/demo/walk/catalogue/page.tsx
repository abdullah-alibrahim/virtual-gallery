import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { PrintCatalogue } from "@/features/viewer/components/print-catalogue";
import { buildDemoManifest } from "@/features/viewer/lib/demo-manifest";

export const metadata: Metadata = {
  title: "Catalogue · Quiet Rooms",
  description: "Printable catalogue for the Quiet Rooms demo exhibition.",
  robots: { index: false, follow: false },
};

export default function DemoWalkCataloguePage() {
  const manifest = buildDemoManifest(siteConfig.url);
  return (
    <PrintCatalogue
      manifest={manifest}
      walkHref="/demo/walk"
      listHref="/demo/walk?view=list"
    />
  );
}
