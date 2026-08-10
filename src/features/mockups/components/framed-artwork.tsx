"use client";

import type { FrameSpec } from "@/core/value-objects/frame-spec";
import { cn } from "@/lib/utils";

/**
 * 2D framed painting for mockup compositing. Moulding and matte widths are
 * fractions of the outer box so ratios match `framedOuterSizeCm`. Absolute
 * insets (not padding %) keep vertical and horizontal cm correct.
 *
 * Visual stack: soft wall contact shadow → moulding with bevel highlight →
 * matte recess → canvas with subtle edge falloff.
 */
export function FramedArtwork2D({
  src,
  alt,
  frame,
  canvasWidthCm,
  canvasHeightCm,
  className,
  style,
  showContactShadow = true,
}: {
  src: string;
  alt: string;
  frame: FrameSpec;
  canvasWidthCm: number;
  canvasHeightCm: number;
  className?: string;
  style?: React.CSSProperties;
  showContactShadow?: boolean;
}) {
  const moulding = frame.widthCm;
  const matte = frame.matteCm;
  const outerW = canvasWidthCm + 2 * (moulding + matte);
  const outerH = canvasHeightCm + 2 * (moulding + matte);

  const mouldingX = outerW > 0 ? (moulding / outerW) * 100 : 0;
  const mouldingY = outerH > 0 ? (moulding / outerH) * 100 : 0;
  const matteX =
    canvasWidthCm + 2 * matte > 0
      ? (matte / (canvasWidthCm + 2 * matte)) * 100
      : 0;
  const matteY =
    canvasHeightCm + 2 * matte > 0
      ? (matte / (canvasHeightCm + 2 * matte)) * 100
      : 0;

  const hasMoulding = moulding > 0;

  return (
    <div
      className={cn("relative box-border", className)}
      style={style}
    >
      {showContactShadow ? (
        <div
          className="pointer-events-none absolute"
          aria-hidden
          style={{
            inset: "2% -1% -4% -1%",
            background:
              "radial-gradient(ellipse at 50% 100%, rgb(0 0 0 / 0.35) 0%, rgb(0 0 0 / 0.12) 42%, transparent 72%)",
            filter: "blur(2px)",
            zIndex: 0,
          }}
        />
      ) : null}

      <div
        className="relative box-border size-full overflow-hidden"
        style={{
          backgroundColor: frame.color,
          boxShadow: hasMoulding
            ? [
                "inset 0 1px 0 rgb(255 255 255 / 0.22)",
                "inset 0 -1px 0 rgb(0 0 0 / 0.35)",
                "inset 1px 0 0 rgb(255 255 255 / 0.08)",
                "inset -1px 0 0 rgb(0 0 0 / 0.25)",
                "0 1px 2px rgb(0 0 0 / 0.2)",
                "0 6px 18px rgb(0 0 0 / 0.22)",
                "0 14px 36px rgb(0 0 0 / 0.12)",
              ].join(", ")
            : "0 4px 16px rgb(0 0 0 / 0.2)",
          zIndex: 1,
        }}
      >
        {/* Moulding bevel wash */}
        {hasMoulding ? (
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                "linear-gradient(135deg, rgb(255 255 255 / 0.18) 0%, transparent 42%, rgb(0 0 0 / 0.12) 100%)",
            }}
          />
        ) : null}

        <div
          className="absolute overflow-hidden"
          style={{
            top: `${mouldingY}%`,
            right: `${mouldingX}%`,
            bottom: `${mouldingY}%`,
            left: `${mouldingX}%`,
            backgroundColor: frame.matteColor,
            boxShadow:
              "inset 0 0 0 1px rgb(0 0 0 / 0.06), inset 0 2px 6px rgb(0 0 0 / 0.08)",
          }}
        >
          <div
            className="absolute overflow-hidden"
            style={{
              top: `${matteY}%`,
              right: `${matteX}%`,
              bottom: `${matteY}%`,
              left: `${matteX}%`,
              boxShadow: "inset 0 0 12px rgb(0 0 0 / 0.12)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="size-full object-cover"
              draggable={false}
            />
            {/* Canvas edge falloff */}
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                boxShadow: "inset 0 0 20px rgb(0 0 0 / 0.1)",
                background:
                  "linear-gradient(180deg, rgb(255 255 255 / 0.04), transparent 30%, transparent 70%, rgb(0 0 0 / 0.06))",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
