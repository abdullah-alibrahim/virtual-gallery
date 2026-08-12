"use client";

import { Moon, Sun, Sunrise, Sunset, Volume2, VolumeX } from "lucide-react";

import type { DaylightPeriod } from "@/features/viewer/lib/daylight";
import { isNightLikePeriod } from "@/features/viewer/lib/daylight";
import type { MessageKey } from "@/i18n";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

const PERIOD_LABEL: Record<DaylightPeriod, MessageKey> = {
  morning: "walk.morning",
  noon: "walk.noon",
  evening: "walk.evening",
  night: "walk.night",
};

/**
 * Compact Walk HUD cluster: daylight cycle + place sound mute.
 * Sits beside existing chrome without cluttering the title plaque.
 */
export function WalkAtmosphereControls({
  daylight,
  soundMuted,
  onCycleDaylight,
  onToggleSound,
  className,
}: {
  daylight: DaylightPeriod;
  soundMuted: boolean;
  onCycleDaylight: () => void;
  onToggleSound: () => void;
  className?: string;
}) {
  const t = useT();
  const periodLabel = t(PERIOD_LABEL[daylight]);

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
        label={`${t("walk.cycleDaylight")}: ${periodLabel}`}
        active={isNightLikePeriod(daylight)}
        onClick={onCycleDaylight}
      >
        <DaylightIcon period={daylight} />
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

function DaylightIcon({ period }: { period: DaylightPeriod }) {
  switch (period) {
    case "morning":
      return <Sunrise className="size-4" />;
    case "noon":
      return <Sun className="size-4" />;
    case "evening":
      return <Sunset className="size-4" />;
    case "night":
      return <Moon className="size-4" />;
  }
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
