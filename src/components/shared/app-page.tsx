import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Spacious content frame for authenticated studio routes.
 * Default fills the main column (sidebar + topbar shell); use `narrow` for
 * focused forms so they keep a readable measure.
 */
export function AppPage({
  children,
  className,
  narrow = false,
}: {
  children: ReactNode;
  className?: string;
  /** Narrow column for focused forms (create gallery, etc.) */
  narrow?: boolean;
}) {
  return (
    <main
      className={cn(
        "relative flex w-full min-w-0 flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10 lg:px-8 lg:py-12",
        narrow ? "mx-auto max-w-3xl" : "max-w-none",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-4 h-48 app-atmosphere opacity-80"
      />
      <div className="relative flex w-full min-w-0 flex-col gap-8 sm:gap-10">
        {children}
      </div>
    </main>
  );
}
