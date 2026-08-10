"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { getDictionary, type Messages } from "@/i18n/get-dictionary";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_STORAGE_KEY,
  localeDirection,
  type Locale,
} from "@/i18n/locales";
import { createTranslator, type Translator } from "@/i18n/translate";

type LocaleContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  messages: Messages;
  t: Translator;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function applyDocumentLocale(locale: Locale) {
  const root = document.documentElement;
  root.lang = locale;
  root.dir = localeDirection(locale);
  root.dataset.locale = locale;
}

export function LocaleProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(
    isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE,
  );

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  /** Honor ?lang= on the client if middleware missed it (hash-only navigations). */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("lang");
      if (raw && isLocale(raw) && raw !== locale) {
        persistLocale(raw);
        setLocaleState(raw);
        params.delete("lang");
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
        window.history.replaceState(null, "", next);
        router.refresh();
      }
    } catch {
      /* ignore */
    }
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional once
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocale(next) || next === locale) return;
      persistLocale(next);
      applyDocumentLocale(next);
      setLocaleState(next);
      router.refresh();
    },
    [locale, router],
  );

  const value = useMemo<LocaleContextValue>(() => {
    const messages = getDictionary(locale);
    return {
      locale,
      dir: localeDirection(locale),
      messages,
      t: createTranslator(messages),
      setLocale,
    };
  }, [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleContext must be used within LocaleProvider");
  }
  return ctx;
}

export function useLocale(): Locale {
  return useLocaleContext().locale;
}

export function useT(): Translator {
  return useLocaleContext().t;
}
