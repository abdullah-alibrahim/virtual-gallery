"use client";

import { Moon, X } from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import type { EveningTourSettings } from "@/core/entities";
import {
  buildEveningInviteUrl,
  formatEveningOpensAt,
  type EveningTourAccess,
} from "@/features/viewer/lib/evening-tour";
import { useLocale, useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Timed First Evening Tour invite / outside-window notice for public walk.
 */
export function EveningTourBanner({
  access,
  tour,
  sharePath,
  nightMode,
  onEnterEvening,
  onDismiss,
  showSimulate = false,
  onSimulate,
  className,
}: {
  access: EveningTourAccess;
  tour: EveningTourSettings;
  sharePath: string;
  nightMode: boolean;
  onEnterEvening: () => void;
  onDismiss: () => void;
  showSimulate?: boolean;
  onSimulate?: () => void;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const opensLabel = useMemo(
    () => formatEveningOpensAt(tour.startAt, locale === "ar" ? "ar" : "en"),
    [locale, tour.startAt],
  );

  const copyInvite = useCallback(async () => {
    if (!tour.inviteCode) return;
    const path =
      typeof window !== "undefined"
        ? `${window.location.origin}${sharePath}`
        : sharePath;
    const link = buildEveningInviteUrl(path, tour.inviteCode);
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t("walk.eveningInviteCopied"));
    } catch {
      toast.error(t("walk.copyFailed"));
    }
  }, [sharePath, t, tour.inviteCode]);

  if (access.status === "inactive") return null;

  if (access.status === "outside") {
    return (
      <div
        className={cn(
          "pointer-events-auto flex max-w-sm items-start gap-3 border border-white/[0.1] bg-black/55 px-3.5 py-3 text-left backdrop-blur-md",
          className,
        )}
        role="status"
      >
        <Moon className="mt-0.5 size-4 shrink-0 text-[color:var(--viewer-brass)]/80" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] tracking-[0.18em] text-white/40 uppercase">
            {t("walk.eveningTour")}
          </p>
          <p className="mt-1 text-sm leading-snug text-white/75">
            {t("walk.eveningOpensAt", { time: opensLabel })}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {tour.inviteCode ? (
              <button
                type="button"
                onClick={() => void copyInvite()}
                className="text-[11px] tracking-wide text-white/55 underline-offset-4 hover:text-white/85 hover:underline"
              >
                {t("walk.copyEveningInvite")}
              </button>
            ) : null}
            {showSimulate && onSimulate ? (
              <button
                type="button"
                onClick={onSimulate}
                className="text-[11px] tracking-wide text-[color:var(--viewer-brass)]/80 underline-offset-4 hover:underline"
              >
                {t("walk.simulateEvening")}
              </button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1 text-white/40 hover:text-white/75"
          aria-label={t("common.close")}
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  if (nightMode) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto flex max-w-sm items-start gap-3 border border-[color:var(--viewer-brass)]/25 bg-black/55 px-3.5 py-3 text-left backdrop-blur-md",
        className,
      )}
      role="status"
    >
      <Moon className="mt-0.5 size-4 shrink-0 text-[color:var(--viewer-brass)]" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] tracking-[0.18em] text-[color:var(--viewer-brass)]/80 uppercase">
          {t("walk.eveningTour")}
        </p>
        <p className="mt-1 text-sm leading-snug text-white/80">
          {access.via === "invite"
            ? t("walk.eveningInviteWelcome")
            : t("walk.eveningNowOpen")}
        </p>
        <button
          type="button"
          onClick={onEnterEvening}
          className="mt-2.5 border border-white/15 bg-white/90 px-3 py-1.5 text-[11px] font-medium tracking-wide text-neutral-900 transition-colors hover:bg-white"
        >
          {t("walk.enterEvening")}
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 text-white/40 hover:text-white/75"
        aria-label={t("common.close")}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
