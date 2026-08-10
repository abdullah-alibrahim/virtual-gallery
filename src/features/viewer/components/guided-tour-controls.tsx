"use client";

import { ChevronLeft, ChevronRight, Route } from "lucide-react";
import { useMemo } from "react";

import type { SceneArtwork } from "@/core/entities";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Suggested walk order — sequential artwork navigation for a guided pass.
 */
export function GuidedTourControls({
  artworks,
  currentId,
  active,
  onToggle,
  onSelect,
  className,
}: {
  artworks: readonly SceneArtwork[];
  currentId: string | null;
  active: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const ordered = useMemo(() => [...artworks], [artworks]);
  const index = currentId
    ? ordered.findIndex((a) => a.id === currentId)
    : -1;
  const total = ordered.length;
  const current = index >= 0 ? ordered[index] : null;
  const prev = index > 0 ? ordered[index - 1] : null;
  const next =
    index >= 0 && index < total - 1
      ? ordered[index + 1]
      : index < 0 && total > 0
        ? ordered[0]
        : null;

  const t = useT();
  if (total < 2) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-col gap-1 border border-white/[0.08] bg-[color:var(--viewer-scrim)] backdrop-blur-md",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-2 px-3 text-xs tracking-wide transition-colors",
          active
            ? "bg-white/15 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <Route className="size-3.5" aria-hidden />
        {active ? t("walk.tourOn") : t("walk.guidedTour")}
      </button>

      {active ? (
        <div className="flex items-center gap-0.5 border-t border-white/10 p-0.5">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && onSelect(prev.id)}
            aria-label={t("walk.prevTour")}
            className="flex size-9 items-center justify-center text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="min-w-0 flex-1 truncate px-1 text-center text-[11px] text-white/55">
            {current
              ? `${index + 1} / ${total}`
              : `1–${total}`}
          </p>
          <button
            type="button"
            disabled={!next}
            onClick={() => next && onSelect(next.id)}
            aria-label={t("walk.nextTour")}
            className="flex size-9 items-center justify-center text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
