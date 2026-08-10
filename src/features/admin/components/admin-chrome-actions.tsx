"use client";

import { LanguageSwitcher } from "@/i18n/language-switcher";

/** Header actions for the admin shell — language toggle beside sign-out. */
export function AdminChromeActions() {
  return <LanguageSwitcher size="sm" />;
}
