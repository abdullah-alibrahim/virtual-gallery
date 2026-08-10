import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { CreateGalleryForm } from "@/features/galleries/components/create-gallery-form";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { loadWorkspaceUsage } from "@/infrastructure/workspaces/load-workspace-usage";
import { getTranslator } from "@/i18n/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "New gallery",
};

export default async function NewGalleryPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-in?force=1");
  if (ctx.account && !ctx.account.onboarding.completed) redirect("/onboarding");

  const { t } = await getTranslator();

  const usage = ctx.account
    ? await loadWorkspaceUsage(ctx.account.defaultWorkspaceId)
    : null;
  const used = usage?.usage.galleries ?? 0;
  const limit = usage?.limits.galleries ?? 3;
  const plan = usage?.plan ?? "free";
  const atCap = used >= limit;

  if (atCap) {
    return (
      <AppPage narrow>
        <PageHeader
          title={t("billing.atLimit")}
          description={t("billing.atLimitBody", { plan, limit, used })}
        />
        <Alert tone="warning" title={t("galleries.upgradeOrFreeSlot")}>
          <p>{t("galleries.planLimit")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/galleries"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              {t("galleries.backToGalleries")}
            </Link>
            <Link href="/settings/billing" className={cn(buttonVariants())}>
              {t("galleries.viewPlans")}
            </Link>
          </div>
        </Alert>
      </AppPage>
    );
  }

  return (
    <AppPage narrow>
      <CreateGalleryForm remaining={limit - used} limit={limit} plan={plan} />
    </AppPage>
  );
}
