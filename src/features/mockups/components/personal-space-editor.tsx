"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Check,
  Download,
  ImageIcon,
  RotateCcw,
  Ruler,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import type { SceneArtwork } from "@/core/entities";
import {
  DEFAULT_PERSONAL_WALL_WIDTH_CM,
  DEFAULT_REFERENCE_SEGMENT_CM,
  dimensionsToCm,
  framedOuterSizeCm,
  pixelsForWallReference,
  pixelsFromReferenceSegment,
  segmentLengthPx,
  softSnap,
} from "@/core/services/room-mockup-scale";
import { formatDimensions } from "@/core/value-objects/dimensions";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

import { FramedArtwork2D } from "./framed-artwork";
import { MockupShell } from "./mockup-shell";
import {
  exportPersonalSpacePng,
  slugifyFilename,
} from "../lib/mockup-export";

type Step = "upload" | "calibrate" | "place";

type Placement = {
  x: number;
  y: number;
  scale: number;
  rotationDeg: number;
};

type NormPoint = { x: number; y: number };

type CalibrateMode = "width" | "segment";

const DEFAULT_PLACEMENT: Placement = {
  x: 50,
  y: 42,
  scale: 1,
  rotationDeg: 0,
};

const DEFAULT_SEGMENT: [NormPoint, NormPoint] = [
  { x: 0.2, y: 0.55 },
  { x: 0.8, y: 0.55 },
];

/**
 * Personal Spaces — upload a room photo, calibrate wall scale, then place
 * framed artwork. Photos stay on-device (blob URL); no login required.
 */
