import type { Metadata } from "next";
import Link from "next/link";

import {
  MarketingFooter,
  MarketingNav,
} from "@/components/shared/marketing-nav";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  PLAN_COMPARISON_ROWS,
  PLAN_ORDER,
  formatPlanPrice,
  planDefinition,
} from "@/core/billing/plans";
import type { PlanId } from "@/core/entities";
import { PricingAtmosphere } from "@/features/marketing/components/pricing-atmosphere";
import { getMarketingNavAuth } from "@/features/marketing/lib/nav-auth";
import { getTranslator } from "@/i18n/server";
import type { Translator } from "@/i18n";
import { formatStorageBytes, formatTemplateTiers } from "@/lib/format";
import { cn } from "@/lib/utils";

const COMPARISON_ROW_LABEL_KEYS: Record<string, string> = {
  Galleries: "pricing.galleries",
  "Works per gallery": "pricing.worksPerGallery",
  Storage: "pricing.storage",
  Templates: "pricing.templatesLabel",
  "Team seats": "pricing.teamSeats",
  "Custom domain": "pricing.customDomain",
  "Analytics retention": "pricing.analyticsRetention",
};

function planLabelKey(planId: PlanId): string {
  if (planId === "free") return "pricing.free";
  if (planId === "pro") return "pricing.pro";
  return "pricing.studioPlan";
}

function translateComparisonValue(t: Translator, value: string): string {
  switch (value) {
    case "Included":
      return t("pricing.included");
    case "Free rooms":
      return t("pricing.freeRooms");
    case "Free + Pro":
      return t("pricing.freePlusPro");
    default:
      return value;
  }
}

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free, Pro, and Studio plans for Virtual Gallery.",
};

export default async function PricingPage() {
  const [{ cta, secondaryCta, signedIn }, { t }] = await Promise.all([
    getMarketingNavAuth(),
    getTranslator(),
  ]);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="atmosphere-drift absolute -inset-[10%] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.93_0.025_90),transparent),radial-gradient(ellipse_40%_35%_at_8%_85%,oklch(0.91_0.02_210_/0.16),transparent)]" />
        <div className="absolute inset-0 surface-grain opacity-55" />
      </div>

      <PricingAtmosphere />

      <MarketingNav
        links={[
          { href: "/templates", label: t("nav.templates") },
          { href: "/demo/pro", label: t("nav.demo") },
        ]}
        cta={cta}
        secondaryCta={secondaryCta}
      />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12 pb-16 sm:px-8 sm:py-16 sm:pb-20">
        <div className="page-enter max-w-3xl space-y-5">
          <p className="font-serif text-5xl leading-none tracking-tight text-foreground/25 sm:text-6xl">
            {siteConfig.name}
          </p>
          <div aria-hidden className="rule-grow h-px w-14 bg-foreground/30" />
          <h1 className="font-serif text-5xl tracking-tight sm:text-6xl lg:text-7xl">
            {t("pricing.title")}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground text-pretty sm:text-xl">
            {t("pricing.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3 pt-2 stagger-fade stagger-fade-1">
            <Link
              href={signedIn ? "/settings/billing" : "/sign-up"}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              {signedIn ? t("common.manageBilling") : t("pricing.createGallery")}
            </Link>
            <Link
              href="/demo/pro"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
              )}
            >
              {t("pricing.tryPro")}
            </Link>
          </div>
        </div>

        <ul className="grid gap-6 md:grid-cols-3 md:gap-5 lg:gap-6">
          {PLAN_ORDER.map((planId, index) => {
            const plan = planDefinition(planId);
            const { price, period } = formatPlanPrice(planId);
            const delay =
              index === 1
                ? "stagger-fade-1"
                : index === 2
                  ? "stagger-fade-2"
                  : "";
            const ctaHref = signedIn
              ? "/settings/billing"
              : "/sign-up";
            const planName = t(planLabelKey(planId));
            const ctaLabel =
              planId === "free"
                ? signedIn
                  ? t("pricing.yourPlanOptions")
                  : t("pricing.startFree")
                : signedIn
                  ? t("pricing.upgradeTo", { plan: planName })
                  : t("pricing.startWith", { plan: planName });
            return (
              <li
                key={plan.id}
                className={cn(
                  "relative flex flex-col gap-8 border border-border bg-background/70 p-7 backdrop-blur-[2px] sm:p-8 stagger-fade",
                  delay,
                  plan.featured &&
                    "border-foreground md:-translate-y-3 md:shadow-none",
                )}
              >
                {plan.featured ? (
                  <span className="absolute top-4 right-4 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                    {t("pricing.mostChosen")}
                  </span>
                ) : null}
                <div className="space-y-3">
                  <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                    {planName}
                  </p>
                  <p className="font-serif text-5xl tracking-tight">
                    {price}
                    {period ? (
                      <span className="ml-1 text-base text-muted-foreground">
                        {period}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-base text-muted-foreground text-pretty">
                    {plan.blurb}
                  </p>
                </div>
                <ul className="flex flex-1 flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
                  <li className="flex justify-between gap-4">
                    <span>{t("pricing.galleries")}</span>
                    <span className="text-foreground">
                      {plan.limits.galleries}
                    </span>
                  </li>
                  <li className="flex justify-between gap-4">
                    <span>{t("pricing.worksPerGallery")}</span>
                    <span className="text-foreground">
                      {plan.limits.artworksPerGallery}
                    </span>
                  </li>
                  <li className="flex justify-between gap-4">
                    <span>{t("pricing.storage")}</span>
                    <span className="text-foreground">
                      {formatStorageBytes(plan.limits.storageBytes)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-4">
                    <span>{t("pricing.templatesLabel")}</span>
                    <span className="text-right text-foreground">
                      {translateComparisonValue(
                        t,
                        formatTemplateTiers(plan.limits.templateTiers),
                      )}
                    </span>
                  </li>
                  <li className="flex justify-between gap-4">
                    <span>{t("pricing.teamSeats")}</span>
                    <span className="text-foreground">{plan.limits.seats}</span>
                  </li>
                  {plan.limits.customDomain ? (
                    <li className="flex justify-between gap-4">
                      <span>{t("pricing.customDomain")}</span>
                      <span className="text-foreground">
                        {t("pricing.included")}
                      </span>
                    </li>
                  ) : null}
                </ul>
                <Link
                  href={ctaHref}
                  className={cn(
                    buttonVariants({
                      variant: plan.featured ? "primary" : "secondary",
                      size: "lg",
                    }),
                    "w-full justify-center",
                  )}
                >
                  {ctaLabel}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="space-y-6 page-enter">
          <h2 className="font-serif text-3xl tracking-tight">
            {t("pricing.compare")}
          </h2>
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs tracking-[0.12em] text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-medium">
                    {t("pricing.feature")}
                  </th>
                  {PLAN_ORDER.map((id) => (
                    <th key={id} className="px-4 py-3 font-medium capitalize">
                      {t(planLabelKey(id))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border/70">
                    <td className="px-4 py-3 text-muted-foreground">
                      {t(COMPARISON_ROW_LABEL_KEYS[row.label] ?? row.label)}
                    </td>
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="px-4 py-3 text-foreground">
                        {translateComparisonValue(t, row.values[id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="max-w-2xl text-sm text-muted-foreground page-enter">
          {t("pricing.footer")}
        </p>
      </section>

      <MarketingFooter />
    </main>
  );
}
