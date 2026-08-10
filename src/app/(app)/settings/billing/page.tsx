import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { BillingPanel } from "@/features/billing/components/billing-panel";
import type { PlanId } from "@/core/entities";
import { PLAN_LIMITS } from "@/core/services/plan-limits";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { isBillingMockEnabled } from "@/infrastructure/billing/mock-upgrade";
import { isStripeConfigured } from "@/infrastructure/billing/stripe";
import { getTranslator } from "@/i18n/server";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingSettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.account) redirect("/sign-in?force=1");
  if (!ctx.account.onboarding.completed) redirect("/onboarding");

  const { t } = await getTranslator();

  const workspace = await getAdminDb()
    .collection("workspaces")
    .doc(ctx.account.defaultWorkspaceId)
    .get();
  const data = workspace.data() ?? {};
  const plan = (data.plan ?? "free") as PlanId;
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
            usage={{
              galleries: Number(data.usage?.galleries ?? 0),
              artworks: Number(data.usage?.artworks ?? 0),
              storageBytes: Number(data.usage?.storageBytes ?? 0),
            }}
            limits={{
              galleries: Number(data.limits?.galleries ?? fallback.galleries),
              artworksPerGallery: Number(
                data.limits?.artworksPerGallery ?? fallback.artworksPerGallery,
              ),
              storageBytes: Number(
                data.limits?.storageBytes ?? fallback.storageBytes,
              ),
              seats: Number(data.limits?.seats ?? fallback.seats),
            }}
          />
        </Suspense>
      </div>
    </AppPage>
  );
}
