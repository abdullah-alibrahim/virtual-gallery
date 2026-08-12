/**
 * Per-gallery visitor prefs for night mode and place sound (localStorage).
 */

export type VisitorSoundMode = "on" | "muted";

function nightKey(galleryId: string): string {
  return `vg.nightMode.${galleryId}`;
}

function soundKey(galleryId: string): string {
  return `vg.placeSound.${galleryId}`;
}

export function readNightModePreference(galleryId: string): boolean | null {
  try {
    const raw = window.localStorage.getItem(nightKey(galleryId));
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    /* private mode */
  }
  return null;
}

export function writeNightModePreference(
  galleryId: string,
  enabled: boolean,
): void {
  try {
    window.localStorage.setItem(nightKey(galleryId), enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function readPlaceSoundPreference(
  galleryId: string,
): VisitorSoundMode | null {
  try {
    const raw = window.localStorage.getItem(soundKey(galleryId));
    if (raw === "0" || raw === "muted") return "muted";
    if (raw === "1" || raw === "on") return "on";
  } catch {
    /* ignore */
  }
  return null;
}

export function writePlaceSoundPreference(
  galleryId: string,
  mode: VisitorSoundMode,
): void {
  try {
    window.localStorage.setItem(
      soundKey(galleryId),
      mode === "muted" ? "muted" : "on",
    );
  } catch {
    /* ignore */
  }
}
