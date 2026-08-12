"use client";

import { Check, Copy, Share2, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Museum-style share sheet: copy public link, native share, and a scannable QR.
 */
export function SharePanel({
  title,
  artistName,
  url,
  privateLink = false,
  onClose,
}: {
  title: string;
  artistName: string;
  url: string;
  /** Unlisted / password exhibitions — badge + copy hint. */
  privateLink?: boolean;
  onClose: () => void;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const t = useT();
  const qrSrc = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(url)}`,
    [url],
  );

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("walk.linkCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("walk.copyFailed"));
    }
  }, [url, t]);

  const nativeShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: t("walk.shareWalk", { title, artist: artistName }),
          url,
        });
        return;
      }
      await copy();
    } catch {
      // User cancelled share — ignore.
    }
  }, [artistName, copy, title, url, t]);

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-sm border border-white/12 bg-[#141210]/95 text-[color:var(--viewer-foreground)] outline-none backdrop-blur-xl",
          !reduceMotion && "viewer-sheet-in",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] tracking-[0.16em] text-white/45 uppercase">
                {t("walk.shareExhibition")}
              </p>
              {privateLink ? (
                <span className="border border-[color:var(--viewer-brass)]/45 px-1.5 py-0.5 text-[9px] tracking-[0.14em] text-[color:var(--viewer-brass)] uppercase">
                  {t("walk.privateLink")}
                </span>
              ) : null}
            </div>
            <p
              id={titleId}
              className="mt-1 truncate font-serif text-xl tracking-tight"
            >
              {title}
            </p>
            <p className="mt-0.5 truncate text-sm text-white/55">{artistName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t("walk.closeShare")}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {privateLink ? (
            <p className="border border-white/10 bg-black/30 px-3 py-2.5 text-xs leading-relaxed text-white/55">
              {t("walk.privateHint")}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex flex-1 items-center justify-center gap-2 border border-white/20 bg-white/95 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
            >
              {copied ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {copied ? t("common.copied") : privateLink ? t("walk.copyPrivateLink") : t("walk.copyLink")}
            </button>
            <button
              type="button"
              onClick={() => void nativeShare()}
              className="inline-flex flex-1 items-center justify-center gap-2 border border-white/15 bg-white/5 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
            >
              <Share2 className="size-4" aria-hidden />
              {t("walk.share")}
            </button>
          </div>

          <div className="border border-white/10 bg-black/30 p-4">
            <p className="mb-3 text-center text-[11px] tracking-[0.14em] text-white/45 uppercase">
              {t("walk.scanQr")}
            </p>
            <div className="mx-auto flex size-[180px] items-center justify-center bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt={t("walk.qrAlt")}
                width={160}
                height={160}
                className="size-40"
              />
            </div>
            <p className="mt-3 break-all text-center font-mono text-[10px] leading-relaxed text-white/40">
              {url}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
