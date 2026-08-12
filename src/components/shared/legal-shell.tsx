"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function LegalShell({
  title,
  children,
  authCta = { href: "/sign-in?force=1", label: "Sign in" },
}: {
  title: string;
  children: ReactNode;
  /** Auth-aware CTA from the page (Studio vs Sign in). */
  authCta?: { href: string; label: string };
}) {
  const t = useT();

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="atmosphere-drift absolute -inset-[10%] bg-[radial-gradient(ellipse_60%_40%_at_20%_0%,oklch(0.94_0.02_90),transparent),radial-gradient(ellipse_40%_30%_at_100%_40%,oklch(0.92_0.015_210_/0.12),transparent)]" />
        <div className="absolute inset-0 surface-grain opacity-40" />
      </div>
      <main className="relative mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-center justify-between gap-3 page-enter">
          <Link
            href="/"
            className="font-serif text-xl tracking-tight sm:text-2xl"
          >
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href={authCta.href}
              className={cn(
                buttonVariants({ size: "sm", variant: "secondary" }),
              )}
            >
              {authCta.label}
            </Link>
          </div>
        </div>
        <div className="space-y-4 page-enter">
          <div aria-hidden className="rule-grow h-px w-12 bg-foreground/25" />
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
            {title}
          </h1>
        </div>
        <div className="flex flex-col gap-5 text-base leading-relaxed text-muted-foreground stagger-fade stagger-fade-1">
          {children}
        </div>
        <nav
          aria-label="Legal"
          className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-8 text-sm text-muted-foreground stagger-fade stagger-fade-2"
        >
          <Link href="/privacy" className="hover:text-foreground">
            {t("nav.privacy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            {t("nav.terms")}
          </Link>
          <Link href="/support" className="hover:text-foreground">
            {t("nav.support")}
          </Link>
          <Link href="/sign-in?force=1" className="hover:text-foreground">
            {t("common.signIn")}
          </Link>
          <Link href="/" className="hover:text-foreground">
            {t("common.home")}
          </Link>
        </nav>
      </main>
    </div>
  );
}
