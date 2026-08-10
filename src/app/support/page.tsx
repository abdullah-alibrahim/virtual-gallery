import type { Metadata } from "next";
import Link from "next/link";

import { LegalShell } from "@/components/shared/legal-shell";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getPublicAuthCta } from "@/features/marketing/lib/nav-auth";
import { getTranslator } from "@/i18n/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: true, follow: true },
};

export default async function SupportPage() {
  const [{ t }, authCta] = await Promise.all([
    getTranslator(),
    getPublicAuthCta(),
  ]);
  const studioCta =
    authCta.href === "/dashboard"
      ? { href: "/dashboard", label: t("support.openStudio") }
      : { href: "/sign-in?force=1", label: t("common.signIn") };

  return (
    <LegalShell title={t("support.title")} authCta={authCta}>
      <p>{t("support.body")}</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <Link href="/demo/pro" className="underline">
            {t("support.tryPro")}
          </Link>
        </li>
        <li>
          <Link href="/demo/walk" className="underline">
            {t("support.walkQuiet")}
          </Link>
        </li>
        <li>
          <Link href="/templates" className="underline">
            {t("support.browseTemplates")}
          </Link>
        </li>
        <li>
          <Link href="/pricing" className="underline">
            {t("nav.pricing")}
          </Link>
        </li>
      </ul>
      <Link
        href={studioCta.href}
        className={cn(buttonVariants(), "mt-4 inline-flex w-fit")}
      >
        {studioCta.label}
      </Link>
      <p className="text-sm text-muted-foreground">{siteConfig.name}</p>
    </LegalShell>
  );
}
