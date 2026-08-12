import type { Metadata } from "next";
import Link from "next/link";

import {
  MarketingFooter,
  MarketingNav,
} from "@/components/shared/marketing-nav";
import { SiteSocialLinks } from "@/components/shared/social-links";
import { RoomStill } from "@/components/shared/room-still";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { softMuseumTemplate } from "@/core/templates";
import { LandingHero, ServicesFeatures } from "@/features/marketing";
import { getMarketingNavAuth } from "@/features/marketing/lib/nav-auth";
import { getTranslator } from "@/i18n/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
  description: siteConfig.description,
};

/**
 * Marketing landing — atmospheric, brand-first, one hero job.
 * Below the fold: one job per section (services, walk, templates, collectors, hang steps).
 */
export default async function LandingPage() {
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

      <LandingHero />

      <ServicesFeatures />

      <section className="relative z-10 border-t border-border bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="atmosphere-drift absolute -inset-[8%] bg-[radial-gradient(ellipse_55%_45%_at_12%_15%,oklch(0.92_0.02_85_/0.4),transparent),radial-gradient(ellipse_40%_35%_at_92%_75%,oklch(0.9_0.02_210_/0.14),transparent)]" />
        </div>
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl page-enter space-y-4">
            <div aria-hidden className="rule-grow h-px w-14 bg-foreground/30" />
            <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
              {t("landing.walkEyebrow")}
            </p>
            <h2 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl">
              {t("landing.walkTitle")}
            </h2>
            <p className="max-w-md text-lg text-muted-foreground text-pretty">
              {t("landing.walkBody")}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {[
              {
                href: "/demo/pro",
                label: t("landing.walkPro"),
                delay: "",
              },
              {
                href: "/demo/harbor",
                label: t("landing.walkHarbor"),
                delay: "stagger-fade-1",
              },
              {
                href: "/demo/walk",
                label: t("landing.walkQuiet"),
                delay: "stagger-fade-2",
              },
            ].map((item) => (
              <li key={item.href} className={cn("stagger-fade", item.delay)}>
                <Link
                  href={item.href}
                  className="group flex flex-col gap-3 border-t border-border pt-5 transition-colors hover:border-foreground/40"
                >
                  <span className="font-serif text-2xl tracking-tight group-hover:underline sm:text-3xl">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/demo"
            className="stagger-fade stagger-fade-3 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("landing.walkAll")}
          </Link>
        </div>
      </section>

      <section className="relative z-10 border-t border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 py-24 md:grid-cols-[1.05fr_0.95fr] md:items-end md:gap-20 sm:px-8 sm:py-28">
          <div className="page-enter space-y-6">
            <div aria-hidden className="rule-grow h-px w-14 bg-foreground/30" />
            <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
              {t("landing.templatesEyebrow")}
            </p>
            <h2 className="max-w-lg font-serif text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t("landing.templatesTitle")}
            </h2>
            <p className="max-w-md text-lg text-muted-foreground text-pretty">
              {t("landing.templatesBody")}
            </p>
            <Link
              href="/templates"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
            >
              {t("landing.templatesCta")}
            </Link>
          </div>
          <div
            className="relative aspect-[4/5] w-full overflow-hidden border border-border scale-in stagger-fade-2"
            aria-hidden
          >
            <RoomStill template={softMuseumTemplate} artCount={3} />
            <div className="veil-shimmer pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-border bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 surface-grain opacity-70"
        />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-24 sm:px-8 sm:py-28">
          <div className="max-w-2xl page-enter space-y-4">
            <div aria-hidden className="rule-grow h-px w-14 bg-foreground/30" />
            <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
              {t("landing.collectorsEyebrow")}
            </p>
            <h2 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl">
              {t("landing.collectorsTitle")}
            </h2>
            <p className="max-w-lg text-lg text-muted-foreground text-pretty">
              {t("landing.collectorsBody")}
            </p>
            <Link
              href="/demo/mockups"
              className={cn(buttonVariants({ size: "lg" }), "w-fit")}
            >
              {t("landing.collectorsCta")}
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-border">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 py-24 sm:px-8 sm:py-28">
          <div className="max-w-2xl page-enter space-y-4">
            <div aria-hidden className="rule-grow h-px w-14 bg-foreground/30" />
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
              {t("landing.stepsTitle")}
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              {t("landing.stepsBody")}
            </p>
          </div>
          <ol className="grid gap-10 sm:grid-cols-3 sm:gap-12">
            {[
              {
                step: "01",
                title: t("landing.step1"),
                body: t("landing.step1Body"),
              },
              {
                step: "02",
                title: t("landing.step2"),
                body: t("landing.step2Body"),
              },
              {
                step: "03",
                title: t("landing.step3"),
                body: t("landing.step3Body"),
              },
            ].map((item, index) => (
              <li
                key={item.step}
                className={cn(
                  "flex flex-col gap-4 border-t border-border pt-6 stagger-fade",
                  index === 1 && "stagger-fade-1",
                  index === 2 && "stagger-fade-2",
                )}
              >
                <span className="font-mono text-xs tracking-widest text-muted-foreground">
                  {item.step}
                </span>
                <h3 className="font-serif text-3xl tracking-tight">
                  {item.title}
                </h3>
                <p className="text-base text-muted-foreground text-pretty">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-8 border-t border-border pt-10 stagger-fade stagger-fade-3">
            <div className="space-y-3">
              <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
                {t("landing.ctaTitle")}
              </h2>
              <p className="max-w-md text-muted-foreground text-pretty">
                {t("landing.ctaBody")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                {t("landing.ctaPrimary")}
              </Link>
              <Link
                href="/demo/pro"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                )}
              >
                {t("landing.ctaSecondary")}
              </Link>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                {t("landing.followUs")}
              </p>
              <SiteSocialLinks />
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
