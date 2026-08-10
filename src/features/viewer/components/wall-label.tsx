"use client";

import type { SceneArtwork } from "@/core/entities";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * Museum wall label — title · year · medium under the focused work.
 * Shown when a work is selected but the detail sheet is not the focus
 * (collector mode), or as a quiet caption above the sheet.
 */
export function WallLabel({
  artwork,
  artistName,
  enlarged = false,
  className,
}: {
  artwork: SceneArtwork;
  artistName: string;
  enlarged?: boolean;
  className?: string;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const meta = [artwork.year, artwork.medium].filter(Boolean).join(" · ");

  return (
    <div
      className={cn(
        "pointer-events-none border border-white/[0.1] bg-black/50 px-4 py-3 text-center backdrop-blur-md",
        enlarged ? "px-5 py-4" : "",
        !reduceMotion && "wall-label-in",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <p
        className={cn(
          "font-serif tracking-tight text-white/95",
          enlarged ? "text-xl md:text-2xl" : "text-base md:text-lg",
        )}
      >
        {artwork.title}
      </p>
      <p
        className={cn(
          "mt-1 tracking-wide text-white/55",
          enlarged ? "text-sm" : "text-xs",
        )}
      >
        {artistName}
        {meta ? (
          <>
            <span className="mx-1.5 text-white/25">·</span>
            {meta}
          </>
        ) : null}
      </p>
    </div>
  );
}
