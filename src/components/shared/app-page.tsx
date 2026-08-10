import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Spacious content frame for authenticated studio routes.
 * Keeps header → body rhythm consistent without cramping chrome.
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
        "relative mx-auto flex w-full flex-col gap-10 px-6 py-10 sm:px-8 sm:py-12 lg:py-14",
        narrow ? "max-w-3xl" : "max-w-6xl",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-4 h-48 app-atmosphere opacity-80"
      />
      <div className="relative flex flex-col gap-10">{children}</div>
    </main>
  );
}
