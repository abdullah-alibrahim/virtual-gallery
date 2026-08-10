import Link from "next/link";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/shared/app-page";
import { AuthHydrator } from "@/features/auth/components/auth-hydrator";
import { AdminChromeActions } from "@/features/admin/components/admin-chrome-actions";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { SignOutButton } from "@/features/auth";
import { siteConfig } from "@/config/site";
import { getTranslator } from "@/i18n/server";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { isPlatformAdmin } from "@/infrastructure/firebase/platform-admin";

/**
 * Admin-only shell — platform modules only (no studio sidebar / dashboard chrome).
 */
export default async function AdminShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-in?force=1&next=/admin");
  if (!isPlatformAdmin(ctx.session)) redirect("/dashboard");

  const { t } = await getTranslator();
  const email = ctx.account?.email || ctx.session.email || "";

  return (
    <AuthHydrator>
      <div className="relative min-h-dvh bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,oklch(0.93_0.02_90_/0.7),transparent)]" />
          <div className="absolute inset-0 surface-grain opacity-40" />
        </div>

        <header className="border-b border-border">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
            <Link
              href="/admin"
              className="truncate font-serif text-xl tracking-tight"
            >
              {siteConfig.name}
              <span className="ml-2 text-sm font-sans text-muted-foreground">
                {t("admin.label")}
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden max-w-[14rem] truncate text-sm text-muted-foreground sm:inline">
                {email}
              </span>
              <AdminChromeActions />
              <SignOutButton />
            </div>
          </div>
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
            <AdminNav />
          </div>
        </header>

        <AppPage>{children}</AppPage>
      </div>
    </AuthHydrator>
  );
}
