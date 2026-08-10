import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { OnboardingRoomPanel } from "@/features/marketing/components/onboarding-room-panel";
import { siteConfig } from "@/config/site";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export const metadata: Metadata = {
  title: "Welcome",
};

/**
 * Onboarding sits outside the app shell — artists shouldn't see a sidebar
 * before they've finished naming their studio.
 */
export default async function OnboardingPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-in?force=1");
  if (ctx.account?.onboarding.completed) redirect("/dashboard");

  const workspaceId = ctx.account?.defaultWorkspaceId;
  if (!workspaceId) redirect("/sign-in?force=1");

  const profile = await getAdminDb()
    .collection("artistProfiles")
    .doc(workspaceId)
    .get();

  const initialName = ctx.account?.displayName || ctx.session.name || "Artist";
  const initialSlug = String(profile.data()?.slug ?? "artist");

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="atmosphere-drift absolute -inset-[8%] bg-[radial-gradient(ellipse_70%_50%_at_80%_0%,oklch(0.94_0.02_90),transparent),radial-gradient(ellipse_40%_35%_at_10%_90%,oklch(0.92_0.02_210_/0.14),transparent)]" />
        <div className="absolute inset-0 surface-grain opacity-50" />
      </div>
      <OnboardingRoomPanel />
      <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <Link href="/" className="font-serif text-xl tracking-tight sm:text-2xl">
          {siteConfig.name}
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-16 sm:px-8 lg:justify-start lg:pl-16 xl:pl-24">
        <OnboardingForm initialName={initialName} initialSlug={initialSlug} />
      </main>
    </div>
  );
}
