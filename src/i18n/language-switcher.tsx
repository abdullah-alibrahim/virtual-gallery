"use client";

import { cn } from "@/lib/utils";
import { useLocaleContext } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/locales";

/**
 * Compact EN | ع language toggle for marketing nav, app chrome, and walk HUD.
 */
export function LanguageSwitcher({
  className,
  size = "sm",
  variant = "default",
}: {
  className?: string;
  size?: "sm" | "xs";
  /** `ghost` for dark viewer chrome. */
  variant?: "default" | "ghost" | "editor";
}) {
  const { locale, setLocale, t } = useLocaleContext();

  const options: { id: Locale; label: string }[] = [
    { id: "en", label: "EN" },
    { id: "ar", label: "ع" },
  ];

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={cn(
        "inline-flex items-center border",
        size === "xs" ? "text-[10px]" : "text-xs",
        variant === "ghost" &&
          "border-white/15 bg-black/30 text-white/70 backdrop-blur-sm",
        variant === "editor" &&
          "border-[color:var(--editor-border)] text-[color:var(--editor-muted)]",
        variant === "default" && "border-border text-muted-foreground",
        className,
      )}
    >
      {options.map(({ id, label }) => {
        const active = locale === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            aria-label={id === "ar" ? t("common.arabic") : t("common.english")}
            onClick={() => setLocale(id)}
            className={cn(
              "px-2 transition-colors",
              size === "xs" ? "py-0.5" : "py-1",
              active
                ? variant === "ghost"
                  ? "bg-white/15 text-white"
                  : variant === "editor"
                    ? "bg-white/12 text-[color:var(--editor-foreground)]"
                    : "bg-accent text-accent-foreground"
                : variant === "ghost"
                  ? "hover:bg-white/10 hover:text-white"
                  : variant === "editor"
                    ? "hover:text-[color:var(--editor-foreground)]"
                    : "hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
