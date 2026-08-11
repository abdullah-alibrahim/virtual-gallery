"use client";

import Link from "next/link";
import {
  Box,
  Frame,
  Languages,
  Layers,
  Link2,
  Sparkles,
  UserRound,
  Wallpaper,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

type FeatureKey =
  | "Walkable"
  | "Hang"
  | "Mockups"
  | "Publish"
  | "Halls"
  | "Locale"
  | "Plans"
  | "Profiles";

const FEATURES: { key: FeatureKey; Icon: LucideIcon }[] = [
  { key: "Walkable", Icon: Box },
  { key: "Hang", Icon: Frame },
  { key: "Mockups", Icon: Wallpaper },
  { key: "Publish", Icon: Link2 },
  { key: "Halls", Icon: Layers },
  { key: "Locale", Icon: Languages },
  { key: "Plans", Icon: Sparkles },
  { key: "Profiles", Icon: UserRound },
];

/**
 * Below-fold services & features — one job: explain what Virtual Gallery offers.
 * Quiet list/grid (no hero cards); monoline icons as restrained accents.
 */
export function ServicesFeatures() {
  const t = useT();

  return (
    <section className="relative z-10 border-t border-border bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="atmosphere-drift absolute -inset-[8%] bg-[radial-gradient(ellipse_50%_40%_at_88%_10%,oklch(0.92_0.02_85_/0.35),transparent),radial-gradient(ellipse_35%_30%_at_8%_80%,oklch(0.9_0.015_210_/0.12),transparent)]" />
      </div>
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl page-enter space-y-4">
          <div
            aria-hidden
            className="rule-grow h-px w-14 bg-[color:var(--luxury-brass)]/55"
          />
          <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
            {t("landing.servicesEyebrow")}
          </p>
          <h2 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl">
            {t("landing.servicesTitle")}
          </h2>
          <p className="max-w-lg text-lg text-muted-foreground text-pretty">
            {t("landing.servicesBody")}
          </p>
        </div>

        <ul className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
          {FEATURES.map(({ key, Icon }, index) => (
            <li
              key={key}
              className={cn(
                "flex gap-4 border-t border-border py-7 stagger-fade",
                index % 4 === 1 && "stagger-fade-1",
                index % 4 === 2 && "stagger-fade-2",
                index % 4 === 3 && "stagger-fade-3",
              )}
            >
              <span
                className="mt-1 flex size-8 shrink-0 items-center justify-center text-[color:var(--luxury-brass)]"
                aria-hidden
              >
                <Icon className="size-5" strokeWidth={1.25} />
              </span>
              <div className="min-w-0 space-y-2">
                <h3 className="font-serif text-2xl tracking-tight">
                  {t(`landing.feature${key}`)}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground text-pretty">
                  {t(`landing.feature${key}Body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-8 stagger-fade stagger-fade-3">
          <p className="max-w-md text-sm text-muted-foreground text-pretty">
            {t("landing.servicesPlansNote")}
          </p>
          <Link
            href="/pricing"
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
          >
            {t("landing.servicesPlansCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