export function PersonalSpaceEditor({
  artwork,
  artistName,
  backHref,
  mockupsHref,
}: {
  artwork: SceneArtwork;
  artistName: string;
  backHref: string;
  mockupsHref: string;
}) {
  const t = useT();
  const [step, setStep] = useState<Step>("upload");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoSize, setPhotoSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [wallWidthCm, setWallWidthCm] = useState(DEFAULT_PERSONAL_WALL_WIDTH_CM);
  const [calibrateMode, setCalibrateMode] =
    useState<CalibrateMode>("segment");
  const [segmentCm, setSegmentCm] = useState(DEFAULT_REFERENCE_SEGMENT_CM);
  const [segment, setSegment] = useState<[NormPoint, NormPoint]>(DEFAULT_SEGMENT);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [exporting, setExporting] = useState(false);
  const [activeHandle, setActiveHandle] = useState<0 | 1 | null>(null);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const handleDragRef = useRef<{
    pointerId: number;
    index: 0 | 1;
  } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const canvas = useMemo(
    () => dimensionsToCm(artwork.dimensions),
    [artwork.dimensions],
  );
  const outer = useMemo(
    () => framedOuterSizeCm(artwork.dimensions, artwork.frame),
    [artwork.dimensions, artwork.frame],
  );

  const basePx = useMemo(() => {
    if (!photoSize) return null;
    if (calibrateMode === "segment") {
      const segPx = segmentLengthPx(
        segment[0],
        segment[1],
        photoSize.w,
        photoSize.h,
      );
      if (segPx < 4) return null;
      return pixelsFromReferenceSegment(outer, segPx, segmentCm);
    }
    return pixelsForWallReference(outer, photoSize.w, wallWidthCm);
  }, [
    outer,
    photoSize,
    calibrateMode,
    segment,
    segmentCm,
    wallWidthCm,
  ]);

  const imageSrc = artwork.textures.lod1 || artwork.textures.lod0;

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const resetPhoto = useCallback(() => {
    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoSize(null);
    setPhotoError(null);
    setPhotoLoading(false);
    setPlacement(DEFAULT_PLACEMENT);
    setSegment(DEFAULT_SEGMENT);
    setStep("upload");
  }, []);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    setPhotoError(null);
    setPhotoLoading(true);
    const url = URL.createObjectURL(file);
    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setPlacement(DEFAULT_PLACEMENT);
    setSegment(DEFAULT_SEGMENT);
    const img = new Image();
    img.onload = () => {
      setPhotoSize({ w: img.naturalWidth, h: img.naturalHeight });
      setPhotoLoading(false);
      setStep("calibrate");
    };
    img.onerror = () => {
      setPhotoLoading(false);
      setPhotoError("Could not read that image. Try another file.");
      setPhotoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPhotoSize(null);
    };
    img.src = url;
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    multiple: false,
    noClick: false,
  });

  const clientToNorm = (clientX: number, clientY: number): NormPoint | null => {
    const stage = stageRef.current;
    if (!stage || !photoSize) return null;
    const rect = stage.getBoundingClientRect();
    // object-contain letterboxing
    const scale = Math.min(rect.width / photoSize.w, rect.height / photoSize.h);
    const dispW = photoSize.w * scale;
    const dispH = photoSize.h * scale;
    const ox = (rect.width - dispW) / 2;
    const oy = (rect.height - dispH) / 2;
    const x = (clientX - rect.left - ox) / dispW;
    const y = (clientY - rect.top - oy) / dispH;
    return {
      x: clamp(x, 0.02, 0.98),
      y: clamp(y, 0.02, 0.98),
    };
  };

  const onHandlePointerDown = (
    event: React.PointerEvent,
    index: 0 | 1,
  ) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    handleDragRef.current = { pointerId: event.pointerId, index };
    setActiveHandle(index);
  };

  const onHandlePointerMove = (event: React.PointerEvent) => {
    const drag = handleDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const pt = clientToNorm(event.clientX, event.clientY);
    if (!pt) return;
    setSegment((prev) => {
      const next: [NormPoint, NormPoint] = [...prev];
      next[drag.index] = pt;
      return next;
    });
  };

  const onHandlePointerUp = (event: React.PointerEvent) => {
    if (handleDragRef.current?.pointerId === event.pointerId) {
      handleDragRef.current = null;
      setActiveHandle(null);
    }
  };

  const onArtPointerDown = (event: React.PointerEvent) => {
    if (!stageRef.current || step !== "place") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: placement.x,
      originY: placement.y,
    };
  };

  const onArtPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !stage) return;
    const rect = stage.getBoundingClientRect();
    const dx = ((event.clientX - drag.startX) / rect.width) * 100;
    const dy = ((event.clientY - drag.startY) / rect.height) * 100;
    setPlacement((p) => ({
      ...p,
      x: clamp(drag.originX + dx, 5, 95),
      y: clamp(drag.originY + dy, 5, 95),
    }));
  };

  const onArtPointerUp = (event: React.PointerEvent) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const artWidthPct =
    photoSize && basePx
      ? ((basePx.widthCm * placement.scale) / photoSize.w) * 100
      : 18;
  const artHeightPct =
    photoSize && basePx
      ? ((basePx.heightCm * placement.scale) / photoSize.h) * 100
      : 22;

  const onDownload = async () => {
    if (!photoUrl || !photoSize || !basePx) return;
    setExporting(true);
    try {
      await exportPersonalSpacePng({
        photoUrl,
        artworkUrl: imageSrc,
        photoNatural: photoSize,
        placement,
        basePx: { width: basePx.widthCm, height: basePx.heightCm },
        frame: artwork.frame,
        canvasWidthCm: canvas.widthCm,
        canvasHeightCm: canvas.heightCm,
        filename: slugifyFilename(artwork.title, "your-space"),
      });
      toast.success(t("mockups.downloaded"));
    } catch {
      toast.error(t("mockups.exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  const canPlace = Boolean(photoUrl && photoSize && basePx);

  return (
    <MockupShell
      title={t("mockups.yourSpace")}
      subtitle={`${artwork.title} · ${formatDimensions(artwork.dimensions)} · ${artistName}`}
      backHref={backHref}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {step === "place" && photoUrl ? (
            <button
              type="button"
              onClick={onDownload}
              disabled={exporting || !basePx}
              className="inline-flex h-8 items-center gap-1.5 border border-border bg-card px-3 text-sm hover:bg-accent disabled:opacity-50"
            >
              <Download className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">
                {exporting ? t("mockups.saving") : t("mockups.downloadPng")}
              </span>
            </button>
          ) : null}
          <Link
            href={mockupsHref}
            className="inline-flex h-8 items-center border border-border bg-card px-3 text-sm hover:bg-accent"
          >
            {t("mockups.title")}
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_18rem] lg:items-start">
        <div className="space-y-3">
          <StepIndicator step={step} t={t} />

          {step === "upload" || !photoUrl ? (
            <UploadStage
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              loading={photoLoading}
              error={photoError}
            />
          ) : (
            <div
              ref={stageRef}
              className="relative aspect-[4/3] overflow-hidden border border-border bg-[#1a1816]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Your room"
                className="absolute inset-0 size-full object-contain"
                draggable={false}
              />

              {/* Dim overlay while calibrating / soft edge when placing */}
              {step === "calibrate" ? (
                <div
                  className="pointer-events-none absolute inset-0 bg-black/35"
                  aria-hidden
                />
              ) : (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 45%, transparent 48%, rgb(0 0 0 / 0.28) 100%)",
                  }}
                  aria-hidden
                />
              )}

              {step === "calibrate" && calibrateMode === "segment" ? (
                <SegmentOverlay
                  segment={segment}
                  activeHandle={activeHandle}
                  photoSize={photoSize}
                  stageRef={stageRef}
                  onHandlePointerDown={onHandlePointerDown}
                  onHandlePointerMove={onHandlePointerMove}
                  onHandlePointerUp={onHandlePointerUp}
                />
              ) : null}

              {step === "calibrate" && calibrateMode === "width" ? (
                <div
                  className="pointer-events-none absolute inset-x-[8%] top-[52%] flex items-center gap-2"
                  aria-hidden
                >
                  <div className="h-px flex-1 bg-background/80" />
                  <span className="bg-foreground px-2 py-0.5 text-[10px] tracking-wide text-background uppercase">
                    Wall width
                  </span>
                  <div className="h-px flex-1 bg-background/80" />
                </div>
              ) : null}

              {step === "place" && basePx ? (
                <div
                  className="absolute cursor-grab touch-none active:cursor-grabbing"
                  style={{
                    left: `${placement.x}%`,
                    top: `${placement.y}%`,
                    width: `${artWidthPct}%`,
                    height: `${artHeightPct}%`,
                    transform: `translate(-50%, -50%) rotate(${placement.rotationDeg}deg)`,
                  }}
                  onPointerDown={onArtPointerDown}
                  onPointerMove={onArtPointerMove}
                  onPointerUp={onArtPointerUp}
                  onPointerCancel={onArtPointerUp}
                  role="img"
                  aria-label={`Place ${artwork.title} on your wall`}
                >
                  <FramedArtwork2D
                    src={imageSrc}
                    alt={artwork.title}
                    frame={artwork.frame}
                    canvasWidthCm={canvas.widthCm}
                    canvasHeightCm={canvas.heightCm}
                    className="size-full"
                  />
                  {/* Corner handles (visual affordance) */}
                  <span className="pointer-events-none absolute -left-1 -top-1 size-2.5 border border-background bg-foreground" />
                  <span className="pointer-events-none absolute -right-1 -top-1 size-2.5 border border-background bg-foreground" />
                  <span className="pointer-events-none absolute -bottom-1 -left-1 size-2.5 border border-background bg-foreground" />
                  <span className="pointer-events-none absolute -right-1 -bottom-1 size-2.5 border border-background bg-foreground" />
                </div>
              ) : null}

              {photoLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <p className="text-sm text-muted-foreground">Loading photo…</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {step === "upload" ? (
            <div className="border border-border px-4 py-4">
              <p className="font-serif text-lg tracking-tight">How it works</p>
              <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center border border-border text-[11px] tabular-nums text-foreground">
                    1
                  </span>
                  <span>
                    <span className="font-medium text-foreground">Upload</span>
                    {" — "}a clear photo of your wall. Stays on this device.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center border border-border text-[11px] tabular-nums text-foreground">
                    2
                  </span>
                  <span>
                    <span className="font-medium text-foreground">Calibrate</span>
                    {" — "}mark a known width or enter wall centimetres.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center border border-border text-[11px] tabular-nums text-foreground">
                    3
                  </span>
                  <span>
                    <span className="font-medium text-foreground">Place</span>
                    {" — "}drag, scale, and download a client preview.
                  </span>
                </li>
              </ol>
            </div>
          ) : null}

          {step === "calibrate" ? (
            <div className="space-y-3 border border-border px-4 py-4">
              <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                Wall reference
              </p>
              <div
                className="flex border border-border"
                role="group"
                aria-label="Calibration mode"
              >
                <button
                  type="button"
                  className={cn(
                    "flex-1 px-2 py-2 text-xs transition-colors",
                    calibrateMode === "segment"
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setCalibrateMode("segment")}
                >
                  Two points
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 border-s border-border px-2 py-2 text-xs transition-colors",
                    calibrateMode === "width"
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setCalibrateMode("width")}
                >
                  Full width
                </button>
              </div>

              {calibrateMode === "segment" ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Drag the handles to mark a known span on the wall, then enter
                    its real length.
                  </p>
                  <label className="block text-sm">
                    Marked span (cm)
                    <input
                      type="number"
                      min={30}
                      max={2000}
                      step={5}
                      value={segmentCm}
                      onChange={(e) =>
                        setSegmentCm(
                          clamp(
                            Number(e.target.value) ||
                              DEFAULT_REFERENCE_SEGMENT_CM,
                            30,
                            2000,
                          ),
                        )
                      }
                      className="mt-1.5 h-9 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                  </label>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Enter the approximate visible wall width across the photo.
                  </p>
                  <label className="block text-sm">
                    Visible wall width (cm)
                    <input
                      type="number"
                      min={80}
                      max={2000}
                      step={10}
                      value={wallWidthCm}
                      onChange={(e) =>
                        setWallWidthCm(
                          clamp(
                            Number(e.target.value) ||
                              DEFAULT_PERSONAL_WALL_WIDTH_CM,
                            80,
                            2000,
                          ),
                        )
                      }
                      className="mt-1.5 h-9 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                  </label>
                </>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="inline-flex h-9 flex-1 items-center justify-center border border-border text-sm hover:bg-accent"
                  onClick={resetPhoto}
                >
                  New photo
                </button>
                <button
                  type="button"
                  disabled={!canPlace}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 border border-foreground bg-foreground text-sm text-background hover:opacity-90 disabled:opacity-40"
                  onClick={() => setStep("place")}
                >
                  <Check className="size-3.5" aria-hidden />
                  Place artwork
                </button>
              </div>
            </div>
          ) : null}

          {step === "place" && photoUrl ? (
            <div className="space-y-3 border border-border px-4 py-4">
              <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                Placement
              </p>
              <label className="block text-sm">
                Scale
                <input
                  type="range"
                  min={0.35}
                  max={2.5}
                  step={0.01}
                  value={placement.scale}
                  onChange={(e) =>
                    setPlacement((p) => ({
                      ...p,
                      scale: softSnap(Number(e.target.value), 1, 0.03),
                    }))
                  }
                  className="mt-2 w-full"
                />
                <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
                  {placement.scale.toFixed(2)}×
                  {placement.scale === 1 ? " · snapped" : ""}
                </span>
              </label>
              <label className="block text-sm">
                Rotation
                <input
                  type="range"
                  min={-15}
                  max={15}
                  step={0.5}
                  value={placement.rotationDeg}
                  onChange={(e) =>
                    setPlacement((p) => ({
                      ...p,
                      rotationDeg: softSnap(Number(e.target.value), 0, 0.75),
                    }))
                  }
                  className="mt-2 w-full"
                />
                <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
                  {placement.rotationDeg.toFixed(1)}°
                  {placement.rotationDeg === 0 ? " · level" : ""}
                </span>
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 border border-border text-sm hover:bg-accent"
                  onClick={() => setPlacement(DEFAULT_PLACEMENT)}
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Reset
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 border border-border text-sm hover:bg-accent"
                  onClick={() => setStep("calibrate")}
                >
                  <Ruler className="size-3.5" aria-hidden />
                  Recalibrate
                </button>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-full items-center justify-center border border-border text-sm hover:bg-accent"
                onClick={resetPhoto}
              >
                New photo
              </button>
              <p className="text-xs text-muted-foreground">
                Drag the artwork to place it. Scale near 1× and rotation near 0°
                snap automatically.
              </p>
            </div>
          ) : null}

          <div className="border border-border px-4 py-3 text-sm">
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Artwork
            </p>
            <p className="mt-1 font-medium">{artwork.title}</p>
            <p className="text-muted-foreground">
              {formatDimensions(artwork.dimensions)} · framed{" "}
              {Math.round(outer.widthCm)} × {Math.round(outer.heightCm)} cm
            </p>
            <button
              type="button"
              onClick={() => open()}
              className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 border border-border text-sm hover:bg-accent"
            >
              <ImageIcon className="size-3.5" aria-hidden />
              Replace photo
            </button>
          </div>
        </aside>
      </div>
    </MockupShell>
  );
}

function StepIndicator({
  step,
  t,
}: {
  step: Step;
  t: ReturnType<typeof useT>;
}) {
  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: t("mockups.upload") },
    { id: "calibrate", label: t("mockups.calibrate") },
    { id: "place", label: t("mockups.place") },
  ];
  const idx = steps.findIndex((s) => s.id === step);

  return (
    <nav aria-label="Progress" className="flex items-center gap-1">
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <div key={s.id} className="flex min-w-0 flex-1 items-center gap-1">
            <div
              className={cn(
                "flex h-8 flex-1 items-center justify-center border text-[11px] tracking-wide uppercase sm:text-xs",
                active && "border-foreground bg-foreground text-background",
                done && "border-foreground/40 text-foreground",
                !active && !done && "border-border text-muted-foreground",
              )}
            >
              <span className="tabular-nums opacity-70">{i + 1}</span>
              <span className="ms-1.5 truncate">{s.label}</span>
            </div>
            {i < steps.length - 1 ? (
              <div
                className={cn(
                  "hidden h-px w-2 shrink-0 sm:block",
                  done ? "bg-foreground/40" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function UploadStage({
  getRootProps,
  getInputProps,
  isDragActive,
  loading,
  error,
}: {
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  isDragActive: boolean;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-4 border border-dashed border-border bg-muted/30 px-6 text-center transition-colors",
        isDragActive && "border-foreground bg-accent",
        error && "border-destructive/50",
      )}
    >
      <input {...getInputProps()} />
      <div
        className="flex size-12 items-center justify-center border border-border bg-card"
        aria-hidden
      >
        <Upload className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-serif text-2xl tracking-tight">
          Upload a photo of your room
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Home, office, or gallery wall — JPEG, PNG, or WebP. The image never
          leaves this device.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Reading image…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SegmentOverlay({
  segment,
  activeHandle,
  photoSize,
  stageRef,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
}: {
  segment: [NormPoint, NormPoint];
  activeHandle: 0 | 1 | null;
  photoSize: { w: number; h: number } | null;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onHandlePointerDown: (e: React.PointerEvent, index: 0 | 1) => void;
  onHandlePointerMove: (e: React.PointerEvent) => void;
  onHandlePointerUp: (e: React.PointerEvent) => void;
}) {
  const [stageBox, setStageBox] = useState({ w: 1, h: 1 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const sync = () => {
      const r = el.getBoundingClientRect();
      setStageBox({ w: r.width, h: r.height });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stageRef]);

  const positions = useMemo(() => {
    if (!photoSize) {
      return segment.map((p) => ({
        leftPct: p.x * 100,
        topPct: p.y * 100,
      }));
    }
    const scale = Math.min(
      stageBox.w / photoSize.w,
      stageBox.h / photoSize.h,
    );
    const dispW = photoSize.w * scale;
    const dispH = photoSize.h * scale;
    const ox = (stageBox.w - dispW) / 2;
    const oy = (stageBox.h - dispH) / 2;
    return segment.map((p) => ({
      leftPct: ((ox + p.x * dispW) / stageBox.w) * 100,
      topPct: ((oy + p.y * dispH) / stageBox.h) * 100,
    }));
  }, [segment, photoSize, stageBox]);

  const a = positions[0]!;
  const b = positions[1]!;

  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 size-full" aria-hidden>
        <line
          x1={`${a.leftPct}%`}
          y1={`${a.topPct}%`}
          x2={`${b.leftPct}%`}
          y2={`${b.topPct}%`}
          stroke="white"
          strokeWidth={2}
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {([0, 1] as const).map((index) => (
        <button
          key={index}
          type="button"
          aria-label={index === 0 ? "Start of wall span" : "End of wall span"}
          className={cn(
            "absolute z-10 size-7 -translate-x-1/2 -translate-y-1/2 touch-none border-2 border-background bg-foreground",
            activeHandle === index && "scale-110",
          )}
          style={{
            left: `${positions[index]!.leftPct}%`,
            top: `${positions[index]!.topPct}%`,
          }}
          onPointerDown={(e) => onHandlePointerDown(e, index)}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        />
      ))}
      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 bg-foreground/90 px-3 py-1 text-[11px] tracking-wide text-background uppercase">
        Drag handles to mark span
      </p>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
