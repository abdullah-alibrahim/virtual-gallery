import type { Metadata } from "next";
import Link from "next/link";

import {
  MarketingFooter,
  MarketingNav,
} from "@/components/shared/marketing-nav";
import { BrandLockup } from "@/components/shared/house-mark";
import { buttonVariants } from "@/components/ui/button";
import { getMarketingNavAuth } from "@/features/marketing/lib/nav-auth";
import { getTranslator } from "@/i18n/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Try demos",
  description:
    "Walk the Pro hall, Harbor Pavilion, Modern White, or room mockups — no account required.",
  robots: { index: false, follow: false },
};

/**
 * Demo hub — clear paths to Pro walk, free walk, and room mockups.
 */
export default async function DemoIndexPage() {
  const [{ cta, secondaryCta }, { t }] = await Promise.all([
    getMarketingNavAuth(),
    getTranslator(),
  ]);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <MarketingNav
        showTheme
        links={[
          { href: "/templates", label: t("nav.templates") },
          { href: "/pricing", label: t("nav.pricing") },
        ]}
        cta={cta}
        secondaryCta={secondaryCta}
      />

      <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-12 px-4 py-16 sm:px-8 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="atmosphere-drift absolute -inset-[10%] bg-[radial-gradient(ellipse_50%_40%_at_20%_20%,oklch(0.92_0.02_85_/0.35),transparent),radial-gradient(ellipse_45%_35%_at_85%_70%,oklch(0.9_0.015_220_/0.12),transparent)]" />
        </div>

        <div className="page-enter max-w-2xl space-y-5">
          <BrandLockup nameClassName="text-2xl sm:text-3xl" />
          <div aria-hidden className="rule-grow h-px w-14 bg-foreground/30" />
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            {t("demo.title")}
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground text-pretty">
            {t("demo.subtitle")}
          </p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 sm:gap-8">
          {[
            {
              href: "/demo/ismail",
              label: t("demo.ismailLabel"),
              title: t("demo.ismailTitle"),
              body: t("demo.ismailBody"),
              delay: "",
            },
            {
              href: "/demo/ismail/boats",
              label: t("demo.boatsLabel"),
              title: t("demo.boatsTitle"),
              body: t("demo.boatsBody"),
              delay: "stagger-fade-1",
            },
            {
              href: "/demo/pro",
              label: t("demo.proLabel"),
              title: t("demo.proTitle"),
              body: t("demo.proBody"),
              delay: "stagger-fade-1",
            },
            {
              href: "/demo/maison",
              label: t("demo.maisonLabel"),
              title: t("demo.maisonTitle"),
              body: t("demo.maisonBody"),
              delay: "stagger-fade-1",
            },
            {
              href: "/demo/harbor",
              label: t("demo.harborLabel"),
              title: t("demo.harborTitle"),
              body: t("demo.harborBody"),
              delay: "stagger-fade-1",
            },
            {
              href: "/demo/walk",
              label: t("demo.walkLabel"),
              title: t("demo.walkTitle"),
              body: t("demo.walkBody"),
              delay: "stagger-fade-2",
            },
            {
              href: "/demo/mockups",
              label: t("demo.mockupsLabel"),
              title: t("demo.mockupsTitle"),
              body: t("demo.mockupsBody"),
              delay: "stagger-fade-3",
            },
          ].map((item) => (
            <li
              key={item.href}
              className={cn(
                "stagger-fade flex flex-col gap-4 border-t border-border pt-6",
                item.delay,
              )}
            >
              <span className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                {item.label}
              </span>
              <h2 className="font-serif text-3xl tracking-tight">{item.title}</h2>
              <p className="flex-1 text-sm text-muted-foreground text-pretty">
                {item.body}
              </p>
              <Link
                href={item.href}
                className={cn(buttonVariants({ size: "md" }), "w-fit")}
              >
                {t("common.open")}
              </Link>
            </li>
          ))}
        </ul>

        <p className="stagger-fade stagger-fade-3 text-sm text-muted-foreground">
          {t("demo.ready")}{" "}
          <Link href="/sign-in?force=1" className="text-foreground underline-offset-4 hover:underline">
            {t("common.signIn")}
          </Link>{" "}
          {t("common.or")}{" "}
          <Link href="/sign-up" className="text-foreground underline-offset-4 hover:underline">
            {t("demo.createAccount")}
          </Link>
          .
        </p>
      </section>

      <MarketingFooter />
    </main>
  );
}
