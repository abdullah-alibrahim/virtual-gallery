"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { SpotLight as SpotLightImpl } from "three";
import { Object3D } from "three";

import type { SceneTemplate } from "@/core/entities";
import { materialsFallback } from "@/core/templates";

import type { GalleryQuality } from "./gallery-quality";

/**
 * Key / fill / rim + hemisphere driven by template lighting data.
 * Soft penumbra comes from `PCFSoftShadowMap` on the Canvas (see SceneRoot /
 * MarketingRoomCanvas). drei `<SoftShadows>` (PCSS) is intentionally omitted —
 * it patches shaders with `unpackRGBAToDepth`, which Three r170+ no longer
 * provides, and produced MeshStandardMaterial shader compile failures.
 * `cinematic` (or marketing tier) richens light ratios for heroes and walk.
 *
 * Walk keeps ambient quieter so artwork spots read as lit canvases; key/fill
 * carry soft wall wash without bleaching pigment under ACES.
 */
export function GalleryLights({
  template,
  quality,
  cinematic = false,
  /** Visitor night / evening: lower ambient, warmer key, quieter wash. */
  eveningMode = false,
}: {
  template: SceneTemplate;
  quality: GalleryQuality;
  cinematic?: boolean;
  eveningMode?: boolean;
}) {
  const lighting = template.lighting;
  const materials =
    template.materials ??
    materialsFallback(template.category, template.environment.background);

  const hemi = lighting.hemisphere ?? defaultHemisphere(template.category, materials);
  const key = lighting.key ?? defaultKey(template.category);
  const fill = lighting.fill ?? defaultFill(template.category);
  const rim = lighting.rim;

  const cinematicTier = cinematic || quality === "marketing";
  // Walk: stronger key, quieter ambient → paintings hold local spot contrast.
  const keyScale =
    (quality === "edit"
      ? 0.78
      : quality === "mobile"
        ? 0.82
        : cinematicTier
          ? 0.94
          : quality === "walk"
            ? 0.9
            : 0.84) * (eveningMode ? 0.82 : 1);
  const castShadow = quality === "walk" || quality === "marketing";
  const mapSize = castShadow ? 2048 : 512;
  const ambientScale =
    (quality === "edit"
      ? 0.95
      : cinematicTier
        ? 0.7
        : quality === "walk"
          ? 0.72
          : 0.9) * (eveningMode ? 0.42 : 1);
  const hemiScale =
    (cinematicTier
      ? 0.8
      : quality === "walk"
        ? 0.76
        : quality === "edit"
          ? 0.9
          : 1) * (eveningMode ? 0.48 : 1);
  const keyColor = eveningMode ? "#ffc98a" : key.color;
  const fillColor = eveningMode ? "#6a7a92" : fill.color;
  const ambientColor = eveningMode ? "#1a1520" : lighting.ambient.color;
  const hemiSky = eveningMode ? "#3a3348" : hemi.skyColor;
  const hemiGround = eveningMode ? "#0e0c0a" : hemi.groundColor;

  const shadowHalf = useMemo(
    () => shadowFrustumHalf(template.walkBounds),
    [template.walkBounds],
  );

  return (
    <>
      <ambientLight
        color={ambientColor}
        intensity={lighting.ambient.intensity * ambientScale}
      />
      <hemisphereLight
        color={hemiSky}
        groundColor={hemiGround}
        intensity={hemi.intensity * hemiScale}
      />
      <directionalLight
        color={keyColor}
        intensity={key.intensity * keyScale * (eveningMode ? 1.05 : 1)}
        position={[key.position[0], key.position[1], key.position[2]]}
        castShadow={castShadow}
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={Math.max(48, shadowHalf * 3)}
        shadow-camera-left={-shadowHalf}
        shadow-camera-right={shadowHalf}
        shadow-camera-top={shadowHalf}
        shadow-camera-bottom={-shadowHalf}
        shadow-bias={-0.00012}
        shadow-normalBias={0.04}
        shadow-radius={castShadow ? 4 : 1}
      />
      <directionalLight
        color={fillColor}
        intensity={
          fill.intensity *
          keyScale *
          (cinematicTier ? 0.98 : 0.92) *
          (eveningMode ? 0.55 : 1)
        }
        position={[fill.position[0], fill.position[1], fill.position[2]]}
      />
      {rim ? (
        <directionalLight
          color={eveningMode ? "#c4a882" : rim.color}
          intensity={
            rim.intensity *
            (quality === "mobile" ? 0.55 : cinematicTier ? 0.88 : 0.75) *
            (eveningMode ? 0.7 : 1)
          }
          position={[rim.position[0], rim.position[1], rim.position[2]]}
        />
      ) : null}
      {quality === "walk" ? (
        <GalleryWallWash template={template} eveningMode={eveningMode} />
      ) : null}
    </>
  );
}

/**
 * Soft museum wall wash for walk — complements per-artwork spots without the
 * marketing hero ShowWash intensity.
 */
function GalleryWallWash({
  template,
  eveningMode = false,
}: {
  template: SceneTemplate;
  eveningMode?: boolean;
}) {
  const lightRef = useRef<SpotLightImpl>(null);
  const targetRef = useRef<Object3D>(null);
  const north =
    template.walls.find((w) => w.id === "north") ??
    template.walls.find((w) => /north/i.test(w.id)) ??
    template.walls[0];
  const targetZ = (north?.origin[2] ?? -5) + 0.12;
  const hangY = Math.min(1.75, (north?.height ?? 3.2) * 0.45);

  useLayoutEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, [targetZ, hangY]);

  return (
    <>
      <spotLight
        ref={lightRef}
        color={eveningMode ? "#ffb56e" : "#fff6ea"}
        intensity={eveningMode ? 0.95 : 1.35}
        angle={0.62}
        penumbra={0.82}
        distance={22}
        position={[0.15, 3.55, Math.max(1.4, targetZ + 7.2)]}
        castShadow={false}
        decay={2}
      />
      <object3D ref={targetRef} position={[0, hangY, targetZ]} />
    </>
  );
}

function shadowFrustumHalf(walkBounds: SceneTemplate["walkBounds"]): number {
  let maxAbs = 14;
  for (const [x, z] of walkBounds) {
    maxAbs = Math.max(maxAbs, Math.abs(x), Math.abs(z));
  }
  return maxAbs + 4;
}

function defaultHemisphere(
  category: SceneTemplate["category"],
  materials: { floor: string },
) {
  if (category === "black" || category === "night") {
    return { skyColor: "#6a655c", groundColor: "#1a1a1a", intensity: 0.25 };
  }
  if (category === "luxury") {
    return { skyColor: "#e8d4b8", groundColor: materials.floor, intensity: 0.32 };
  }
  return { skyColor: "#f8f6f1", groundColor: "#c8c2b6", intensity: 0.38 };
}

function defaultKey(category: SceneTemplate["category"]) {
  if (category === "black" || category === "night") {
    return {
      color: "#ffd7a8",
      intensity: 0.8,
      position: [0, 4.5, 1.5] as const,
    };
  }
  return {
    color: "#fff8f0",
    intensity: 1.05,
    position: [-2.2, 5.8, 2.8] as const,
  };
}

function defaultFill(category: SceneTemplate["category"]) {
  if (category === "black" || category === "night") {
    return {
      color: "#8a9bb0",
      intensity: 0.16,
      position: [-3, 2.5, -2] as const,
    };
  }
  return {
    color: "#e2e8f0",
    intensity: 0.34,
    position: [3.5, 3.2, -2.2] as const,
  };
}
