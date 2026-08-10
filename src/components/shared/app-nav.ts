import {
  BarChart3,
  CreditCard,
  FolderOpen,
  Images,
  Inbox,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { MessageKey } from "@/i18n/translate";

export type AppNavItem = {
  readonly href: string;
  /** Message key under `nav.*` */
  readonly labelKey: MessageKey;
  readonly icon: LucideIcon;
};

/** Shared studio nav — sidebar + mobile drawer stay in sync. */
export const APP_NAV: readonly AppNavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/galleries", labelKey: "nav.galleries", icon: FolderOpen },
  { href: "/assets", labelKey: "nav.assets", icon: Images },
  { href: "/inbox", labelKey: "nav.inbox", icon: Inbox },
  { href: "/analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { href: "/settings/billing", labelKey: "nav.billing", icon: CreditCard },
  { href: "/settings/team", labelKey: "nav.team", icon: Users },
  { href: "/settings/profile", labelKey: "nav.profile", icon: Settings },
] as const;
