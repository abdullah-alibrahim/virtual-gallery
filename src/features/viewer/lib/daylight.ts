/**
 * Visitor daylight periods for walkable halls — museum morning → noon →
 * evening → night. Pure helpers (no React / Three).
 */

export type DaylightPeriod = "morning" | "noon" | "evening" | "night";

export const DAYLIGHT_PERIODS: readonly DaylightPeriod[] = [
  "morning",
  "noon",
  "evening",
  "night",
] as const;

export function isDaylightPeriod(value: unknown): value is DaylightPeriod {
  return (
    value === "morning" ||
    value === "noon" ||
    value === "evening" ||
    value === "night"
  );
}

export function nextDaylightPeriod(current: DaylightPeriod): DaylightPeriod {
  const index = DAYLIGHT_PERIODS.indexOf(current);
  return DAYLIGHT_PERIODS[(index + 1) % DAYLIGHT_PERIODS.length]!;
}

/** Night-like periods drive quieter ambience / place-sound night bed. */
export function isNightLikePeriod(period: DaylightPeriod): boolean {
  return period === "evening" || period === "night";
}

export interface DaylightLook {
  readonly keyColor: string;
  readonly fillColor: string;
  readonly ambientColor: string;
  readonly hemiSky: string;
  readonly hemiGround: string;
  readonly rimColor: string;
  readonly washColor: string;
  /** Multipliers on template base intensities. */
  readonly keyScale: number;
  readonly fillScale: number;
  readonly ambientScale: number;
  readonly hemiScale: number;
  readonly rimScale: number;
  readonly washScale: number;
  /** Offset added to template key position (metres). */
  readonly keyOffset: readonly [number, number, number];
  readonly fillOffset: readonly [number, number, number];
  /** Scene clear / exposure relative to template day values. */
  readonly clearDarken: number;
  readonly exposureScale: number;
  /** Extra floor polish (clearcoat / env) for walk. */
  readonly floorPolish: number;
}

export function daylightLook(period: DaylightPeriod): DaylightLook {
  switch (period) {
    case "morning":
      return {
        keyColor: "#ffdcb0",
        fillColor: "#eef3f8",
        ambientColor: "#f4f0ea",
        hemiSky: "#f0e6d8",
        hemiGround: "#c8b8a4",
        rimColor: "#fff6ea",
        washColor: "#fff1de",
        keyScale: 1.12,
        fillScale: 0.88,
        ambientScale: 0.92,
        hemiScale: 0.95,
        rimScale: 0.85,
        washScale: 1.05,
        keyOffset: [-1.2, -0.4, -0.6],
        fillOffset: [0.2, 0.4, 0.1],
        clearDarken: 0,
        exposureScale: 1.04,
        floorPolish: 1.08,
      };
    case "noon":
      return {
        keyColor: "#fff4e4",
        fillColor: "#f2f6fa",
        ambientColor: "#f6f7f8",
        hemiSky: "#eef3f8",
        hemiGround: "#c4c8cc",
        rimColor: "#ffffff",
        washColor: "#fff8f0",
        keyScale: 1.0,
        fillScale: 1.05,
        ambientScale: 1.02,
        hemiScale: 1.0,
        rimScale: 0.9,
        washScale: 1.12,
        keyOffset: [8, 5.5, 2.5],
        fillOffset: [-0.5, 1.2, 0],
        clearDarken: 0,
        exposureScale: 1.08,
        floorPolish: 1.15,
      };
    case "evening":
      return {
        keyColor: "#ffb06a",
        fillColor: "#7a8498",
        ambientColor: "#2a221c",
        hemiSky: "#5a4a58",
        hemiGround: "#1a1410",
        rimColor: "#c4a882",
        washColor: "#ffb56e",
        keyScale: 0.95,
        fillScale: 0.58,
        ambientScale: 0.48,
        hemiScale: 0.55,
        rimScale: 0.72,
        washScale: 0.9,
        keyOffset: [-2.5, -3.2, -1.5],
        fillOffset: [0.8, -0.6, 0.4],
        clearDarken: 0.35,
        exposureScale: 0.86,
        floorPolish: 0.92,
      };
    case "night":
      return {
        keyColor: "#ffc98a",
        fillColor: "#6a7a92",
        ambientColor: "#1a1520",
        hemiSky: "#3a3348",
        hemiGround: "#0e0c0a",
        rimColor: "#c4a882",
        washColor: "#ffb56e",
        keyScale: 0.82,
        fillScale: 0.5,
        ambientScale: 0.38,
        hemiScale: 0.45,
        rimScale: 0.65,
        washScale: 0.78,
        keyOffset: [-3.5, -4.2, -2],
        fillOffset: [1.2, -1, 0.6],
        clearDarken: 0.55,
        exposureScale: 0.76,
        floorPolish: 0.82,
      };
  }
}

function daylightKey(galleryId: string): string {
  return `vg.daylight.${galleryId}`;
}

export function readDaylightPreference(
  galleryId: string,
): DaylightPeriod | null {
  try {
    const raw = window.localStorage.getItem(daylightKey(galleryId));
    if (isDaylightPeriod(raw)) return raw;
    // Migrate legacy night boolean.
    const legacy = window.localStorage.getItem(`vg.nightMode.${galleryId}`);
    if (legacy === "1") return "night";
    if (legacy === "0") return "morning";
  } catch {
    /* private mode */
  }
  return null;
}

export function writeDaylightPreference(
  galleryId: string,
  period: DaylightPeriod,
): void {
  try {
    window.localStorage.setItem(daylightKey(galleryId), period);
    window.localStorage.setItem(
      `vg.nightMode.${galleryId}`,
      isNightLikePeriod(period) ? "1" : "0",
    );
  } catch {
    /* ignore */
  }
}
