import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { BillingPanel } from "@/features/billing/components/billing-panel";
import { PLAN_LIMITS } from "@/core/services/plan-limits";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { isBillingMockEnabled } from "@/infrastructure/billing/mock-upgrade";
import {
  isStripeConfigured,
  isYearlyStripeConfigured,
} from "@/infrastructure/billing/stripe";
import { loadWorkspaceUsage } from "@/infrastructure/workspaces/load-workspace-usage";
import { getTranslator } from "@/i18n/server";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingSettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.account) redirect("/sign-in?force=1");
  if (!ctx.account.onboarding.completed) redirect("/onboarding");

  const { t } = await getTranslator();
  const usage = await loadWorkspaceUsage(ctx.account.defaultWorkspaceId);
  const plan = usage?.plan ?? "free";
  const fallback = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  return (
    <AppPage>
      <PageHeader
        title={t("settings.billingTitle")}
        description={t("settings.billingBody")}
      />
      <div className="stagger-fade stagger-fade-1">
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">
              {t("billing.loading")}
            </p>
          }
        >
          <BillingPanel
            plan={plan}
            stripeConfigured={isStripeConfigured()}
            mockBilling={isBillingMockEnabled()}
            trialActive={usage?.trialActive ?? false}
            trialDaysLeft={usage?.trialDaysLeft ?? 0}
            yearlyStripeConfigured={isYearlyStripeConfigured()}
            usage={{
              galleries: usage?.usage.galleries ?? 0,
              artworks: usage?.usage.artworks ?? 0,
              storageBytes: usage?.usage.storageBytes ?? 0,
            }}
            limits={{
              galleries: usage?.limits.galleries ?? fallback.galleries,
              artworksPerGallery:
                usage?.limits.artworksPerGallery ?? fallback.artworksPerGallery,
              storageBytes: usage?.limits.storageBytes ?? fallback.storageBytes,
              seats: usage?.limits.seats ?? fallback.seats,
            }}
          />
        </Suspense>
      </div>
    </AppPage>
  );
}
