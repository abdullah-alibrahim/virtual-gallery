"use client";

import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function PlanUsageBanner({
  plan,
  galleriesUsed,
  galleriesLimit,
}: {
  plan: string;
  galleriesUsed: number;
  galleriesLimit: number;
}) {
  const t = useT();
  const remaining = Math.max(0, galleriesLimit - galleriesUsed);
  const atCap = galleriesUsed >= galleriesLimit;
  const nearCap = !atCap && remaining <= 1 && galleriesLimit > 1;

  if (atCap) {
    return (
      <Alert tone="warning" title={t("billing.atLimit")}>
        <p>
          {t("billing.atLimitBody", {
            plan,
            limit: galleriesLimit,
            used: galleriesUsed,
          })}{" "}
          <Link
            href="/settings/billing"
            className="text-foreground underline-offset-4 hover:underline"
          >
            {t("billing.upgrade")}
          </Link>{" "}
          {t("billing.createMore")}
        </p>
      </Alert>
    );
  }

  if (nearCap || plan === "free") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border border-border px-4 py-3">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">
            {t("billing.galleriesSlash", {
              used: galleriesUsed,
              limit: galleriesLimit,
            })}
          </span>{" "}
          {t("billing.onPlan", { plan })}
          {nearCap ? t("billing.almostFull") : "."}
        </p>
        {plan === "free" || nearCap ? (
          <Link
            href="/settings/billing"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            {t("billing.upgrade")}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {t("billing.galleriesUsed", {
        used: galleriesUsed,
        limit: galleriesLimit,
      })}{" "}
      {t("billing.onPlan", { plan })}.
    </p>
  );
}
