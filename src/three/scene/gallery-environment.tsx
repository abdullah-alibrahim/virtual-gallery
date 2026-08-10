"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Component, Suspense, type ReactNode } from "react";

import type { TemplateCategory } from "@/core/entities";

import type { GalleryQuality } from "./gallery-quality";
import { shouldUseGalleryEnvironment } from "./gallery-quality";

/** Local Poly Haven studio HDR (1K) — soft PBR probe without CDN. */
export const GALLERY_HDRI_PATH = "/assets/hdri/studio_small_09_1k.hdr";

/** Remember a failed HDR load for the session so we don't retry every remount. */
let hdriUnavailable = false;

/**
 * Soft museum IBL for PBR frames/floors.
 * Walk tries local HDRI first; marketing stays on fast procedural Lightformers.
 * Does not replace scene.background — keeps procedural room colour.
 */
export function GalleryEnvironment({
  quality,
  category,
}: {
  quality: GalleryQuality;
  category: TemplateCategory;
}) {
  if (!shouldUseGalleryEnvironment(quality)) return null;

  const probe = probeStyle(category);

  // Landing / templates: keep Lightformers (no 1.6MB HDR fetch on first paint).
  if (quality === "marketing" || hdriUnavailable) {
    return <LightformerProbe {...probe} />;
  }

  return (
    <HdriErrorBoundary
      fallback={<LightformerProbe {...probe} />}
      onFail={() => {
        hdriUnavailable = true;
      }}
    >
      <Suspense fallback={<LightformerProbe {...probe} />}>
        <Environment
          files={GALLERY_HDRI_PATH}
          resolution={256}
          environmentIntensity={probe.hdrIntensity}
          background={false}
        />
      </Suspense>
    </HdriErrorBoundary>
  );
}

function LightformerProbe({
  sky,
  cool,
  intensity,
  dark,
  coolMuseum,
  warm,
}: ProbeStyle) {
  return (
    <Environment resolution={256} environmentIntensity={intensity}>
      <Lightformer
        form="rect"
        intensity={dark ? 0.7 : coolMuseum ? 1.05 : 0.85}
        color={sky}
        scale={coolMuseum ? [10, 8, 1] : [12, 2.4, 1]}
        position={[0, coolMuseum ? 6.2 : 5.4, 0]}
        rotation-x={Math.PI / 2}
      />
      <Lightformer
        form="rect"
        intensity={dark ? 0.28 : coolMuseum ? 0.48 : 0.36}
        color={cool}
        scale={coolMuseum ? [3.2, 5.2, 1] : [5.5, 3.8, 1]}
        position={coolMuseum ? [-6.2, 2.8, -0.8] : [-5.8, 2.5, 1.2]}
        target={[0, 1.5, 0]}
      />
      <Lightformer
        form="rect"
        intensity={dark ? 0.18 : coolMuseum ? 0.2 : 0.26}
        color={coolMuseum ? "#d8e0e8" : sky}
        scale={[4.5, 3.2, 1]}
        position={[5.2, 2.3, -1.2]}
        target={[0, 1.5, 0]}
      />
      <Lightformer
        form="rect"
        intensity={dark ? 0.1 : 0.14}
        color={warm ? "#e0d4c0" : coolMuseum ? "#d8dde4" : "#e4dfd4"}
        scale={[8, 8, 1]}
        position={[0, 0.15, 0]}
        rotation-x={-Math.PI / 2}
      />
      <Lightformer
        form="ring"
        intensity={dark ? 0.12 : coolMuseum ? 0.16 : 0.14}
        color={coolMuseum ? "#eef2f6" : "#f2efe8"}
        scale={3.4}
        position={[0, 3.6, -2.8]}
        target={[0, 1.55, 0]}
      />
    </Environment>
  );
}

type ProbeStyle = {
  sky: string;
  cool: string;
  intensity: number;
  hdrIntensity: number;
  dark: boolean;
  coolMuseum: boolean;
  warm: boolean;
};

function probeStyle(category: TemplateCategory): ProbeStyle {
  const dark = category === "black" || category === "night";
  const warm = category === "luxury" || category === "timber";
  const coolMuseum = category === "museum" || category === "atrium";
  const sky = dark
    ? "#8a8070"
    : warm
      ? "#e8dcc8"
      : coolMuseum
        ? "#e4ebf2"
        : "#ddd6ca";
  const cool = dark ? "#4a5560" : coolMuseum ? "#c5d2e0" : "#c8d2de";
  // Gentle probe — high intensity + ACES was washing plaster / paint.
  const intensity = dark ? 0.14 : coolMuseum ? 0.18 : 0.17;
  // Studio HDR reads brighter than Lightformers — keep soft so canvases stay true.
  const hdrIntensity = dark ? 0.1 : coolMuseum ? 0.14 : 0.13;
  return { sky, cool, intensity, hdrIntensity, dark, coolMuseum, warm };
}

class HdriErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFail: () => void },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch() {
    this.props.onFail();
  }

  override render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
