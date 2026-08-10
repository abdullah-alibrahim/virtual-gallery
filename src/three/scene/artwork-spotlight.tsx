"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, Object3D, SpotLight as ThreeSpotLight } from "three";

/**
 * Soft museum track for frame + wall pool. Canvas paint is unlit (Basic) for
 * color fidelity — spots must not grey corners or crush midtones on the image.
 */
export const ARTWORK_SPOT_INTENSITY_SCALE = 2.05;

/** Clamp editor/demo angles into a gallery-readable cone. */
export function clampSpotlightAngle(angle: number): number {
  return Math.max(0.32, Math.min(0.88, angle));
}

export function spotlightThrowDistance(width: number, height: number): number {
  return Math.max(width, height) * 2.15 + 1.05;
}

/**
 * Aim a warm spotlight at the canvas centre from above-front.
 * Temperature is mapped to a simple black-body approximation.
 */
export function ArtworkSpotlight({
  width,
  height,
  intensity,
  angle,
  temperatureK,
}: {
  width: number;
  height: number;
  intensity: number;
  angle: number;
  temperatureK: number;
}) {
  const lightRef = useRef<ThreeSpotLight>(null);
  const targetRef = useRef<Object3D>(null);
  const color = useMemo(() => temperatureToColor(temperatureK), [temperatureK]);
  const throwDist = spotlightThrowDistance(width, height);
  // Soft track: above the top edge, modest standoff — pool covers moulding +
  // wall without hard falloff on the (unlit) paint plane.
  const elev = height * 0.48 + 0.55;
  const standoff = throwDist * 0.5;

  useLayoutEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
      lightRef.current.target.updateMatrixWorld();
    }
  }, []);

  return (
    <>
      <spotLight
        ref={lightRef}
        color={color}
        intensity={intensity * ARTWORK_SPOT_INTENSITY_SCALE}
        angle={clampSpotlightAngle(angle)}
        penumbra={0.94}
        distance={throwDist * 2.05}
        position={[0, elev, standoff]}
        castShadow={false}
        decay={2}
      />
      {/* Soft pool centre — mild upper bias; wide penumbra avoids hard vignette. */}
      <object3D ref={targetRef} position={[0, height * 0.04, 0]} />
    </>
  );
}

function temperatureToColor(kelvin: number): Color {
  const t = Math.max(1000, Math.min(8000, kelvin)) / 100;
  let r: number;
  let g: number;
  let b: number;

  if (t <= 66) {
    r = 255;
    g = Math.min(255, Math.max(0, 99.4708 * Math.log(t) - 161.1196));
  } else {
    r = Math.min(255, Math.max(0, 329.6987 * (t - 60) ** -0.1332));
    g = Math.min(255, Math.max(0, 288.1222 * (t - 60) ** -0.0755));
  }

  if (t >= 66) b = 255;
  else if (t <= 19) b = 0;
  else b = Math.min(255, Math.max(0, 138.5177 * Math.log(t - 10) - 305.0448));

  return new Color(r / 255, g / 255, b / 255);
}
