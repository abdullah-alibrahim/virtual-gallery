"use client";

import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import type { ArtworkInnerWorld } from "@/core/entities";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Fullscreen-ish overlay when a visitor “enters” an artwork’s inner world.
 */
export function InnerWorldOverlay({
  world,
  artworkTitle,
  onClose,
}: {
  world: ArtworkInnerWorld;
  artworkTitle: string;
  onClose: () => void;
}) {
  const t = useT();
  const reduceMotion = usePrefersReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const heading =
    world.type === "text"
      ? world.title
      : world.type === "video"
        ? world.title || artworkTitle
        : world.title || t("walk.innerWorldRoom");

  return (
    <div
      className="absolute inset-0 z-[45] flex items-center justify-center bg-black/78 p-4 backdrop-blur-md sm:p-8"
      role="presentation"
      onClick={onClose}
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-labelledby={titleId}
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex max-h-[min(88dvh,40rem)] w-full max-w-2xl flex-col overflow-hidden border border-white/[0.1] bg-[#0c0b0a]/[0.96] text-white outline-none",
          !reduceMotion && "viewer-sheet-in",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.2em] text-[color:var(--viewer-brass)]/75 uppercase">
              {t("walk.innerWorld")}
            </p>
            <h2
              id={titleId}
              className="mt-1.5 font-serif text-2xl tracking-tight text-balance"
            >
              {heading}
            </h2>
            <p className="mt-1 truncate text-xs text-white/45">{artworkTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t("walk.exitInnerWorld")}
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {world.type === "text" ? (
            <p className="whitespace-pre-wrap font-serif text-[1.05rem] leading-[1.75] text-white/85 text-pretty">
              {world.body}
            </p>
          ) : null}

          {world.type === "video" ? (
            <div className="overflow-hidden border border-white/[0.08] bg-black">
              {isEmbeddable(world.url) ? (
                <iframe
                  title={heading}
                  src={toEmbedUrl(world.url)}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={world.url}
                  controls
                  playsInline
                  className="aspect-video w-full bg-black"
                />
              )}
            </div>
          ) : null}

          {world.type === "room" ? (
            <div className="space-y-4">
              {world.body ? (
                <p className="text-sm leading-relaxed text-white/70 text-pretty">
                  {world.body}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-white/70 text-pretty">
                  {t("walk.innerWorldRoomBody")}
                </p>
              )}
              {world.spawnLabel ? (
                <p className="text-[11px] tracking-wide text-white/40">
                  {world.spawnLabel}
                </p>
              ) : null}
              {world.href ? (
                <Link
                  href={world.href}
                  className="inline-flex items-center gap-2 border border-white/15 bg-white/95 px-4 py-2.5 text-sm font-medium tracking-wide text-neutral-900 transition-colors hover:bg-white"
                >
                  {t("walk.openLinkedRoom")}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="border-t border-white/[0.08] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-white/55 uppercase transition-colors hover:text-white/85"
          >
            <ArrowLeft className="size-3.5" />
            {t("walk.exitInnerWorld")}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function isEmbeddable(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return (
      host.includes("youtube.com") ||
      host.includes("youtu.be") ||
      host.includes("vimeo.com")
    );
  } catch {
    return false;
  }
}

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (host.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* fall through */
  }
  return url;
}
