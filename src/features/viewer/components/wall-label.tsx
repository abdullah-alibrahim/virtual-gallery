"use client";

import type { SceneArtwork } from "@/core/entities";
import { museumWallLabelText } from "@/features/viewer/lib/museum-wall-label";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Thin museum wall label — title · year · medium only.
 * Quiet caption when a work is selected (collector or above the sheet).
 */
export function WallLabel({
  artwork,
  enlarged = false,
  className,
}: {
  artwork: SceneArtwork;
  /** @deprecated Artist is omitted on museum didactics; kept for call-site compat. */
  artistName?: string;
  enlarged?: boolean;
  className?: string;
}) {
  const t = useT();
  const reduceMotion = usePrefersReducedMotion();
  const { title, meta } = museumWallLabelText(
    artwork.title,
    artwork.year,
    artwork.medium,
  );

  return (
    <div
      className={cn(
        "pointer-events-none border border-white/[0.08] bg-black/45 text-center backdrop-blur-md",
        enlarged ? "px-5 py-3.5" : "px-3.5 py-2",
        !reduceMotion && "wall-label-in",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={t("walk.wallLabel")}
    >
      <p
        className={cn(
          "font-serif tracking-tight text-white/95",
          enlarged ? "text-lg md:text-xl" : "text-sm md:text-[0.95rem]",
        )}
      >
        {title}
      </p>
      {meta ? (
        <p
          className={cn(
            "mt-0.5 tracking-wide text-white/50",
            enlarged ? "text-xs md:text-sm" : "text-[10px] md:text-[11px]",
          )}
        >
          {meta}
        </p>
      ) : null}
    </div>
  );
}
