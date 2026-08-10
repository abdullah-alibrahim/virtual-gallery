export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie + localStorage key for UI language preference. */
export const LOCALE_COOKIE = "vg_locale";

export const LOCALE_STORAGE_KEY = "vg.locale";

/** Cookie max-age: 1 year. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ar";
}

export function localeDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function parseLocaleParam(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "ar" || normalized === "arabic" || normalized === "عربي") {
    return "ar";
  }
  if (normalized === "en" || normalized === "english") {
    return "en";
  }
  return null;
}
