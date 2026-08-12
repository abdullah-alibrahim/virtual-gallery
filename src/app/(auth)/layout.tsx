import Link from "next/link";

import { BrandLockup } from "@/components/shared/house-mark";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { getTranslator } from "@/i18n/server";

/**
 * Bare auth chrome — no WebGL, room panels, or heavy marketing imports.
 * Prior AuthRoomPanel / R3F side panels could fail before the form painted.
 */
export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { t } = await getTranslator();

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-[color:var(--luxury-stone)] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_8%_0%,oklch(0.92_0.025_78_/0.45),transparent),radial-gradient(ellipse_40%_35%_at_96%_90%,oklch(0.9_0.02_55_/0.18),transparent)]"
      />
      <div
        aria-hidden
        className="surface-grain pointer-events-none absolute inset-0 opacity-45"
      />

      <header className="relative z-10 flex w-full items-center justify-between border-b border-border/70 px-4 py-4 sm:px-6">
        <BrandLockup nameClassName="text-xl" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("common.back")}
          </Link>
        </div>
      </header>
      <main className="relative z-10 flex w-full flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="page-enter w-full max-w-md border border-border/90 bg-background/85 p-6 shadow-none backdrop-blur-sm sm:p-8">
          <div
            aria-hidden
            className="mb-6 h-px w-10 bg-[color:var(--luxury-brass)]/55"
          />
          {children}
        </div>
      </main>
    </div>
  );
}
