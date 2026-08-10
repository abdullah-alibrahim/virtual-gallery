import type { Metadata } from "next";

import { LegalShell } from "@/components/shared/legal-shell";
import { siteConfig } from "@/config/site";
import { getPublicAuthCta } from "@/features/marketing/lib/nav-auth";

export const metadata: Metadata = {
  title: "Terms",
  robots: { index: true, follow: true },
};

export default async function TermsPage() {
  const authCta = await getPublicAuthCta();

  return (
    <LegalShell title="Terms of use" authCta={authCta}>
      <p>
        By creating an account you agree to use Virtual Gallery for lawful
        exhibitions of work you have the rights to display. You retain ownership
        of your artwork and originals.
      </p>
      <p>
        Free and paid plans are gated by published limits. We may suspend
        accounts that abuse storage, spam enquiries, or attempt to circumvent
        plan limits.
      </p>
      <p>
        The service is provided as-is during closed beta. Billing is handled by
        Stripe when enabled; cancellations take effect at period end.
      </p>
      <p className="text-sm text-muted-foreground">
        Last updated: 1 August 2026 · {siteConfig.name}
      </p>
    </LegalShell>
  );
}
