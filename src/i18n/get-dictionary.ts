import type { Locale } from "./locales";
import ar from "./messages/ar.json";
import en from "./messages/en.json";

export type Messages = typeof en;

export const dictionaries: Record<Locale, Messages> = {
  en,
  ar: ar as Messages,
};

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries.en;
}
