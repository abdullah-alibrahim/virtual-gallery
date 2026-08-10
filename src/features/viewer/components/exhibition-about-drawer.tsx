"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { ArtistSocials } from "@/core/entities";
import { SocialLinks } from "@/components/shared/social-links";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useT } from "@/i18n";
import { resolveArtistSocialLinks } from "@/lib/social-urls";
import { cn } from "@/lib/utils";

/**
 * Curator statement drawer — museum plaque language from gallery description.
 */
export function ExhibitionAboutDrawer({
  title,
  artistName,
  description,
  workCount,
  artistSocials,
  galleryWebsite,
  onClose,
}: {
  title: string;
  artistName: string;
  description: string;
  workCount: number;
  artistSocials?: ArtistSocials;
  galleryWebsite?: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const reduceMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const socialLinks = resolveArtistSocialLinks(artistSocials, {
    galleryWebsite,
  });

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t("walk.exhibitionStatement")}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-md border border-white/12 bg-[#12100e]/96 text-[color:var(--viewer-foreground)] outline-none backdrop-blur-xl",
          !reduceMotion && "viewer-sheet-in",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.2em] text-[color:var(--viewer-brass)]/80 uppercase">
              {t("walk.exhibitionStatement")}
            </p>
            <p className="mt-1.5 font-serif text-2xl tracking-tight">{title}</p>
            <p className="mt-1 text-sm text-white/55">
              {artistName}
              <span className="mx-1.5 text-white/25">·</span>
              {workCount}{" "}
              {workCount === 1 ? t("walk.work") : t("walk.works")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t("walk.closeStatement")}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="text-[15px] leading-relaxed text-white/80 text-pretty whitespace-pre-wrap">
            {description}
          </p>
          {socialLinks.length > 0 ? (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-[10px] tracking-[0.16em] text-white/40 uppercase">
                {t("landing.artistSocials")}
              </p>
              <SocialLinks links={socialLinks} tone="brass" />
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
