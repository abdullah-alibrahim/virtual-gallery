import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="relative mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-6 px-6 text-center page-enter">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 app-atmosphere opacity-90"
      />
      <p className="font-mono text-sm tracking-wide text-muted-foreground">
        404
      </p>
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          Nothing hanging here
        </h1>
        <p className="text-base text-muted-foreground text-pretty">
          This gallery may have been unpublished, or the link is wrong.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/" className={cn(buttonVariants())}>
          Go home
        </Link>
        <Link
          href="/demo/pro"
          className={cn(buttonVariants({ variant: "secondary" }))}
        >
          Try the Pro hall
        </Link>
        <Link
          href="/templates"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Browse rooms
        </Link>
      </div>
    </main>
  );
}
