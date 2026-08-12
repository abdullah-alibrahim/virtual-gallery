import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { PlanUsageBanner } from "@/features/billing/components/plan-usage-banner";
import { FirstShowChecklist } from "@/features/galleries/components/first-show-checklist";
import { GalleryList } from "@/features/galleries/components/gallery-list";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { listWorkspaceGalleries } from "@/infrastructure/galleries/list-galleries";
import { loadWorkspaceUsage } from "@/infrastructure/workspaces/load-workspace-usage";
import { getTranslator } from "@/i18n/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-in?force=1");
  if (ctx.account && !ctx.account.onboarding.completed) {
    redirect("/onboarding");
  }
  if (!ctx.account) redirect("/sign-in?force=1");

  const workspaceId = ctx.account.defaultWorkspaceId;
  const [{ t }, galleries, usage] = await Promise.all([
    getTranslator(),
    listWorkspaceGalleries(workspaceId),
    loadWorkspaceUsage(workspaceId),
  ]);

  const galleriesUsed = usage?.usage.galleries ?? galleries.length;
  const galleriesLimit = usage?.limits.galleries ?? 3;
  const plan = usage?.plan ?? "free";
  const atCap = galleriesUsed >= galleriesLimit;

  return (
    <AppPage>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        actions={
          atCap ? (
            <Link
              href="/settings/billing"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              {t("common.upgradePlan")}
            </Link>
          ) : (
            <Link href="/galleries/new" className={cn(buttonVariants())}>
              <Plus aria-hidden className="size-4" />
              {t("dashboard.newGallery")}
            </Link>
          )
        }
      />
      <div className="flex flex-col gap-6 stagger-fade stagger-fade-1">
        <PlanUsageBanner
          plan={plan}
          galleriesUsed={galleriesUsed}
          galleriesLimit={galleriesLimit}
          trialDaysLeft={usage?.trialDaysLeft ?? 0}
        />
        <FirstShowChecklist galleries={galleries} />
        <GalleryList galleries={galleries} />
      </div>
    </AppPage>
  );
}
