"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/** Desktop-only editor — phones get a clear handoff, not a broken five-panel. */
export function MobileHandoff({ galleryTitle }: { galleryTitle: string }) {
  const t = useT();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="font-mono text-sm text-muted-foreground">
        {t("editor.desktopRequired")}
      </p>
      <h1 className="font-serif text-3xl tracking-tight">{galleryTitle}</h1>
      <p className="text-sm text-muted-foreground">{t("editor.desktopBody")}</p>
      <Link href="/dashboard" className={cn(buttonVariants())}>
        {t("editor.backToDashboard")}
      </Link>
    </main>
  );
}
