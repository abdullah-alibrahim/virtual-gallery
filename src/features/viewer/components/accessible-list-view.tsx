"use client";

import Link from "next/link";
import { Share2 } from "lucide-react";

import type { SceneManifest } from "@/core/entities";
import { formatMoney } from "@/core/value-objects/money";
import { siteConfig } from "@/config/site";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * 2D accessible catalogue — wall sheet feel without WebGL.
 */
export function AccessibleListView({
  manifest,
  walkHref,
  catalogueHref,
  onEnterWalk,
  artworkHrefBase,
  onShare,
}: {
  manifest: SceneManifest;
  walkHref: string;
  catalogueHref?: string;
  onEnterWalk?: () => void;
  /** When set (e.g. `/demo/pro`), artwork links stay on the demo route. */
  artworkHrefBase?: string;
  onShare?: () => void;
}) {
  const t = useT();
  const artworkHref = (id: string) =>
    artworkHrefBase
      ? `${artworkHrefBase}?view=list#${id}`
      : `/g/${manifest.slug}/a/${id}`;
  const printHref = catalogueHref ?? `/g/${manifest.slug}/catalogue`;
  const isPrivate =
    manifest.visibility === "unlisted" || manifest.visibility === "password";

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-[#0c0b09] text-[color:var(--viewer-foreground)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.24_0.03_75_/0.45),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.18_0.015_55_/0.3),transparent_45%)]"
      />

      <div className="relative mx-auto w-full max-w-3xl px-6 py-12 md:py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] tracking-[0.22em] text-white/40 uppercase">
                {t("walk.catalogueList")}
              </p>
              {isPrivate ? (
                <span className="border border-[color:var(--viewer-brass)]/40 px-1.5 py-0.5 text-[9px] tracking-[0.14em] text-[color:var(--viewer-brass)] uppercase">
                  {t("walk.privateLink")}
                </span>
              ) : null}
            </div>
            <div
              aria-hidden
              className="mt-4 h-px w-10 bg-[color:var(--viewer-brass)]/45"
            />
            <h1 className="mt-4 font-serif text-4xl tracking-tight md:text-5xl">
              {manifest.title}
            </h1>
            <p className="mt-3 text-base text-white/65">
              {manifest.artist.displayName}
            </p>
          </div>
          {onShare ? (
            <button
              type="button"
              onClick={onShare}
              className="inline-flex size-10 shrink-0 items-center justify-center border border-white/12 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t("walk.shareExhibition")}
            >
              <Share2 className="size-4" />
            </button>
          ) : null}
        </div>

        {manifest.description ? (
          <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-white/60">
            {manifest.description}
          </p>
        ) : null}

        <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {onEnterWalk ? (
            <button
              type="button"
              onClick={onEnterWalk}
              className="border border-white/20 bg-white/95 px-4 py-2.5 font-medium tracking-wide text-neutral-900 transition-colors hover:bg-white"
            >
              {t("walk.enter")}
            </button>
          ) : (
            <Link
              href={walkHref}
              className="border border-white/20 bg-white/95 px-4 py-2.5 font-medium tracking-wide text-neutral-900 transition-colors hover:bg-white"
            >
              {t("walk.enter")}
            </Link>
          )}
          <Link
            href={printHref}
            className="text-white/50 underline-offset-4 hover:text-white/80 hover:underline"
          >
            {t("walk.printCatalogue")}
          </Link>
          <a
            href={`${siteConfig.url}/a/${manifest.artist.slug}`}
            className="text-white/45 underline-offset-4 hover:text-white/70 hover:underline"
          >
            Artist profile
          </a>
        </div>

        <ol className="mt-16 space-y-0">
          {manifest.artworks.map((artwork, index) => (
            <li
              key={artwork.id}
              id={artwork.id}
              className="border-t border-white/[0.09] py-11"
            >
              <div className="grid gap-6 md:grid-cols-[1fr_1.15fr] md:items-start md:gap-12">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.18em] text-white/35">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-2.5 font-serif text-2xl tracking-tight md:text-3xl">
                    <Link
                      href={artworkHref(artwork.id)}
                      className="hover:underline"
                    >
                      {artwork.title}
                    </Link>
                  </h2>
                  <p className="mt-2.5 text-sm text-white/50">
                    {[artwork.year, artwork.medium].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                  <dl className="mt-5 space-y-0 text-sm">
                    <MetaRow
                      label={t("walk.size")}
                      value={`${artwork.dimensions.width} × ${artwork.dimensions.height} ${artwork.dimensions.unit}`}
                    />
                    {artwork.price ? (
                      <MetaRow
                        label={t("editor.price")}
                        value={formatMoney(artwork.price)}
                      />
                    ) : artwork.availability === "priceOnRequest" ? (
                      <MetaRow
                        label={t("editor.price")}
                        value={t("walk.onRequest")}
                      />
                    ) : null}
                    <MetaRow
                      label={t("editor.status")}
                      value={
                        artwork.availability === "nfs"
                          ? t("editor.nfs")
                          : artwork.availability === "priceOnRequest"
                            ? t("editor.priceOnRequest")
                            : artwork.availability === "available"
                              ? t("editor.available")
                              : artwork.availability === "sold"
                                ? t("editor.sold")
                                : artwork.availability === "reserved"
                                  ? t("editor.reserved")
                                  : artwork.availability
                      }
                    />
                  </dl>
                  {artwork.description ? (
                    <p className="mt-5 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                      {artwork.description}
                    </p>
                  ) : null}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artwork.textures.lod2 || artwork.textures.lod1}
                  alt=""
                  className={cn(
                    "max-h-[28rem] w-full border border-white/[0.08] object-contain",
                    "bg-[linear-gradient(180deg,oklch(0.16_0.01_55),oklch(0.11_0.01_55))]",
                  )}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/[0.07] py-2">
          <dt className="text-[11px] tracking-[0.12em] text-white/35 uppercase">
        {label}
      </dt>
      <dd className="text-end text-white/85">{value}</dd>
    </div>
  );
}
