"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Client-presentation frame for room mockups — quiet chrome, serif title.
 * Full main-column width so the stage can breathe on large screens.
 */
export function MockupShell({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const t = useT();
  const resolvedBackLabel = backLabel ?? t("mockups.backToArtwork");

  return (
    <div
      className={cn(
        "min-h-dvh w-full bg-[color:var(--luxury-stone)] text-foreground",
        className,
      )}
    >
      <header className="sticky top-0 z-20 border-b border-border/80 bg-[color:var(--luxury-stone)]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <div className="min-w-0">
            <Link
              href={backHref}
              className="inline-flex min-h-10 items-center gap-1.5 text-xs tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
              {resolvedBackLabel}
            </Link>
            <p className="mt-1 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              {t("mockups.clientPresentation")}
            </p>
            <h1 className="mt-0.5 font-serif text-2xl tracking-tight sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="-mx-1 flex shrink-0 items-center gap-2 overflow-x-auto px-1 pb-0.5 sm:overflow-visible sm:pb-0">
            <LanguageSwitcher size="sm" />
            {actions ? actions : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8">
        <div className="mockup-fade-in w-full">{children}</div>
      </main>
    </div>
  );
}
