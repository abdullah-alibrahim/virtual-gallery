import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { GalleryLimitBanner } from "@/features/galleries/components/gallery-limit-banner";
import { GalleryList } from "@/features/galleries/components/gallery-list";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { listWorkspaceGalleries } from "@/infrastructure/galleries/list-galleries";
import { loadWorkspaceUsage } from "@/infrastructure/workspaces/load-workspace-usage";
import { getTranslator } from "@/i18n/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Galleries" };

export default async function GalleriesPage() {
  const ctx = await getAuthContext();
  if (!ctx?.account) redirect("/sign-in?force=1");
  if (!ctx.account.onboarding.completed) redirect("/onboarding");

  const workspaceId = ctx.account.defaultWorkspaceId;
  const [{ t }, galleries, usage] = await Promise.all([
    getTranslator(),
    listWorkspaceGalleries(workspaceId),
    loadWorkspaceUsage(workspaceId),
  ]);

  const used = usage?.usage.galleries ?? galleries.length;
  const limit = usage?.limits.galleries ?? 3;
  const plan = usage?.plan ?? "free";
  const atCap = used >= limit;

  return (
    <AppPage>
      <PageHeader
        title={t("galleries.title")}
        description={t("galleries.description")}
        actions={
          atCap ? null : (
            <Link href="/galleries/new" className={cn(buttonVariants())}>
              <Plus className="size-4" aria-hidden />
              {t("dashboard.newGallery")}
            </Link>
          )
        }
      />
      <div className="flex flex-col gap-6 stagger-fade stagger-fade-1">
        <GalleryLimitBanner
          used={used}
          limit={limit}
          plan={plan}
          trialDaysLeft={usage?.trialDaysLeft ?? 0}
        />
        <GalleryList galleries={galleries} atCap={atCap} />
      </div>
    </AppPage>
  );
}
