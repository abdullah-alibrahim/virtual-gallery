"use client";

import type { LocalizedCopy } from "@/core/entities/room-mockup";
import type { FitVerdict, SizeCm } from "@/core/services/room-mockup-scale";
import { useLocale, useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function FitVerdictPanel({
  prompt,
  verdict,
  wallLabel,
  artworkOuter,
  wallWidthCm,
  wallHeightCm,
  className,
}: {
  prompt: LocalizedCopy;
  verdict: FitVerdict;
  wallLabel: string;
  artworkOuter: SizeCm;
  wallWidthCm: number;
  wallHeightCm: number;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const ar = locale === "ar";

  const artW = Math.round(artworkOuter.widthCm);
  const artH = Math.round(artworkOuter.heightCm);
  const widthPct = Math.min(100, verdict.widthRatio * 100);
  const heightPct = Math.min(100, verdict.heightRatio * 100);

  return (
    <div
      className={cn("border border-border bg-card px-4 py-4", className)}
      role="status"
      aria-live="polite"
      lang={ar ? "ar" : "en"}
      dir={ar ? "rtl" : "ltr"}
    >
      <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        {t("mockups.title")}
      </p>
      <p className="mt-2 font-serif text-xl leading-snug tracking-tight text-foreground">
        {headline(verdict.level, t)}
      </p>

      <div className="mt-4 flex items-start gap-3 border-t border-border pt-3">
        <span
          className={cn(
            "mt-1 size-2.5 shrink-0 rounded-full",
            verdict.level === "comfortable" && "bg-[color:var(--success)]",
            verdict.level === "tight" && "bg-[color:var(--warning)]",
            verdict.level === "too_large" && "bg-destructive",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {verdictLabel(verdict.level, t)} · {wallLabel}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ar ? prompt.ar : prompt.en}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {ar ? verdict.copy.ar : verdict.copy.en}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-border pt-3">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{t("mockups.artwork")}</span>
          <span className="font-medium tabular-nums text-foreground">
            {artW} × {artH} cm
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{t("mockups.wall")}</span>
          <span className="font-medium tabular-nums text-foreground">
            {wallWidthCm} × {wallHeightCm} cm
          </span>
        </div>

        <ScaleBar
          label={t("editor.width")}
          ofWall={t("mockups.wall")}
          fillPct={widthPct}
          level={verdict.level}
          ratio={verdict.widthRatio}
        />
        <ScaleBar
          label={t("editor.height")}
          ofWall={t("mockups.wall")}
          fillPct={heightPct}
          level={verdict.level}
          ratio={verdict.heightRatio}
        />
      </div>
    </div>
  );
}

function ScaleBar({
  label,
  ofWall,
  fillPct,
  level,
  ratio,
}: {
  label: string;
  ofWall: string;
  fillPct: number;
  level: FitVerdict["level"];
  ratio: number;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] tracking-wide text-muted-foreground uppercase">
        <span>{label}</span>
        <span className="tabular-nums">
          {Math.round(ratio * 100)}% {ofWall}
        </span>
      </div>
      <div className="relative h-2 w-full bg-muted">
        <div
          className="pointer-events-none absolute inset-y-0 left-[60%] w-px bg-border"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-[90%] w-px bg-border"
          aria-hidden
        />
        <div
          className={cn(
            "h-full transition-[width] duration-500 ease-out",
            level === "comfortable" && "bg-[color:var(--success)]",
            level === "tight" && "bg-[color:var(--warning)]",
            level === "too_large" && "bg-destructive",
          )}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
}

function headline(
  level: FitVerdict["level"],
  t: ReturnType<typeof useT>,
): string {
  switch (level) {
    case "comfortable":
      return t("mockups.fitGood");
    case "tight":
      return t("mockups.fitTight");
    case "too_large":
      return t("mockups.fitLarge");
  }
}

function verdictLabel(
  level: FitVerdict["level"],
  t: ReturnType<typeof useT>,
): string {
  switch (level) {
    case "comfortable":
      return t("mockups.fitGood");
    case "tight":
      return t("mockups.fitTight");
    case "too_large":
      return t("mockups.fitLarge");
  }
}
