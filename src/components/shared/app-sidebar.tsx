"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAV } from "@/components/shared/app-nav";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

export function AppSidebar({
  studioName,
  showAdmin = false,
}: {
  studioName: string;
  showAdmin?: boolean;
}) {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const t = useT();

  return (
    <aside
      className={cn(
        "hidden h-dvh shrink-0 flex-col border-e border-border bg-card/80 md:flex",
        collapsed ? "w-[72px]" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-5",
          collapsed && "justify-center px-2",
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "truncate font-serif text-xl tracking-tight",
            collapsed && "text-sm",
          )}
          title={studioName}
        >
          {collapsed ? "VG" : studioName}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {APP_NAV.map(({ href, labelKey, icon: Icon }) => {
          const label = t(labelKey);
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "border border-border bg-accent text-accent-foreground"
                  : "border border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!collapsed ? <span>{label}</span> : null}
            </Link>
          );
        })}
        {showAdmin ? (
          <Link
            href="/admin"
            title={t("common.admin")}
            className={cn(
              "mt-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
              pathname.startsWith("/admin")
                ? "border border-border bg-accent text-accent-foreground"
                : "border border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
          >
            {!collapsed ? <span>{t("common.admin")}</span> : <span>A</span>}
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}
