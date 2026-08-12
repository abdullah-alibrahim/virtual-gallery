"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Check, Download, Link2 } from "lucide-react";
import { toast } from "sonner";

import type { SceneArtwork } from "@/core/entities";
import {
  ROOM_MOCKUP_PRESETS,
  getRoomMockupPresetOrDefault,
} from "@/core/entities/room-mockup";
import {
  computeWallPlacement,
  dimensionsToCm,
  evaluateFit,
  framedOuterSizeCm,
} from "@/core/services/room-mockup-scale";
import { formatDimensions } from "@/core/value-objects/dimensions";
import { useLocale, useT } from "@/i18n";
import { cn } from "@/lib/utils";

import { FitVerdictPanel } from "./fit-verdict";
import { FramedArtwork2D } from "./framed-artwork";
import { MockupShell } from "./mockup-shell";
import { RoomBackdrop, RoomThumb } from "./room-backdrop";
import {
  copyTextToClipboard,
  exportRoomStagePng,
  slugifyFilename,
} from "../lib/mockup-export";

export function RoomMockupViewer({
  artwork,
  artistName,
  backHref,
  spaceHref,
}: {
  artwork: SceneArtwork;
  artistName: string;
  backHref: string;
  spaceHref: string;
}) {
  const t = useT();
  const locale = useLocale();
  const ar = locale === "ar";
  const [presetId, setPresetId] = useState(ROOM_MOCKUP_PRESETS[0]!.id);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const preset = getRoomMockupPresetOrDefault(presetId);

  const canvas = useMemo(
    () => dimensionsToCm(artwork.dimensions),
    [artwork.dimensions],
  );
  const outer = useMemo(
    () => framedOuterSizeCm(artwork.dimensions, artwork.frame),
    [artwork.dimensions, artwork.frame],
  );
  const placement = useMemo(
    () => computeWallPlacement(outer, preset),
    [outer, preset],
  );
  const verdict = useMemo(
    () => evaluateFit(outer, preset),
    [outer, preset],
  );

  const imageSrc = artwork.textures.lod1 || artwork.textures.lod0;
  const roomLabel = ar ? preset.label.ar : preset.label.en;

  const onCopyLink = async () => {
    const ok = await copyTextToClipboard(window.location.href);
    if (ok) {
      setCopied(true);
      toast.success(t("mockups.linkCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t("mockups.copyFailed"));
    }
  };

  const onDownload = async () => {
    if (!stageRef.current) return;
    setExporting(true);
    try {
      await exportRoomStagePng({
        stageEl: stageRef.current,
        artworkUrl: imageSrc,
        placement,
        wall: preset.wall,
        perspective: preset.perspective,
        frame: artwork.frame,
        canvasWidthCm: canvas.widthCm,
        canvasHeightCm: canvas.heightCm,
        filename: slugifyFilename(artwork.title, `${preset.id}-mockup`),
      });
      toast.success(t("mockups.downloaded"));
    } catch {
      toast.error(t("mockups.exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <MockupShell
      title={t("mockups.title")}
      subtitle={`${artwork.title} · ${formatDimensions(artwork.dimensions)} · ${artistName}`}
      backHref={backHref}
      actions={
        <div className="flex flex-nowrap items-center gap-2 sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 border border-border bg-card px-3 text-sm hover:bg-accent sm:h-8"
          >
            {copied ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Link2 className="size-3.5" aria-hidden />
            )}
            <span>{copied ? t("common.copied") : t("common.copy")}</span>
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={exporting}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 border border-border bg-card px-3 text-sm hover:bg-accent disabled:opacity-50 sm:h-8"
          >
            <Download className="size-3.5" aria-hidden />
            <span className="sm:hidden">
              {exporting ? t("mockups.saving") : t("mockups.save")}
            </span>
            <span className="hidden sm:inline">
              {exporting ? t("mockups.saving") : t("mockups.downloadPng")}
            </span>
          </button>
          <Link
            href={spaceHref}
            className="inline-flex h-10 shrink-0 items-center border border-foreground bg-foreground px-3 text-sm text-background hover:opacity-90 sm:h-8"
          >
            {t("mockups.yourSpace")}
          </Link>
        </div>
      }
    >
      <div className="flex w-full flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start lg:gap-8">
        <div className="space-y-3">
          <RoomSwitcher activeId={presetId} onChange={setPresetId} />
          <div
            ref={stageRef}
            className="overflow-hidden border border-border"
          >
            <RoomBackdrop preset={preset} className="mockup-fade-in">
              <div
                className="absolute"
                style={{
                  left: `${placement.offsetX * 100}%`,
                  top: `${placement.offsetY * 100}%`,
                  width: `${placement.widthFraction * 100}%`,
                  height: `${placement.heightFraction * 100}%`,
                }}
              >
                <FramedArtwork2D
                  src={imageSrc}
                  alt={artwork.title}
                  frame={artwork.frame}
                  canvasWidthCm={canvas.widthCm}
                  canvasHeightCm={canvas.heightCm}
                  className="size-full"
                />
              </div>
            </RoomBackdrop>
          </div>
        </div>

        <aside className="space-y-4">
          <FitVerdictPanel
            prompt={preset.fitPrompt}
            verdict={verdict}
            wallLabel={roomLabel}
            artworkOuter={outer}
            wallWidthCm={preset.wallWidthCm}
            wallHeightCm={preset.wallHeightCm}
          />
          <div
            className="border border-border px-4 py-3 text-sm"
            lang={ar ? "ar" : "en"}
            dir={ar ? "rtl" : "ltr"}
          >
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              {t("mockups.room")}
            </p>
            <p className="mt-1 font-medium">{roomLabel}</p>
            <dl className="mt-3 space-y-1.5 text-muted-foreground">
              <div className="flex justify-between gap-3">
                <dt>{t("mockups.wall")}</dt>
                <dd className="tabular-nums text-foreground">
                  {preset.wallWidthCm} × {preset.wallHeightCm} cm
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{t("mockups.artwork")}</dt>
                <dd className="text-foreground">
                  {formatDimensions(artwork.dimensions)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{t("mockups.frame")}</dt>
                <dd className="capitalize text-foreground">
                  {artwork.frame.style}
                  {artwork.frame.widthCm > 0
                    ? ` · ${artwork.frame.widthCm} cm`
                    : ""}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </MockupShell>
  );
}

function RoomSwitcher({
  activeId,
  onChange,
}: {
  activeId: string;
  onChange: (id: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const ar = locale === "ar";

  return (
    <div
      className="sticky top-[4.5rem] z-10 -mx-4 flex gap-2 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none"
      role="tablist"
      aria-label={t("mockups.presets")}
    >
      {ROOM_MOCKUP_PRESETS.map((preset) => {
        const active = preset.id === activeId;
        return (
          <button
            key={preset.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(preset.id)}
            className={cn(
              "group flex w-[6.25rem] shrink-0 flex-col overflow-hidden border transition-colors sm:w-28",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            <div
              className={cn(
                "aspect-[4/3] w-full border-b",
                active ? "border-background/20" : "border-border",
              )}
            >
              <RoomThumb
                category={preset.category}
                theme={preset.theme}
                imagePath={preset.imagePath}
                active={active}
                className={active ? "text-background" : "text-foreground"}
              />
            </div>
            <span
              className="truncate px-2 py-1.5 text-left text-[11px] leading-tight sm:text-xs"
              lang={ar ? "ar" : "en"}
              dir={ar ? "rtl" : "ltr"}
            >
              {ar ? preset.label.ar : preset.label.en}
            </span>
          </button>
        );
      })}
    </div>
  );
}
