"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import type { SceneArtwork } from "@/core/entities";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function ZoomLightbox({
  artwork,
  onClose,
}: {
  artwork: SceneArtwork;
  onClose: () => void;
}) {
  const t = useT();
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Zoomed view of ${artwork.title}`}
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-sm",
        !reduceMotion && "viewer-lightbox-in",
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white/80">
        <p className="font-serif text-lg tracking-tight">{artwork.title}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-2 hover:bg-white/10"
          aria-label={t("walk.closeZoom")}
        >
          <X className="size-5" />
        </button>
      </div>
      <button
        type="button"
        className="flex flex-1 items-center justify-center px-4 pb-8"
        onClick={onClose}
        aria-label={t("walk.closeZoom")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.textures.lod0 || artwork.textures.lod1}
          alt={artwork.title}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </button>
    </div>
  );
}
