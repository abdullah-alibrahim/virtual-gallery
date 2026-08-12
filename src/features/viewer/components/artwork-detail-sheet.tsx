"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, DoorOpen, Share2, X, ZoomIn } from "lucide-react";
import { useEffect, useRef } from "react";

import type { SceneArtwork, SceneManifest } from "@/core/entities";
import { formatDimensions } from "@/core/value-objects/dimensions";
import { formatMoney } from "@/core/value-objects/money";
import { EnquiryForm } from "@/components/shared/enquiry-form";
import { SocialLinks } from "@/components/shared/social-links";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useLocale, useT } from "@/i18n";
import type { MessageKey } from "@/i18n/translate";
import { resolveArtistSocialLinks } from "@/lib/social-urls";
import { cn } from "@/lib/utils";

import { VoiceNotePlayer } from "./voice-note-player";

const AVAILABILITY_KEYS: Record<string, MessageKey> = {
  available: "editor.available",
  sold: "editor.sold",
  reserved: "editor.reserved",
  nfs: "editor.nfs",
  priceOnRequest: "editor.priceOnRequest",
};

export function ArtworkDetailSheet({
  artwork,
  artistName,
  galleryId,
  allowInquiries = false,
  artistSocials,
  galleryWebsite,
  mockupsHref,
  spaceHref,
  soundMuted = false,
  tourIndex = null,
  tourTotal = null,
  onTourPrev,
  onTourNext,
  onClose,
  onZoom,
  onShare,
  onEnterInnerWorld,
}: {
  artwork: SceneArtwork;
  artistName: string;
  galleryId: string;
  allowInquiries?: boolean;
  artistSocials?: SceneManifest["artist"]["socials"];
  galleryWebsite?: string | null;
  mockupsHref?: string;
  spaceHref?: string;
  soundMuted?: boolean;
  tourIndex?: number | null;
  tourTotal?: number | null;
  onTourPrev?: () => void;
  onTourNext?: () => void;
  onClose: () => void;
  onZoom: () => void;
  onShare?: () => void;
  onEnterInnerWorld?: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const reduceMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const priceOnRequest = artwork.availability === "priceOnRequest";
  const showEnquireBlock = allowInquiries || priceOnRequest;
  const socialLinks = resolveArtistSocialLinks(artistSocials, {
    galleryWebsite,
  });

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && onTourPrev) onTourPrev();
      if (event.key === "ArrowRight" && onTourNext) onTourNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onTourNext, onTourPrev, artwork.id]);

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 max-h-[62dvh] overflow-y-auto outline-none",
        "border-t border-white/[0.1] bg-[color:var(--viewer-scrim)] text-[color:var(--viewer-foreground)]",
        "backdrop-blur-xl md:inset-x-auto md:right-5 md:bottom-5 md:max-h-[76dvh] md:w-[23rem] md:border",
        "pb-[env(safe-area-inset-bottom)] md:pb-0",
        !reduceMotion && "viewer-sheet-in",
      )}
      aria-label={`Details for ${artwork.title}`}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          {tourIndex != null && tourTotal != null ? (
            <p className="text-[10px] tracking-[0.18em] text-white/35 uppercase">
              {t("walk.tourProgress", {
                current: tourIndex + 1,
                total: tourTotal,
              })}
            </p>
          ) : (
            <p className="text-[10px] tracking-[0.18em] text-[color:var(--viewer-brass)]/70 uppercase">
              {t("walk.wallLabel")}
            </p>
          )}
          <p className="mt-1.5 font-serif text-xl tracking-tight md:text-2xl">
            {artwork.title}
          </p>
          <p className="mt-1.5 text-sm text-white/60">
            {artistName}
            {artwork.year ? ` · ${artwork.year}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <IconBtn label={t("walk.enlarge")} onClick={onZoom}>
            <ZoomIn className="size-4" />
          </IconBtn>
          {onShare ? (
            <IconBtn label={t("walk.share")} onClick={onShare}>
              <Share2 className="size-4" />
            </IconBtn>
          ) : null}
          <IconBtn label={t("common.close")} onClick={onClose}>
            <X className="size-4" />
          </IconBtn>
        </div>
      </div>

      {(onTourPrev || onTourNext) && (
        <div className="mx-4 mb-3 flex items-center gap-1 border border-white/[0.09] bg-black/25 p-0.5">
          <button
            type="button"
            disabled={!onTourPrev}
            onClick={onTourPrev}
            className="flex size-8 items-center justify-center text-white/65 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label={t("walk.prevTour")}
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="flex-1 text-center text-[11px] tracking-wide text-white/45">
            {t("walk.guidedOrder")}
          </p>
          <button
            type="button"
            disabled={!onTourNext}
            onClick={onTourNext}
            className="flex size-8 items-center justify-center text-white/65 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label={t("walk.nextTour")}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onZoom}
        className="group relative mx-4 mb-3 block w-[calc(100%-2rem)] overflow-hidden border border-white/[0.08] bg-black/50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.textures.lod1 || artwork.textures.lod0}
          alt={artwork.title}
          className="aspect-[4/3] w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-2 text-left text-[11px] tracking-wide text-white/65">
          {t("walk.enlarge")}
        </span>
      </button>

      {(artwork.media?.audioUrl || onEnterInnerWorld) && (
        <div className="mx-4 mb-3 flex flex-wrap gap-2">
          {artwork.media?.audioUrl ? (
            <VoiceNotePlayer
              src={artwork.media.audioUrl}
              muted={soundMuted}
            />
          ) : null}
          {onEnterInnerWorld ? (
            <button
              type="button"
              onClick={onEnterInnerWorld}
              className="inline-flex items-center gap-2 border border-[color:var(--viewer-brass)]/35 bg-[color:var(--viewer-brass)]/[0.08] px-3 py-2 text-[11px] tracking-[0.14em] text-[color:var(--viewer-brass)] uppercase transition-colors hover:bg-[color:var(--viewer-brass)]/[0.14]"
            >
              <DoorOpen className="size-3.5" />
              {t("walk.enterTheWork")}
            </button>
          ) : null}
        </div>
      )}

      <dl className="space-y-0 px-4 pb-5 text-sm">
        <Row
          label={t("walk.medium")}
          value={artwork.medium?.trim() || t("walk.mediumFallback")}
        />
        <Row
          label={t("walk.measurements")}
          value={formatDimensions(
            artwork.dimensions,
            locale === "ar" ? "ar" : "en",
          )}
        />
        {artwork.year ? (
          <Row label={t("walk.year")} value={String(artwork.year)} />
        ) : (
          <Row label={t("walk.year")} value={t("walk.yearUnknown")} />
        )}
        <Row
          label={t("walk.series")}
          value={artwork.category?.trim() || t("walk.seriesFallback")}
        />
        <Row
          label={t("walk.availability")}
          value={humanAvailability(artwork.availability, t)}
        />
        {artwork.price ? (
          <Row label={t("editor.price")} value={formatMoney(artwork.price)} />
        ) : (
          <Row label={t("editor.price")} value={t("walk.onRequest")} />
        )}
        <Row label={t("walk.signed")} value={t("walk.signedFallback")} />
        <Row label={t("walk.provenance")} value={t("walk.provenanceFallback")} />
        <Row
          label={t("walk.inventory")}
          value={inventoryNo(artwork.id)}
        />
        <Row label={t("walk.condition")} value={t("walk.conditionFallback")} />
        <Row
          label={t("walk.exhibitionHistory")}
          value={t("walk.exhibitionFallback")}
        />
        <div className="border-t border-white/[0.08] pt-4 mt-3">
          <dt className="text-[10px] tracking-[0.16em] text-white/40 uppercase">
            {t("walk.aboutWork")}
          </dt>
          <dd className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-white/80">
            {artwork.description?.trim() || t("walk.aboutFallback")}
          </dd>
        </div>

        {showEnquireBlock ? (
          <div className="mt-4 border border-[color:var(--viewer-brass)]/25 bg-[color:var(--viewer-brass)]/[0.06] px-3 py-3.5">
            <p className="text-[10px] tracking-[0.16em] text-[color:var(--viewer-brass)]/85 uppercase">
              {priceOnRequest ? t("editor.priceOnRequest") : t("walk.enquire")}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/55">
              {t("walk.enquireCta")}
            </p>
            <div className="mt-3">
              <EnquiryForm
                galleryId={galleryId}
                artworkId={artwork.id}
                compact
              />
            </div>
          </div>
        ) : null}

        {mockupsHref || spaceHref ? (
          <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.08] pt-4">
            <p className="text-[10px] tracking-[0.16em] text-white/40 uppercase">
              {t("walk.previewInRooms")}
            </p>
            {mockupsHref ? (
              <Link
                href={mockupsHref}
                className="border border-white/15 bg-white/[0.04] px-3 py-2.5 text-center text-sm text-white/85 transition-colors hover:bg-white/10"
              >
                {t("mockups.clientPresentation")}
              </Link>
            ) : null}
            {spaceHref ? (
              <Link
                href={spaceHref}
                className="border border-white/12 px-3 py-2.5 text-center text-sm text-white/65 transition-colors hover:bg-white/5 hover:text-white/85"
              >
                {t("walk.yourSpace")}
              </Link>
            ) : null}
          </div>
        ) : null}

        {socialLinks.length > 0 ? (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
            <p className="text-[10px] tracking-[0.16em] text-white/35 uppercase">
              {t("landing.artistSocials")}
            </p>
            <SocialLinks links={socialLinks} tone="brass" />
          </div>
        ) : null}
      </dl>
    </aside>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded p-2 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/[0.07] py-2.5">
      <dt className="text-[10px] tracking-[0.14em] text-white/40 uppercase">
        {label}
      </dt>
      <dd className="text-right text-white/90">{value}</dd>
    </div>
  );
}

function humanAvailability(
  value: string,
  t: ReturnType<typeof useT>,
): string {
  const key = AVAILABILITY_KEYS[value];
  if (key) return t(key);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function inventoryNo(artworkId: string): string {
  const slug = artworkId.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
  return `VG-${slug || "000000"}`;
}

export function findArtwork(
  manifest: SceneManifest,
  id: string | null,
): SceneArtwork | null {
  if (!id) return null;
  return manifest.artworks.find((a) => a.id === id) ?? null;
}
