import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { DomainPanel } from "@/features/settings/components/domain-panel";
import { siteConfig } from "@/config/site";
import { cnameTargetFromSiteUrl } from "@/core/services/custom-hostname";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { loadCustomHostname } from "@/infrastructure/domains/custom-hostname";
import { loadWorkspaceUsage } from "@/infrastructure/workspaces/load-workspace-usage";
import { getTranslator } from "@/i18n/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Domain" };

export default async function DomainSettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.account) redirect("/sign-in?force=1");
  if (!ctx.account.onboarding.completed) redirect("/onboarding");

  const [{ t }, usage, current] = await Promise.all([
    getTranslator(),
    loadWorkspaceUsage(ctx.account.defaultWorkspaceId),
    loadCustomHostname(ctx.account.defaultWorkspaceId),
  ]);

  const allowed = Boolean(usage?.limits.customDomain);
  const cnameTarget = cnameTargetFromSiteUrl(siteConfig.url);

  return (
    <AppPage>
      <PageHeader
        title={t("domain.title")}
        description={t("domain.body")}
      />
      <div className="stagger-fade stagger-fade-1">
        {allowed ? (
          <DomainPanel current={current} cnameTarget={cnameTarget} />
        ) : (
          <Alert tone="warning" title={t("domain.studioOnly")}>
            <p>{t("domain.studioOnlyBody")}</p>
            <Link
              href="/settings/billing"
              className={cn(buttonVariants({ className: "mt-4" }))}
            >
              {t("billing.upgradeToStudio")}
            </Link>
          </Alert>
        )}
      </div>
    </AppPage>
  );
}
