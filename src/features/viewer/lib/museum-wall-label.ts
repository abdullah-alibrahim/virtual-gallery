/**
 * Museum didactic wall-label lines: title + "year · medium".
 * Pure helpers so UI and 3D plates stay in sync.
 */

export function hasArabicScript(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value);
}

/** Soft letter-spacing for Latin museum labels; Arabic stays tight. */
export function museumLetterSpacing(
  value: string,
  latin = 0.04,
): number {
  return hasArabicScript(value) ? 0 : latin;
}

export function formatMuseumWallMeta(
  year?: number | null,
  medium?: string | null,
): string {
  const parts: string[] = [];
  if (year != null && Number.isFinite(year)) parts.push(String(year));
  const m = medium?.trim();
  if (m) parts.push(m);
  return parts.join(" · ");
}

export function museumWallLabelText(
  title: string,
  year?: number | null,
  medium?: string | null,
): { title: string; meta: string } {
  return {
    title: title.trim(),
    meta: formatMuseumWallMeta(year, medium),
  };
}
