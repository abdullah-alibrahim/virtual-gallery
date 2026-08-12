"use client";

import Link from "next/link";

import type { SceneManifest } from "@/core/entities";
import { formatDimensions } from "@/core/value-objects/dimensions";
import { formatMoney } from "@/core/value-objects/money";
import { siteConfig } from "@/config/site";
import { useLocale, useT } from "@/i18n/locale-provider";
import type { MessageKey } from "@/i18n/translate";

/**
 * Printable exhibition catalogue — designed for paper / PDF “Save as PDF”.
 * Screen chrome is no-print; the list is catalogue-measured and serif-led.
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

      <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 md:py-20">
        <header className="border-b border-[color:var(--luxury-ink)]/15 pb-10">
          <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            {t("walk.exhibitionCatalogue")}
          </p>
          <h1 className="mt-4 font-serif text-4xl tracking-tight text-balance md:text-5xl">
            {manifest.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {manifest.artist.displayName}
            <span className="mx-2 text-border">·</span>
            {works.length}{" "}
            {works.length === 1 ? t("walk.work") : t("walk.works")}
          </p>
          {manifest.description ? (
            <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-foreground/80">
              {manifest.description}
            </p>
          ) : null}
          <p className="mt-8 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {t("walk.printedOn", { date: printed, site: siteConfig.name })}
          </p>
        </header>

        <ol className="mt-2">
          {works.map((artwork, index) => (
            <li
              key={artwork.id}
              className="grid gap-6 border-b border-[color:var(--luxury-ink)]/10 py-10 md:grid-cols-[7rem_1fr] md:gap-10"
            >
              <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <div>
                <h2 className="font-serif text-2xl tracking-tight">
                  {artwork.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {[artwork.year, artwork.medium].filter(Boolean).join(" · ") ||
                    "—"}
                </p>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-4 sm:block">
                    <dt className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                      {t("walk.dimensions")}
                    </dt>
                    <dd className="sm:mt-0.5">
                      {formatDimensions(
                        artwork.dimensions,
                        locale === "ar" ? "ar" : "en",
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:block">
                    <dt className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                      {t("walk.availability")}
                    </dt>
                    <dd className="sm:mt-0.5">
                      {availabilityLabel(artwork.availability, t)}
                      {artwork.price ? ` · ${formatMoney(artwork.price)}` : ""}
                    </dd>
                  </div>
                </dl>
                {artwork.description ? (
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-foreground/75">
                    {artwork.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <footer className="mt-14 border-t border-[color:var(--luxury-ink)]/12 pt-8 text-center text-xs text-muted-foreground">
          <p className="font-serif text-lg tracking-tight text-foreground">
            {siteConfig.name}
          </p>
          <p className="mt-2 font-mono text-[10px]">{walkHref}</p>
        </footer>
      </div>
    </main>
  );
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
