import { cookies, headers } from "next/headers";

import { getDictionary } from "./get-dictionary";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  parseLocaleParam,
  type Locale,
} from "./locales";
import { createTranslator, type Translator } from "./translate";

/**
 * Resolve UI locale for Server Components.
 * Priority: `x-vg-locale` (set by middleware from ?lang=) → cookie → default.
 */
export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromHeader = headerStore.get("x-vg-locale");
  if (isLocale(fromHeader)) return fromHeader;

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accept = headerStore.get("accept-language");
  if (accept) {
    const preferred = accept.split(",")[0]?.trim().slice(0, 2).toLowerCase();
    if (preferred === "ar") return "ar";
  }

  return DEFAULT_LOCALE;
}

export async function getTranslator(): Promise<{
  locale: Locale;
  t: Translator;
  messages: ReturnType<typeof getDictionary>;
}> {
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);
  return { locale, t: createTranslator(messages), messages };
}

/** Helper for middleware / edge — parse ?lang= without Next cookies API. */
export function localeFromSearchParam(raw: string | null): Locale | null {
  return parseLocaleParam(raw);
}
