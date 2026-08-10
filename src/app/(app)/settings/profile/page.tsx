import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileSettingsForm } from "@/features/profile/components/profile-settings-form";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { loadArtistProfileByWorkspace } from "@/infrastructure/profiles/load-profile";
import { getTranslator } from "@/i18n/server";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfileSettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.account) redirect("/sign-in?force=1");
  if (!ctx.account.onboarding.completed) redirect("/onboarding");

  const { t } = await getTranslator();

  const profile = await loadArtistProfileByWorkspace(
    ctx.account.defaultWorkspaceId,
  );
  if (!profile) redirect("/onboarding");

  return (
    <AppPage>
      <PageHeader
        title={t("settings.profileTitle")}
        description={t("settings.profileBody")}
      />
      <div className="stagger-fade stagger-fade-1">
        <ProfileSettingsForm profile={profile} />
      </div>
    </AppPage>
  );
}
