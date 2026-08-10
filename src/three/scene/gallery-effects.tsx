"use client";

import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

import type { GalleryQuality } from "./gallery-quality";
import { shouldUsePostprocessing } from "./gallery-quality";

/**
 * Tasteful museum-grade post stack — not neon cyberpunk.
 * Bloom stays high-threshold; walk grading stays near-neutral so unlit paint
 * planes keep midtone fidelity (thumbnails ≈ 3D canvas).
 * Lazy-imported from SceneRoot / marketing so edit mode never pays the cost.
 */
export function GalleryEffects({
  quality,
  reducedMotion = false,
  toneMapping = "aces",
  preset = "default",
}: {
  quality: GalleryQuality;
  reducedMotion?: boolean;
  toneMapping?: "aces" | "neutral" | "linear";
  /**
   * `marketing` / `landing` — richer Soft Museum grade for heroes & previews.
   * `default` — walk / public viewer (aligned close to marketing, slightly quieter).
   */
  preset?: "default" | "marketing" | "landing";
}) {
  if (!shouldUsePostprocessing(quality, reducedMotion)) return null;

  const mode =
    toneMapping === "neutral"
      ? ToneMappingMode.NEUTRAL
      : toneMapping === "linear"
        ? ToneMappingMode.LINEAR
        : ToneMappingMode.ACES_FILMIC;

  const rich = preset === "marketing" || preset === "landing";

  if (quality === "mobile") {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <ToneMapping mode={mode} />
        <BrightnessContrast
          brightness={rich ? 0.002 : 0}
          contrast={rich ? 0.04 : 0.02}
        />
        <Vignette
          eskil={false}
          offset={rich ? 0.28 : 0.32}
          darkness={rich ? 0.28 : 0.18}
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {/* Very high threshold — fixtures / brass only; paint stays unbloomed. */}
      <Bloom
        luminanceThreshold={rich ? 0.94 : 0.96}
        luminanceSmoothing={0.55}
        intensity={rich ? 0.1 : 0.055}
        mipmapBlur
      />
      <BrightnessContrast
        brightness={rich ? 0.002 : 0}
        contrast={rich ? 0.05 : 0.028}
      />
      <Vignette
        eskil={false}
        offset={rich ? 0.2 : 0.26}
        darkness={rich ? 0.32 : 0.2}
      />
      <ToneMapping mode={mode} />
      <SMAA />
    </EffectComposer>
  );
}
