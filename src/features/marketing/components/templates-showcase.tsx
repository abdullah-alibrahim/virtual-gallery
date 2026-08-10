"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TEMPLATE_CATALOGUE,
  getTemplateById,
  getTemplateSwatches,
} from "@/core/templates";
import { siteConfig } from "@/config/site";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

import { RoomStill } from "@/components/shared/room-still";

import { MarketingRoomPanel } from "./marketing-room-panel";

/**
 * Templates marketing page — one live featured 3D preview + CSS swatches.
 * Never mounts a canvas per card (WebGL context budget).
 */
export function TemplatesShowcase() {
  const t = useT();
  const [featuredId, setFeaturedId] = useState(
    () =>
      getTemplateById("harbor-pavilion")?.id ??
      getTemplateById("edition-hall")?.id ??
      getTemplateById("grand-nave")?.id ??
      getTemplateById("daylight-museum")?.id ??
      TEMPLATE_CATALOGUE[1]?.id ??
      TEMPLATE_CATALOGUE[0]?.id ??
      "soft-museum",
  );
  const featured =
    getTemplateById(featuredId) ?? TEMPLATE_CATALOGUE[0]!;
  const featuredSwatches = useMemo(
    () => getTemplateSwatches(featured),
    [featured],
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12 pb-24 sm:px-8 sm:py-16 sm:pb-28">
      <div className="page-enter grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="flex max-w-2xl flex-col gap-5">
          <p className="font-serif text-5xl leading-none tracking-tight text-foreground/25 sm:text-6xl">
            {siteConfig.name}
          </p>
          <div aria-hidden className="rule-grow h-px w-14 bg-foreground/30" />
          <h1 className="font-serif text-5xl tracking-tight sm:text-6xl lg:text-7xl">
            {t("templates.title")}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground text-pretty sm:text-xl">
            {t("templates.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 stagger-fade stagger-fade-2 lg:justify-end">
          <Link href="/demo/pro" className={cn(buttonVariants({ size: "lg" }))}>
            {t("demo.proLabel")}
          </Link>
          <Link
            href="/demo/mockups"
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
          >
            {t("landing.roomMockups")}
          </Link>
          <Link
            href="/demo"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
          >
            {t("landing.allDemos")}
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:gap-8">
        <div className="relative aspect-[16/10] w-full overflow-hidden border border-border bg-background/30 sm:aspect-[16/9]">
          <MarketingRoomPanel
            key={featured.id}
            template={featured}
            cameraMode="orbit"
            maxArtworks={5}
            showWash
            desktopOnly
            className="size-full"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent px-5 pb-5 pt-16 sm:px-6 sm:pb-6">
            <p className="font-serif text-2xl tracking-tight sm:text-3xl">
              {featured.name}
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground text-pretty">
              {featured.tagline}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 border border-border bg-background/40 p-5 sm:p-6">
          <div className="space-y-3">
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              {t("templates.featuredRoom")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-3xl tracking-tight">
                {featured.name}
              </h2>
              <Badge
                variant={featured.tier === "pro" ? "primary" : "neutral"}
              >
                {featured.tier}
              </Badge>
            </div>
            <p className="text-base text-muted-foreground text-pretty">
              {t("templates.livePreviewBody")}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 border border-border"
                  style={{ background: featuredSwatches.wall }}
                  aria-hidden
                />
                {t("editor.wall")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 border border-border"
                  style={{ background: featuredSwatches.floor }}
                  aria-hidden
                />
                {t("editor.floor")}
              </span>
              <span>
                {t("templates.upToWalls", {
                  max: featured.capacity.max,
                  walls: featured.walls.length,
                })}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {featured.id === "modern-white" ||
            featured.id === "mega-wing" ||
            featured.id === "harbor-pavilion" ||
            featured.id === "grand-nave" ? (
              <Link
                href={
                  featured.id === "modern-white"
                    ? "/demo/walk"
                    : featured.id === "harbor-pavilion"
                      ? "/demo/harbor"
                      : "/demo/pro"
                }
                className={cn(buttonVariants({ size: "sm" }))}
              >
                {t("templates.tryWalkthrough")}
              </Link>
            ) : null}
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({
                  variant:
                    featured.id === "modern-white" ||
                    featured.id === "mega-wing" ||
                    featured.id === "harbor-pavilion" ||
                    featured.id === "grand-nave"
                      ? "secondary"
                      : "primary",
                  size: "sm",
                }),
              )}
            >
              {t("templates.useThisRoom")}
            </Link>
          </div>
        </div>
      </div>

      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {TEMPLATE_CATALOGUE.map((template, index) => {
          const selected = template.id === featured.id;
          const delay =
            index % 3 === 1
              ? "stagger-fade-1"
              : index % 3 === 2
                ? "stagger-fade-2"
                : "";
          return (
            <li key={template.id} className={cn("stagger-fade", delay)}>
              <button
                type="button"
                onClick={() => setFeaturedId(template.id)}
                className={cn(
                  "group flex w-full flex-col gap-4 border p-2 text-left transition-colors sm:p-3",
                  selected
                    ? "border-foreground bg-background/60"
                    : "border-border bg-background/30 hover:border-foreground/40",
                )}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <RoomStill template={template} artCount={3} />
                </div>
                <div className="flex flex-col gap-2 px-1 pb-2 sm:px-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-xl tracking-tight sm:text-2xl">
                      {template.name}
                    </h3>
                    <Badge
                      variant={template.tier === "pro" ? "primary" : "neutral"}
                    >
                      {template.tier}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty">
                    {template.tagline}
                  </p>
                  <span className="pt-1 text-xs tracking-wide text-muted-foreground uppercase">
                    {selected
                      ? t("templates.livePreview")
                      : t("templates.previewIn3d")}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
