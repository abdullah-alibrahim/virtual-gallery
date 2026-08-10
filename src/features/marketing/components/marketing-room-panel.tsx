"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { SceneArtwork, SceneTemplate } from "@/core/entities";
import { softMuseumTemplate } from "@/core/templates";
import { ErrorBoundary } from "@/components/shared/async-boundary";
import { RoomStill } from "@/components/shared/room-still";
import { useIsDesktop, usePrefersReducedMotion } from "@/hooks/use-media-query";
import { reportClientError } from "@/lib/errors/report";
import { cn } from "@/lib/utils";

import type { MarketingCameraMode } from "../lib/marketing-camera";

const MarketingRoomCanvas = dynamic(
  () =>
    import("./marketing-room-canvas").then((m) => m.MarketingRoomCanvas),
  { ssr: false, loading: () => null },
);

export interface MarketingRoomPanelProps {
  template?: SceneTemplate;
  artworks?: SceneArtwork[];
  cameraMode?: MarketingCameraMode;
  maxArtworks?: number;
  showWash?: boolean;
  /** Force CSS still even when WebGL is available (e.g. many cards). */
  forceStill?: boolean;
  /** Desktop-only WebGL — phones always get the CSS still. */
  desktopOnly?: boolean;
  className?: string;
  stillClassName?: string;
}

/**
 * Lazy WebGL room with CSS still first paint. Pauses when offscreen and
 * respects prefers-reduced-motion. Never mounts more than one live canvas
 * per panel instance — callers should share a single featured preview.
 */
export function MarketingRoomPanel({
  template = softMuseumTemplate,
  artworks,
  cameraMode = "orbit",
  maxArtworks = 6,
  showWash = true,
  forceStill = false,
  desktopOnly = false,
  className,
  stillClassName,
}: MarketingRoomPanelProps) {
  const reduceMotion = usePrefersReducedMotion();
  const isDesktop = useIsDesktop();
  const mobile = !isDesktop;
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);
  // Server snapshot must stay false — SSR true + dynamic canvas caused
  // hydration tears and blank overlays when WebGL later failed.
  const webglOk = useSyncExternalStore(
    subscribeNoop,
    detectWebgl,
    () => false,
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? true),
      { threshold: 0.08, rootMargin: "48px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const allow3d =
    !forceStill &&
    !webglFailed &&
    webglOk &&
    !reduceMotion &&
    !(desktopOnly && mobile);

  return (
    <div
      ref={rootRef}
      className={cn("relative size-full overflow-hidden", className)}
      style={{ backgroundColor: template.environment.background }}
    >
      {/* CSS still = first paint / reduced-motion / no-WebGL fallback. */}
      <RoomStill
        template={template}
        className={stillClassName}
        animate={!reduceMotion}
      />
      {allow3d ? (
        <div className="absolute inset-0">
          <ErrorBoundary
            fallback={() => null}
            onError={(error) => {
              reportClientError(error, { boundary: "marketing-webgl" });
              queueMicrotask(() => setWebglFailed(true));
            }}
          >
            <MarketingRoomCanvas
              template={template}
              artworks={artworks}
              mobile={mobile}
              paused={!visible}
              cameraMode={cameraMode}
              maxArtworks={maxArtworks}
              showWash={showWash}
              onContextLost={() => setWebglFailed(true)}
            />
          </ErrorBoundary>
        </div>
      ) : null}
    </div>
  );
}

function subscribeNoop() {
  return () => {};
}

function detectWebgl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
