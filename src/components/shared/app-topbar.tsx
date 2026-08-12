"use client";

import { Menu, PanelLeft, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { APP_NAV } from "@/components/shared/app-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

export function AppTopbar({
  displayName,
  email,
  actions,
}: {
  displayName: string;
  email: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const t = useT();
  /** Open only while path matches — navigations close the drawer without an effect. */
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const mobileOpen = openForPath === pathname;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenForPath(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-border bg-background/85 px-3 backdrop-blur sm:gap-4 sm:px-5 pt-[env(safe-area-inset-top)]">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileOpen}
            onClick={() =>
              setOpenForPath((current) =>
                current === pathname ? null : pathname,
              )
            }
          >
            {mobileOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            aria-label={t("nav.openMenu")}
            onClick={toggleSidebar}
          >
            <PanelLeft aria-hidden />
          </Button>
          <div className="min-w-0 md:hidden">
            <p className="truncate font-serif text-base tracking-tight">
              {displayName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden min-w-0 max-w-[12rem] text-end lg:max-w-[16rem] sm:block">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <LanguageSwitcher />
          <ThemeToggle />
          {actions}
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("nav.closeMenu")}
            onClick={() => setOpenForPath(null)}
          />
          <nav
            className={cn(
              "absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col border-e border-border bg-background",
              "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
              "page-enter",
            )}
            aria-label={t("common.studio")}
          >
            <div className="flex h-16 items-center border-b border-border px-4">
              <p className="truncate font-serif text-xl tracking-tight">
                {displayName}
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
              {APP_NAV.map(({ href, labelKey, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span>{t(labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
