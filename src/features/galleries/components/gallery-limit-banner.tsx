"use client";

import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { useT } from "@/i18n";

export function GalleryLimitBanner({
  used,
  limit,
  plan,
}: {
  used: number;
  limit: number;
  plan: string;
}) {
  const t = useT();
  const atCap = used >= limit;

  if (!atCap) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("billing.galleriesUsed", { used, limit })}{" "}
        {t("billing.onPlan", { plan })}.
      </p>
    );
  }

  return (
    <Alert tone="warning" title={t("billing.atLimit")}>
      <p>
        {t("billing.atLimitBody", { plan, limit, used })}{" "}
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
