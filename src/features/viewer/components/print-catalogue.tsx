"use client";

import Link from "next/link";

import type { SceneArtwork, SceneManifest } from "@/core/entities";
import { formatDimensions } from "@/core/value-objects/dimensions";
import { formatMoney } from "@/core/value-objects/money";
import { siteConfig } from "@/config/site";
import { useLocale, useT } from "@/i18n/locale-provider";
import type { MessageKey } from "@/i18n/translate";

/**
 * Printable museum catalogue — cover plate + one page per work, bilingual.
 * Designed for A4 “Save as PDF”. Screen chrome is `.no-print`.
 */
export function PrintCatalogue({
  manifest,
  walkHref,
  listHref,
}: {
  manifest: SceneManifest;
  walkHref: string;
  listHref?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const works = manifest.artworks;
  const cover = pickCoverWork(works);
  const printed = new Date().toLocaleDateString(
    locale === "ar" ? "ar" : "en-GB",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <main className="print-catalogue min-h-dvh bg-[color:var(--luxury-stone)] text-[color:var(--luxury-ink)]">
      <div className="no-print border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={walkHref}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("walk.backToWalk")}
            </Link>
            {listHref ? (
              <Link
                href={listHref}
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("walk.catalogueList")}
              </Link>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="border border-border bg-background px-4 py-2 text-sm tracking-wide transition-colors hover:border-[color:var(--luxury-brass)]"
          >
            {t("walk.printSavePdf")}
          </button>
        </div>
      </div>

      <article className="print-catalogue-sheet mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:py-14">
        <section className="print-catalogue-page print-catalogue-cover">
          <p className="print-catalogue-kicker">
            <span lang="en">Exhibition catalogue</span>
            <span className="print-catalogue-dot" aria-hidden>
              ·
            </span>
            <span lang="ar" dir="rtl">
              كتالوج المعرض
            </span>
          </p>
          {cover ? (
            <CatalogueFigure
              artwork={cover}
              className="print-catalogue-hero"
              priority
            />
          ) : null}
          <h1 className="mt-8 font-serif text-4xl tracking-tight text-balance md:text-5xl">
            {manifest.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {manifest.artist.displayName}
            <span className="mx-2 text-border">·</span>
            {t("walk.catalogueWorks", { count: works.length })}
          </p>
          {manifest.description ? (
            <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-foreground/80">
              {manifest.description}
            </p>
          ) : null}
          <p className="mt-10 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {t("walk.printedOn", { date: printed, site: siteConfig.name })}
          </p>
        </section>

        {works.map((artwork, index) => (
          <section
            key={artwork.id}
            className="print-catalogue-page print-catalogue-work"
          >
            <p className="print-catalogue-kicker">
              <span lang="en">
                Plate {String(index + 1).padStart(2, "0")}
              </span>
              <span className="print-catalogue-dot" aria-hidden>
                ·
              </span>
              <span lang="ar" dir="rtl">
                لوحة {String(index + 1).padStart(2, "0")}
              </span>
            </p>
            <CatalogueFigure artwork={artwork} className="print-catalogue-plate" />
            <WorkHead artwork={artwork} locale={locale} />
            <dl className="print-catalogue-meta">
              <div>
                <dt>
                  <span lang="en">Year</span>
                  <span aria-hidden> / </span>
                  <span lang="ar" dir="rtl">
                    السنة
                  </span>
                </dt>
                <dd>{artwork.year ?? "—"}</dd>
              </div>
              <div>
                <dt>
                  <span lang="en">Medium</span>
                  <span aria-hidden> / </span>
                  <span lang="ar" dir="rtl">
                    الخامة
                  </span>
                </dt>
                <dd>
                  <MediumLines artwork={artwork} locale={locale} />
                </dd>
              </div>
              <div>
                <dt>
                  <span lang="en">Dimensions</span>
                  <span aria-hidden> / </span>
                  <span lang="ar" dir="rtl">
                    القياسات
                  </span>
                </dt>
                <dd>
                  {formatDimensions(
                    artwork.dimensions,
                    locale === "ar" ? "ar" : "en",
                  )}
                </dd>
              </div>
              <div>
                <dt>
                  <span lang="en">Availability</span>
                  <span aria-hidden> / </span>
                  <span lang="ar" dir="rtl">
                    التوفر
                  </span>
                </dt>
                <dd>
                  {availabilityLabel(artwork.availability, t)}
                  {artwork.price ? ` · ${formatMoney(artwork.price)}` : ""}
                </dd>
              </div>
            </dl>
            <WorkStatement artwork={artwork} locale={locale} />
          </section>
        ))}

        <footer className="print-catalogue-page print-catalogue-colophon">
          <p className="font-serif text-lg tracking-tight">{siteConfig.name}</p>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            {walkHref}
          </p>
        </footer>
      </article>
    </main>
  );
}

function WorkHead({
  artwork,
  locale,
}: {
  artwork: SceneArtwork;
  locale: string;
}) {
  const bi = artwork.bilingual;
  if (bi && bi.titleEn !== bi.titleAr) {
    const first = locale === "ar" ? bi.titleAr : bi.titleEn;
    const second = locale === "ar" ? bi.titleEn : bi.titleAr;
    const firstLang = locale === "ar" ? "ar" : "en";
    const secondLang = locale === "ar" ? "en" : "ar";
    return (
      <header className="print-catalogue-titles">
        <h2
          className="font-serif text-3xl tracking-tight text-balance"
          lang={firstLang}
          dir={firstLang === "ar" ? "rtl" : "ltr"}
        >
          {first}
        </h2>
        <p
          className="mt-1 font-serif text-xl tracking-tight text-muted-foreground text-balance"
          lang={secondLang}
          dir={secondLang === "ar" ? "rtl" : "ltr"}
        >
          {second}
        </p>
      </header>
    );
  }
  return (
    <header className="print-catalogue-titles">
      <h2 className="font-serif text-3xl tracking-tight text-balance">
        {artwork.title}
      </h2>
    </header>
  );
}

function MediumLines({
  artwork,
  locale,
}: {
  artwork: SceneArtwork;
  locale: string;
}) {
  const bi = artwork.bilingual;
  if (bi?.mediumEn && bi.mediumAr && bi.mediumEn !== bi.mediumAr) {
    const first = locale === "ar" ? bi.mediumAr : bi.mediumEn;
    const second = locale === "ar" ? bi.mediumEn : bi.mediumAr;
    return (
      <>
        {first}
        <span className="text-muted-foreground"> · {second}</span>
      </>
    );
  }
  return <>{artwork.medium || "—"}</>;
}

function WorkStatement({
  artwork,
  locale,
}: {
  artwork: SceneArtwork;
  locale: string;
}) {
  const bi = artwork.bilingual;
  if (bi?.descriptionEn && bi.descriptionAr) {
    const first = locale === "ar" ? bi.descriptionAr : bi.descriptionEn;
    const second = locale === "ar" ? bi.descriptionEn : bi.descriptionAr;
    const firstLang = locale === "ar" ? "ar" : "en";
    const secondLang = locale === "ar" ? "en" : "ar";
    return (
      <div className="print-catalogue-statement">
        <p lang={firstLang} dir={firstLang === "ar" ? "rtl" : "ltr"}>
          {first}
        </p>
        {second !== first ? (
          <p
            className="mt-3 text-foreground/70"
            lang={secondLang}
            dir={secondLang === "ar" ? "rtl" : "ltr"}
          >
            {second}
          </p>
        ) : null}
      </div>
    );
  }
  if (!artwork.description) return null;
  return (
    <p className="print-catalogue-statement">{artwork.description}</p>
  );
}

function CatalogueFigure({
  artwork,
  className,
  priority = false,
}: {
  artwork: SceneArtwork;
  className?: string;
  priority?: boolean;
}) {
  const src = catalogueImageSrc(artwork);
  if (!src) {
    return (
      <div
        className={`print-catalogue-figure print-catalogue-figure-empty ${className ?? ""}`}
      />
    );
  }
  return (
    <figure className={`print-catalogue-figure ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={artwork.title}
        className="print-catalogue-img"
        loading={priority ? "eager" : "lazy"}
      />
    </figure>
  );
}

function catalogueImageSrc(artwork: SceneArtwork): string | null {
  if (artwork.previewUrl) return artwork.previewUrl;
  const url = artwork.textures.lod0;
  if (/\.(jpe?g|png|webp|gif|avif|svg)(\?|#|$)/i.test(url)) return url;
  if (url.startsWith("/") && !url.includes(".ktx2")) return url;
  return null;
}

function pickCoverWork(works: readonly SceneArtwork[]): SceneArtwork | null {
  if (works.length === 0) return null;
  return works.reduce((best, work) => {
    const area = work.dimensions.width * work.dimensions.height;
    const bestArea = best.dimensions.width * best.dimensions.height;
    return area > bestArea ? work : best;
  });
}

function availabilityLabel(
  value: string,
  t: (key: MessageKey) => string,
): string {
  switch (value) {
    case "nfs":
      return t("editor.nfs");
    case "priceOnRequest":
      return t("editor.priceOnRequest");
    case "reserved":
      return t("editor.reserved");
    case "sold":
      return t("editor.sold");
    case "available":
      return t("editor.available");
    default:
      return value;
  }
}
