"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { reportClientError } from "@/lib/errors/report";
import { cn } from "@/lib/utils";

/**
 * Route-level error boundary. Next.js remounts this in place of the segment,
 * so the surrounding shell stays interactive.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { boundary: "route" });
  }, [error]);

  return (
    <main className="relative mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-6 px-6 text-center page-enter">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 app-atmosphere opacity-90"
      />
      <div
        aria-hidden
        className="rule-grow mx-auto h-px w-12 bg-foreground/25"
      />
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          That didn&apos;t load
        </h1>
        <p className="text-base text-muted-foreground text-pretty">
          Something broke on our side. Your work is saved — nothing was lost.
        </p>
        {error.digest ? (
          <p className="mt-1 font-mono text-xs text-muted-foreground/70">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={reset}>
          <RotateCcw aria-hidden />
          Try again
        </Button>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "secondary" }))}
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
