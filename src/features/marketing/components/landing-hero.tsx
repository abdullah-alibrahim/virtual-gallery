"use client";

import Link from "next/link";
import { useMemo } from "react";

import { HouseMark } from "@/components/shared/house-mark";
import { buttonVariants } from "@/components/ui/button";
import { softMuseumTemplate } from "@/core/templates";
import { siteConfig } from "@/config/site";
import { useLocale, useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

import { buildLandingArtworks } from "../lib/landing-artworks";
import { MarketingRoomPanel } from "./marketing-room-panel";

/**
 * Brand-first marketing hero: full-bleed 3D gallery with restrained copy.
 * One composition — brand, headline, support, CTA group; hall is the visual.
 */
export function LandingHero() {
  const artworks = useMemo(() => buildLandingArtworks(), []);
  const t = useT();
  const locale = useLocale();
  const kickerAlt = locale === "ar" ? "Private viewing" : "مشاهدة خاصة";

  return (
    <section className="relative flex min-h-[calc(100dvh-4.5rem)] flex-col justify-end overflow-hidden">
      <div
        className="absolute inset-0"
        aria-hidden
        style={{ backgroundColor: softMuseumTemplate.environment.background }}
      >
        <MarketingRoomPanel
          template={softMuseumTemplate}
          artworks={artworks}
          cameraMode="hero"
          maxArtworks={8}
          showWash
          desktopOnly
          className="size-full"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--luxury-stone)] via-[color:var(--luxury-stone)]/55 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[color:var(--luxury-stone)]/90 via-[color:var(--luxury-stone)]/25 to-transparent rtl:bg-gradient-to-l" />
        <div className="surface-grain pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay" />
        <div className="veil-shimmer pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[color:var(--luxury-stone)]/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-20 pt-12 sm:px-8 sm:pb-28">
        <div className="hero-rise max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <HouseMark
              size={14}
              className="text-[color:var(--luxury-brass)]"
            />
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
              {t("landing.viewingKicker")}
              <span className="mx-2 opacity-40" aria-hidden>
                ·
              </span>
              <span
                lang={locale === "ar" ? "en" : "ar"}
                dir={locale === "ar" ? "ltr" : "rtl"}
                className="font-normal tracking-[0.12em] normal-case"
              >
                {kickerAlt}
              </span>
            </p>
          </div>
          <p className="font-serif text-6xl leading-[0.94] tracking-tight text-balance sm:text-7xl lg:text-8xl">
            {siteConfig.name}
          </p>
          <h1
            className={cn(
              "stagger-fade stagger-fade-1 max-w-xl font-serif text-2xl leading-snug tracking-tight text-balance text-foreground/90 sm:text-3xl lg:text-[2.05rem]",
              locale !== "ar" && "italic",
            )}
          >
            {t("landing.headline")}
          </h1>
          <p className="stagger-fade stagger-fade-2 max-w-md text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
            {t("landing.heroBody")}
          </p>
          <div className="stagger-fade stagger-fade-3 flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/demo/pro"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              {t("landing.explorePro")}
            </Link>
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
              )}
            >
              {t("landing.start")}
            </Link>
            <Link
              href="/sign-in?force=1"
              className="px-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("common.signIn")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
