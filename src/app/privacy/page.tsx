import type { Metadata } from "next";

import { LegalShell } from "@/components/shared/legal-shell";
import { siteConfig } from "@/config/site";
import { getPublicAuthCta } from "@/features/marketing/lib/nav-auth";

export const metadata: Metadata = {
  title: "Privacy",
  robots: { index: true, follow: true },
};

export default async function PrivacyPage() {
  const authCta = await getPublicAuthCta();

  return (
    <LegalShell title="Privacy policy" authCta={authCta}>
      <p>
        Virtual Gallery stores account data, gallery drafts, and derived image
        variants to run the product. Original uploads stay in private storage and
        are never served to visitors.
      </p>
      <p>
        Published exhibitions are delivered as compiled scene manifests on a CDN.
        Analytics events (views, artwork clicks) are aggregated for the artist and
        are not sold.
      </p>
      <p>
        Enquiry forms collect name, email, and message solely to deliver that
        message to the artist. Contact{" "}
        <a className="underline" href="mailto:privacy@virtual.gallery">
          privacy@virtual.gallery
        </a>{" "}
        for data requests.
      </p>
      <p className="text-sm text-muted-foreground">
        Last updated: 1 August 2026 · {siteConfig.name}
      </p>
    </LegalShell>
  );
}
