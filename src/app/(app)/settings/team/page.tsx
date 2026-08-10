import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { TeamSettingsPanel } from "@/features/workspaces/components/team-settings-panel";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { loadWorkspaceUsage } from "@/infrastructure/workspaces/load-workspace-usage";
import { listWorkspaceMembers } from "@/infrastructure/workspaces/team";
import { getTranslator } from "@/i18n/server";

export const metadata: Metadata = { title: "Team" };

export default async function TeamSettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.account) redirect("/sign-in?force=1");
  if (!ctx.account.onboarding.completed) redirect("/onboarding");

  const { t } = await getTranslator();

  const workspaceId = ctx.account.defaultWorkspaceId;
  const [usage, members] = await Promise.all([
    loadWorkspaceUsage(workspaceId),
    listWorkspaceMembers(workspaceId, ctx.session.uid),
  ]);

  const self = members.find((m) => m.uid === ctx.session.uid);
  const canManage = self?.role === "owner" || self?.role === "admin";
  const seatsLimit = usage?.limits.seats ?? 1;

  return (
    <AppPage>
      <PageHeader
        title={t("settings.teamTitle")}
        description={t("settings.teamBody")}
      />
      <div className="stagger-fade stagger-fade-1">
        <TeamSettingsPanel
          seatsLimit={seatsLimit}
          canManage={Boolean(canManage)}
        />
      </div>
    </AppPage>
  );
}
