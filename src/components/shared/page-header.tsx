import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Standard page heading for every authenticated route. The `actions` slot keeps
 * primary buttons in a consistent position so the eye does not have to hunt.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-5 sm:pb-8",
        "page-enter",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div
          aria-hidden
          className="rule-grow h-px w-12 bg-foreground/25"
        />
        <h1 className="font-serif text-3xl leading-[1.1] tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto stagger-fade stagger-fade-1">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
