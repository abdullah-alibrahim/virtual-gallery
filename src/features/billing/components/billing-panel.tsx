"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { planDefinition, type BillingInterval } from "@/core/billing/plans";
import type { PlanId } from "@/core/entities";
import { useT } from "@/i18n";
import { formatStorageBytes } from "@/lib/format";

function UsageMeter({
  label,
  used,
  max,
  formatValue = String,
}: {
  label: string;
  used: number;
  max: number;
  formatValue?: (n: number) => string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const near = pct >= 80;
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={near ? "text-foreground" : "text-muted-foreground"}>
          {formatValue(used)} / {formatValue(max)}
        </span>
      </div>
      <div className="h-1.5 w-full bg-border">
        <div
          className="h-full bg-foreground/70 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BillingPanel({
  plan,
  stripeConfigured,
  mockBilling,
  usage,
  limits,
  trialActive = false,
  trialDaysLeft = 0,
  yearlyStripeConfigured = false,
}: {
  plan: PlanId;
  stripeConfigured: boolean;
  mockBilling: boolean;
  usage: {
    galleries: number;
    artworks: number;
    storageBytes: number;
  };
  limits: {
    galleries: number;
    artworksPerGallery: number;
    storageBytes: number;
    seats: number;
  };
  trialActive?: boolean;
  trialDaysLeft?: number;
  yearlyStripeConfigured?: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const t = useT();
  const [busy, setBusy] = useState<"pro" | "studio" | "free" | "portal" | null>(
    null,
  );
  const [interval, setInterval] = useState<BillingInterval>("month");
  const checkout = search.get("checkout");
  const def = planDefinition(plan);
  const yearlyEnabled = mockBilling || yearlyStripeConfigured;

  useEffect(() => {
    if (checkout !== "success") return;
    const timer = window.setTimeout(() => {
      router.refresh();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [checkout, router]);

  async function upgradeStripe(next: "pro" | "studio") {
    setBusy(next);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: next, interval }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        url?: string;
      } | null;
      if (!response.ok || !body?.url) {
        throw new Error(body?.error ?? t("billing.checkoutFailed"));
      }
      window.location.href = body.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("billing.checkoutFailed"),
      );
      setBusy(null);
    }
  }

  async function upgradeMock(next: PlanId) {
    setBusy(next === "free" ? "free" : next);
    try {
      const response = await fetch("/api/billing/mock-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: next }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        plan?: string;
      } | null;
      if (!response.ok) {
        throw new Error(body?.error ?? t("billing.changePlanFailed"));
      }
      toast.success(
        next === "free"
          ? t("billing.mockDowngraded")
          : t("billing.mockUpgraded", { plan: planDefinition(next).label }),
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("billing.upgradeFailed"),
      );
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        url?: string;
      } | null;
      if (!response.ok || !body?.url) {
        throw new Error(body?.error ?? t("billing.portalFailed"));
      }
      window.location.href = body.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("billing.portalFailed"),
      );
      setBusy(null);
    }
  }

  const canStripe = stripeConfigured;
  const canMock = mockBilling && !stripeConfigured;
  const seatSuffix = limits.seats === 1 ? "" : "s";

  return (
    <div className="flex max-w-xl flex-col gap-6 page-enter">
      {checkout === "success" ? (
        <Alert tone="success" title={t("billing.checkoutComplete")}>
          {t("billing.checkoutCompleteBody")}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => {
              router.replace("/settings/billing");
              router.refresh();
            }}
          >
            {t("billing.refreshNow")}
          </button>
        </Alert>
      ) : null}

      {canMock ? (
        <Alert tone="warning" title={t("billing.mockBillingTitle")}>
          {t("billing.mockBillingBody")}
        </Alert>
      ) : null}

      {!stripeConfigured && !mockBilling ? (
        <Alert tone="warning" title={t("billing.notConfiguredTitle")}>
          {t("billing.notConfiguredBody")}
        </Alert>
      ) : null}

      <div className="border border-border px-5 py-5">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
          {t("billing.current")}
        </p>
        <p className="mt-1 font-serif text-3xl tracking-tight">
          {trialActive ? t("billing.trialLabel") : def.label}
        </p>
        {trialActive ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("billing.trialDaysLeft", { days: trialDaysLeft })}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">
          {t("billing.planSummary", {
            galleries: limits.galleries,
            worksPerGallery: limits.artworksPerGallery,
            storage: formatStorageBytes(limits.storageBytes),
            seats: limits.seats,
            seatSuffix,
          })}
        </p>
      </div>

      <div className="flex flex-col gap-4 border border-border px-5 py-5">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
          {t("billing.usage")}
        </p>
        <UsageMeter
          label={t("billing.galleriesLabel")}
          used={usage.galleries}
          max={limits.galleries}
        />
        <UsageMeter
          label={t("billing.storageLabel")}
          used={usage.storageBytes}
          max={limits.storageBytes}
          formatValue={formatStorageBytes}
        />
        <p className="text-sm text-muted-foreground">
          {t("billing.worksSummary", {
            used: usage.artworks,
            max: limits.artworksPerGallery,
          })}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {plan === "free" || trialActive ? (
          <div className="flex flex-col gap-2">
            <div
              className="inline-flex w-fit border border-border p-0.5"
              role="group"
              aria-label={t("billing.billingInterval")}
            >
              <button
                type="button"
                className={
                  interval === "month"
                    ? "bg-foreground px-3 py-1.5 text-xs text-background"
                    : "px-3 py-1.5 text-xs text-muted-foreground"
                }
                onClick={() => setInterval("month")}
              >
                {t("billing.payMonthly")}
              </button>
              <button
                type="button"
                disabled={!yearlyEnabled}
                className={
                  interval === "year"
                    ? "bg-foreground px-3 py-1.5 text-xs text-background"
                    : "px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-40"
                }
                onClick={() => yearlyEnabled && setInterval("year")}
              >
                {t("billing.payYearly")}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {interval === "year"
                ? t("billing.yearlyHint")
                : t("billing.monthlyHint")}
            </p>
          </div>
        ) : null}
      <div className="flex flex-wrap gap-2">
        {plan === "free" || trialActive ? (
          <>
            <Button
              type="button"
              disabled={(!canStripe && !canMock) || busy !== null}
              onClick={() =>
                void (canStripe ? upgradeStripe("pro") : upgradeMock("pro"))
              }
            >
              {busy === "pro"
                ? t("billing.working")
                : trialActive
                  ? t("billing.keepPro")
                  : t("billing.upgradeToPro")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={(!canStripe && !canMock) || busy !== null}
              onClick={() =>
                void (canStripe
                  ? upgradeStripe("studio")
                  : upgradeMock("studio"))
              }
            >
              {busy === "studio"
                ? t("billing.working")
                : t("billing.upgradeToStudio")}
            </Button>
          </>
        ) : (
          <>
            {canStripe ? (
              <Button
                type="button"
                variant="secondary"
                disabled={busy !== null}
                onClick={() => void openPortal()}
              >
                {busy === "portal"
                  ? t("billing.opening")
                  : t("billing.manageBilling")}
              </Button>
            ) : null}
            {plan === "pro" ? (
              <Button
                type="button"
                disabled={(!canStripe && !canMock) || busy !== null}
                onClick={() =>
                  void (canStripe
                    ? upgradeStripe("studio")
                    : upgradeMock("studio"))
                }
              >
                {busy === "studio"
                  ? t("billing.working")
                  : t("billing.upgradeToStudio")}
              </Button>
            ) : null}
            {canMock ? (
              <Button
                type="button"
                variant="ghost"
                disabled={busy !== null}
                onClick={() => void upgradeMock("free")}
              >
                {busy === "free" ? t("billing.working") : t("billing.downgradeMock")}
              </Button>
            ) : null}
          </>
        )}
      </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("billing.comparePlansPrefix")}{" "}
        <Link href="/pricing" className="underline underline-offset-2">
          {t("billing.pricingPage")}
        </Link>
        . {t("billing.comparePlansSuffix")}{" "}
        <Link href="/settings/team" className="underline underline-offset-2">
          {t("nav.team")}
        </Link>
        .{" "}
        <Link href="/settings/domain" className="underline underline-offset-2">
          {t("domain.title")}
        </Link>
        .
      </p>
    </div>
  );
}
