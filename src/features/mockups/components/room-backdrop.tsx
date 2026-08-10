"use client";

import type { RoomMockupCategory, RoomMockupPreset } from "@/core/entities/room-mockup";
import { cn } from "@/lib/utils";

/**
 * Room backdrop for artwork mockups. Prefers a real interior photo when
 * `preset.imagePath` is set; falls back to the procedural SVG set.
 */
export function RoomBackdrop({
  preset,
  className,
  children,
}: {
  preset: RoomMockupPreset;
  className?: string;
  children?: React.ReactNode;
}) {
  const { theme, wall, perspective, imagePath } = preset;
  const isDark = preset.category === "restaurant";
  const uid = preset.id;

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden border border-border",
        className,
      )}
      style={{ backgroundColor: theme.ceilingColor }}
      data-mockup-stage
    >
      {imagePath ? (
        // eslint-disable-next-line @next/next/no-img-element -- static public mockup photo
        <img
          src={imagePath}
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable={false}
        />
      ) : (
        <SvgRoomBackdrop preset={preset} uid={uid} isDark={isDark} />
      )}

      {/* Hang plane */}
      <div
        className="absolute"
        style={{
          left: `${wall.x * 100}%`,
          top: `${wall.y * 100}%`,
          width: `${wall.width * 100}%`,
          height: `${wall.height * 100}%`,
          perspective: "1100px",
        }}
      >
        <div
          className="relative size-full"
          style={{
            transform: [
              perspective?.rotateYDeg
                ? `rotateY(${perspective.rotateYDeg}deg)`
                : null,
              perspective?.rotateXDeg
                ? `rotateX(${perspective.rotateXDeg}deg)`
                : null,
              perspective?.skewXDeg
                ? `skewX(${perspective.skewXDeg}deg)`
                : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined,
            transformStyle: "preserve-3d",
          }}
        >
          {children}
        </div>
      </div>

      {/* Soft vignette so hung work sits in the photo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at 50% 42%, transparent 40%, rgb(0 0 0 / 0.35) 100%)"
            : "radial-gradient(ellipse at 48% 40%, transparent 48%, rgb(28 22 16 / 0.16) 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}

/** Compact thumbnail for the room switcher — photo when available. */
export function RoomThumb({
  category,
  theme,
  active,
  className,
  imagePath,
}: {
  category: RoomMockupCategory;
  theme: RoomMockupPreset["theme"];
  active?: boolean;
  className?: string;
  imagePath?: string;
}) {
  if (imagePath) {
    return (
      <div className={cn("relative size-full", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagePath}
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
        {active ? (
          <div
            className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-current"
            aria-hidden
          />
        ) : null}
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 40 30"
      className={cn("size-full", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={40} height={30} fill={theme.ceilingColor} />
      <polygon points="0,0 40,0 34,9 6,9" fill={shade(theme.ceilingColor, -4)} />
      <rect x={6} y={9} width={28} height={14} fill={theme.wallColor} />
      <polygon points="0,0 6,9 6,23 0,30" fill={shade(theme.wallColor, -10)} />
      <polygon points="40,0 34,9 34,23 40,30" fill={shade(theme.wallColor, -14)} />
      <polygon points="6,23 34,23 40,30 0,30" fill={theme.floorColor} />
      <rect x={6} y={22.2} width={28} height={0.9} fill={theme.trimColor} />
      {thumbFurniture(category, theme.furnitureColor, theme.accentColor)}
      {active ? (
        <rect
          x={0.4}
          y={0.4}
          width={39.2}
          height={29.2}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
        />
      ) : null}
    </svg>
  );
}

function SvgRoomBackdrop({
  preset,
  uid,
  isDark,
}: {
  preset: RoomMockupPreset;
  uid: string;
  isDark: boolean;
}) {
  const { theme } = preset;
  return (
    <svg
      viewBox="0 0 100 75"
      className="absolute inset-0 size-full"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.55" />
        </filter>
        <filter id={`${uid}-grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.04 0"
          />
        </filter>
        <linearGradient id={`${uid}-wall-wash`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity={isDark ? 0.04 : 0.14} />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity={isDark ? 0.22 : 0.06} />
        </linearGradient>
        <linearGradient id={`${uid}-floor`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={shade(theme.floorColor, isDark ? 18 : 12)} />
          <stop offset="100%" stopColor={shade(theme.floorColor, isDark ? -10 : -18)} />
        </linearGradient>
        <linearGradient id={`${uid}-ceil`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={shade(theme.ceilingColor, 8)} />
          <stop offset="100%" stopColor={shade(theme.ceilingColor, -6)} />
        </linearGradient>
        <radialGradient id={`${uid}-window`} cx="70%" cy="28%" r="22%">
          <stop offset="0%" stopColor="#fff" stopOpacity={isDark ? 0.08 : 0.28} />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <polygon points="0,0 100,0 88,22 12,22" fill={`url(#${uid}-ceil)`} />
      <rect x={12} y={22} width={76} height={38} fill={theme.wallColor} />
      <rect x={12} y={22} width={76} height={38} fill={`url(#${uid}-wall-wash)`} />
      <polygon points="0,0 12,22 12,60 0,75" fill={shade(theme.wallColor, isDark ? 14 : -10)} />
      <polygon points="100,0 88,22 88,60 100,75" fill={shade(theme.wallColor, isDark ? 8 : -16)} />
      <polygon points="12,60 88,60 100,75 0,75" fill={`url(#${uid}-floor)`} />
      <rect x={12} y={58.2} width={76} height={1.9} fill={theme.trimColor} />
      <rect
        x={12}
        y={22}
        width={76}
        height={38}
        filter={`url(#${uid}-grain)`}
        opacity={isDark ? 0.35 : 0.55}
        style={{ mixBlendMode: "multiply" }}
      />
      {furnitureFor(preset, uid)}
    </svg>
  );
}

function furnitureFor(preset: RoomMockupPreset, uid: string) {
  const c = preset.theme.furnitureColor;
  const accent = preset.theme.accentColor;
  const shadow = `url(#${uid}-soft)`;

  switch (preset.category) {
    case "living":
      return (
        <g>
          <ellipse cx={32} cy={59.5} rx={16} ry={2.2} fill="rgb(0 0 0 / 0.22)" filter={shadow} />
          <path d="M16 54.5h30v5.5H16z" fill={c} />
          <path d="M16 50.5h4v4H16zm26 0h4v4h-4z" fill={shade(c, 18)} />
          <rect x={70} y={52} width={9} height={6.5} fill={shade(c, 12)} />
          <ellipse cx={74.5} cy={50} rx={2.2} ry={3.2} fill={accent} opacity={0.75} />
        </g>
      );
    case "office":
      return (
        <g>
          <rect x={20} y={51.5} width={36} height={1.2} fill={shade(c, 30)} />
          <rect x={34} y={45} width={10} height={6.5} fill={shade(c, -20)} />
          <rect x={72} y={40} width={10} height={18} fill={shade(c, 8)} />
        </g>
      );
    case "hall":
      return (
        <g>
          <rect x={16} y={53} width={18} height={1} fill={shade(c, 25)} />
          <rect x={66} y={53} width={16} height={1} fill={shade(c, 25)} />
        </g>
      );
    case "gallery":
      return (
        <g>
          <rect x={40} y={55.5} width={20} height={1.1} fill={c} />
          <rect x={22} y={22.4} width={56} height={0.45} fill={shade(c, 40)} opacity={0.5} />
        </g>
      );
    case "restaurant":
      return (
        <g>
          <path d="M18 52c0-2 4-3.5 10-3.5s10 1.5 10 3.5v6H18z" fill={c} />
          <path d="M62 52c0-2 4-3.5 10-3.5s10 1.5 10 3.5v6H62z" fill={c} />
          <ellipse cx={50} cy={56} rx={5} ry={2.2} fill={shade(c, 18)} />
        </g>
      );
  }
}

function thumbFurniture(
  category: RoomMockupCategory,
  furniture: string,
  accent: string,
) {
  switch (category) {
    case "living":
      return (
        <g>
          <rect x={8} y={20} width={12} height={3.5} fill={furniture} />
          <rect x={28} y={19} width={5} height={4.5} fill={furniture} />
        </g>
      );
    case "office":
      return (
        <g>
          <rect x={10} y={20} width={14} height={2.5} fill={furniture} />
          <rect x={29} y={14} width={5} height={8} fill={furniture} />
        </g>
      );
    case "hall":
      return (
        <g>
          <rect x={7} y={21} width={8} height={2} fill={furniture} />
          <rect x={25} y={21} width={8} height={2} fill={furniture} />
        </g>
      );
    case "gallery":
      return <rect x={15} y={22} width={10} height={1.5} fill={furniture} />;
    case "restaurant":
      return (
        <g>
          <ellipse cx={12} cy={22} rx={4} ry={2} fill={furniture} />
          <ellipse cx={28} cy={22} rx={4} ry={2} fill={furniture} />
          <rect x={18} y={18} width={3} height={4} fill={accent} opacity={0.6} />
        </g>
      );
  }
}

function shade(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const full =
    n.length === 3
      ? n
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : n;
  const num = Number.parseInt(full, 16);
  if (!Number.isFinite(num)) return hex;
  const r = clampByte(((num >> 16) & 255) + amount);
  const g = clampByte(((num >> 8) & 255) + amount);
  const b = clampByte((num & 255) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}
