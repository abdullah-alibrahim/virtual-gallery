import type { Metadata } from "next";

import {
  MarketingFooter,
  MarketingNav,
} from "@/components/shared/marketing-nav";
import { TemplatesShowcase } from "@/features/marketing/components/templates-showcase";
import { getMarketingNavAuth } from "@/features/marketing/lib/nav-auth";
import { getTranslator } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Templates",
  description: "Gallery templates for Virtual Gallery — real rooms, not themes.",
};

export default async function TemplatesPage() {
  const [{ cta, secondaryCta }, { t }] = await Promise.all([
    getMarketingNavAuth(),
    getTranslator(),
  ]);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="atmosphere-drift absolute -inset-[10%] bg-[radial-gradient(ellipse_70%_50%_at_40%_-5%,oklch(0.93_0.02_90),transparent),radial-gradient(ellipse_45%_40%_at_95%_60%,oklch(0.91_0.02_210_/0.16),transparent)]" />
        <div className="absolute inset-0 surface-grain opacity-60" />
      </div>

      <MarketingNav
        links={[
          { href: "/pricing", label: t("nav.pricing") },
          { href: "/demo/pro", label: t("nav.demo") },
        ]}
        cta={cta}
        secondaryCta={secondaryCta}
      />

      <TemplatesShowcase />
      <MarketingFooter />
    </main>
  );
}
