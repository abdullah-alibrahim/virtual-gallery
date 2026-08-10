"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useT } from "@/i18n";
import type { MessageKey } from "@/i18n/translate";
import { cn } from "@/lib/utils";

const ADMIN_NAV: {
  href: string;
  labelKey: MessageKey;
  exact?: boolean;
}[] = [
  { href: "/admin", labelKey: "admin.overview", exact: true },
  { href: "/admin/users", labelKey: "admin.users" },
  { href: "/admin/workspaces", labelKey: "admin.workspaces" },
  { href: "/admin/galleries", labelKey: "admin.galleries" },
  { href: "/admin/templates", labelKey: "admin.templates" },
];

/** Admin-only module navigation — no studio chrome. */
export function AdminNav() {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-border pb-0"
      aria-label={t("admin.modules")}
    >
      {ADMIN_NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "border-b-2 px-3 py-2.5 text-sm transition-colors",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
    </nav>
  );
}
