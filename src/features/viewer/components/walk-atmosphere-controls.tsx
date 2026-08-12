"use client";

import { Moon, Sun, Volume2, VolumeX } from "lucide-react";

import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Compact Walk HUD cluster: Night Mode + place sound mute.
 * Sits beside existing chrome without cluttering the title plaque.
 */
export function WalkAtmosphereControls({
  nightMode,
  soundMuted,
  onToggleNight,
  onToggleSound,
  className,
}: {
  nightMode: boolean;
  soundMuted: boolean;
  onToggleNight: () => void;
  onToggleSound: () => void;
  className?: string;
}) {
  const t = useT();

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 border border-white/[0.09] bg-[color:var(--viewer-scrim)] p-0.5 backdrop-blur-md sm:gap-1 sm:p-1",
        className,
      )}
      role="group"
      aria-label={t("walk.atmosphere")}
    >
      <AtmButton
        label={nightMode ? t("walk.dayMode") : t("walk.nightMode")}
        active={nightMode}
        onClick={onToggleNight}
      >
        {nightMode ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </AtmButton>
      <AtmButton
        label={soundMuted ? t("walk.unmuteSound") : t("walk.muteSound")}
        active={soundMuted}
        onClick={onToggleSound}
      >
        {soundMuted ? (
          <VolumeX className="size-4" />
        ) : (
          <Volume2 className="size-4" />
        )}
      </AtmButton>
    </div>
  );
}

function AtmButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:size-10",
        active && "bg-white/12 text-white",
      )}
    >
      {children}
    </button>
  );
}
