"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLockup } from "@/components/shared/house-mark";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SiteSocialLinks } from "@/components/shared/social-links";
import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

export type MarketingNavCta = { href: string; label: string };

/**
 * Shared marketing header — brand left, sparse nav right.
 * Brand remains serif-forward so pages survive without the rest of the chrome.
 * Pass auth-aware CTAs from the page (Studio vs Sign in + Create).
 * Labels may be pre-translated by the server, or pass keys via MarketingNavLinks.
 */
export function MarketingNav({
  links,
  cta,
  secondaryCta,
  showTheme = false,
}: {
  links?: MarketingNavCta[];
  /** Primary action — typically Sign in or Studio. */
  cta: MarketingNavCta;
  /** Optional text action — typically Create when signed out. */
  secondaryCta?: MarketingNavCta | null;
  showTheme?: boolean;
}) {
  const t = useT();

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:gap-4 sm:px-8">
      <BrandLockup nameClassName="text-xl sm:text-2xl" />
      <nav
        className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-sm text-muted-foreground sm:gap-x-5"
        aria-label={t("nav.marketing")}
      >
        {links?.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
        <LanguageSwitcher />
        {showTheme ? <ThemeToggle /> : null}
        {secondaryCta ? (
          <Link href={secondaryCta.href} className="hover:text-foreground">
            {secondaryCta.label}
          </Link>
        ) : null}
        <Link
          href={cta.href}
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          {cta.label}
        </Link>
      </nav>
    </header>
  );
}

export function MarketingFooter({
  extra,
}: {
  extra?: ReactNode;
}) {
  const t = useT();

  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-col gap-6 border-t border-border px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-sm text-muted-foreground sm:px-8">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <BrandLockup nameClassName="text-base sm:text-lg text-foreground" />
        <Link href="/templates" className="hover:text-foreground">
          {t("nav.templates")}
        </Link>
        <Link href="/demo" className="hover:text-foreground">
          {t("nav.demos")}
        </Link>
        <Link href="/pricing" className="hover:text-foreground">
          {t("nav.pricing")}
        </Link>
        <Link href="/sign-in?force=1" className="hover:text-foreground">
          {t("common.signIn")}
        </Link>
        <Link href="/support" className="hover:text-foreground">
          {t("nav.support")}
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          {t("nav.privacy")}
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          {t("nav.terms")}
        </Link>
        <LanguageSwitcher size="xs" />
        {extra}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tracking-[0.16em] uppercase text-muted-foreground/80">
          {t("landing.followUs")}
        </p>
        <SiteSocialLinks />
      </div>
    </footer>
  );
}
