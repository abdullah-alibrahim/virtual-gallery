/**
 * Pure camera path for the landing Soft Museum hero.
 * Frontal arc in front of the north wall with slow ken-burns look targets —
 * paintings stay large in frame instead of a distant full-room orbit.
 */

export const LANDING_LOOK_FOCI = [
  [0, 1.72, -5.05],
  [-3.15, 1.66, -5.05],
  [3.15, 1.66, -5.05],
  [5.05, 1.68, -2.45],
  [-5.05, 1.7, -2.45],
] as const;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Slow hold-then-blend look target cycling across wall foci. */
export function landingLookTarget(
  elapsed: number,
  foci: readonly (readonly [number, number, number])[] = LANDING_LOOK_FOCI,
  periodSec = 8.5,
): [number, number, number] {
  if (foci.length === 0) return [0, 1.7, -5];
  const total = foci.length * periodSec;
  const u = ((elapsed % total) + total) % total;
  const idx = Math.floor(u / periodSec) % foci.length;
  const next = (idx + 1) % foci.length;
  const local = (u % periodSec) / periodSec;
  const blend = smoothstep(0.7, 1, local);
  const a = foci[idx]!;
  const b = foci[next]!;
  return [
    a[0] + (b[0] - a[0]) * blend,
    a[1] + (b[1] - a[1]) * blend,
    a[2] + (b[2] - a[2]) * blend,
  ];
}

/** Gentle sway + dolly in front of the exhibition wall. */
export function landingCameraPosition(
  elapsed: number,
  mobile: boolean,
): [number, number, number] {
  const sway = Math.sin(elapsed * 0.085) * (mobile ? 1.25 : 1.75);
  const dolly = Math.sin(elapsed * 0.052) * (mobile ? 0.4 : 0.62);
  const bob = Math.sin(elapsed * 0.2) * 0.016;
  return [
    sway,
    (mobile ? 1.48 : 1.54) + bob,
    (mobile ? 1.65 : 1.2) + dolly,
  ];
}
