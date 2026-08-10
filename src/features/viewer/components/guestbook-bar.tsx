"use client";

import { Heart, MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getOrCreateVisitorId } from "@/lib/analytics/visitor-id";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

type GuestState = {
  hearted: boolean;
  visited: boolean;
  hearts: number;
  visits: number;
};

function storageKey(galleryId: string) {
  return `vg.guestbook.${galleryId}`;
}

function loadLocal(galleryId: string): GuestState {
  const empty: GuestState = {
    hearted: false,
    visited: false,
    hearts: 0,
    visits: 0,
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(storageKey(galleryId));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<GuestState>;
    return {
      hearted: Boolean(parsed.hearted),
      visited: Boolean(parsed.visited),
      hearts: Number(parsed.hearts) || 0,
      visits: Number(parsed.visits) || 0,
    };
  } catch {
    return empty;
  }
}

function saveLocal(galleryId: string, state: GuestState) {
  try {
    window.localStorage.setItem(storageKey(galleryId), JSON.stringify(state));
  } catch {
    // Ignore quota / private mode.
  }
}

function beacon(type: "heart" | "visit", galleryId: string) {
  void fetch("/api/analytics/beacon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      galleryId,
      visitorId: getOrCreateVisitorId(),
    }),
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Lightweight guestbook — ♥ and “I visited” with local persistence.
 * Published galleries also ping analytics (silent no-op for demos/drafts).
 */
export function GuestbookBar({
  galleryId,
  className,
}: {
  galleryId: string;
  className?: string;
}) {
  const [state, setState] = useState<GuestState>(() => loadLocal(galleryId));
  const t = useT();

  useEffect(() => {
    setState(loadLocal(galleryId));
  }, [galleryId]);

  const toggleHeart = useCallback(() => {
    setState((prev) => {
      const next: GuestState = {
        ...prev,
        hearted: !prev.hearted,
        hearts: Math.max(0, prev.hearts + (prev.hearted ? -1 : 1)),
      };
      saveLocal(galleryId, next);
      if (!prev.hearted) {
        beacon("heart", galleryId);
        toast.success(t("walk.addedLikes"));
      }
      return next;
    });
  }, [galleryId, t]);

  const markVisited = useCallback(() => {
    setState((prev) => {
      if (prev.visited) return prev;
      const next: GuestState = {
        ...prev,
        visited: true,
        visits: prev.visits + 1,
      };
      saveLocal(galleryId, next);
      beacon("visit", galleryId);
      toast.success(t("walk.markedVisited"));
      return next;
    });
  }, [galleryId, t]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-1 border border-white/[0.09] bg-[color:var(--viewer-scrim)] p-0.5 backdrop-blur-md sm:p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggleHeart}
        aria-pressed={state.hearted}
        aria-label={state.hearted ? t("walk.unlikeGallery") : t("walk.likeGallery")}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 px-2.5 text-xs tracking-wide transition-colors",
          state.hearted
            ? "bg-white/15 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <Heart
          className={cn("size-3.5", state.hearted && "fill-current")}
          aria-hidden
        />
        <span className="tabular-nums">{Math.max(state.hearts, state.hearted ? 1 : 0)}</span>
      </button>
      <button
        type="button"
        onClick={markVisited}
        aria-pressed={state.visited}
        aria-label={state.visited ? t("walk.alreadyVisited") : t("walk.markVisited")}
        disabled={state.visited}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 px-2.5 text-xs tracking-wide transition-colors",
          state.visited
            ? "text-white/45"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <MapPin className="size-3.5" aria-hidden />
        <span>{state.visited ? t("walk.visited") : t("walk.iVisited")}</span>
      </button>
    </div>
  );
}
