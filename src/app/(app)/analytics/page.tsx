import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { loadWorkspaceAnalytics } from "@/infrastructure/analytics/record-event";
import { getTranslator } from "@/i18n/server";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.account) redirect("/sign-in?force=1");
  if (!ctx.account.onboarding.completed) redirect("/onboarding");

  const { t } = await getTranslator();

  const summaries = await loadWorkspaceAnalytics({
    workspaceId: ctx.account.defaultWorkspaceId,
    uid: ctx.session.uid,
  });

  const totals = summaries.reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      uniqueVisitors: acc.uniqueVisitors + row.uniqueVisitors,
      artworkClicks: acc.artworkClicks + row.artworkClicks,
      leads: acc.leads + row.leads,
    }),
    { views: 0, uniqueVisitors: 0, artworkClicks: 0, leads: 0 },
  );

  return (
    <AppPage>
      <PageHeader
        title={t("analytics.title")}
        description={t("analytics.description")}
      />

      {summaries.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={t("analytics.empty")}
          description={t("analytics.emptyBody")}
        />
      ) : (
        <div className="flex flex-col gap-10 stagger-fade stagger-fade-1">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("analytics.views")} value={totals.views} delay="" />
            <Stat
              label={t("analytics.uniqueVisitors")}
              value={totals.uniqueVisitors}
              delay="stagger-fade-1"
            />
            <Stat
              label={t("analytics.clicks")}
              value={totals.artworkClicks}
              delay="stagger-fade-2"
            />
            <Stat
              label={t("analytics.leads")}
              value={totals.leads}
              delay="stagger-fade-3"
            />
          </div>

          <ul className="divide-y divide-border border border-border">
            {summaries.map((row) => (
              <li key={row.galleryId} className="px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-serif text-lg tracking-tight">
                    {row.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("analytics.statsRow", {
                      views: row.views,
                      unique: row.uniqueVisitors,
                      clicks: row.artworkClicks,
                      leads: row.leads,
                    })}
                  </p>
                </div>
                {row.days.length > 0 ? (
                  <div className="mt-4 flex h-16 items-end gap-1">
                    {row.days
                      .slice()
                      .reverse()
                      .slice(-14)
                      .map((day) => {
                        const max = Math.max(
                          ...row.days.map((d) => d.views),
                          1,
                        );
                        const h = Math.max(4, Math.round((day.views / max) * 56));
                        return (
                          <div
                            key={day.date}
                            title={`${day.date}: ${day.views} views`}
                            className="flex-1 bg-foreground/80"
                            style={{ height: h }}
                          />
                        );
                      })}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("analytics.noDailyData")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppPage>
  );
}

function Stat({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: string;
}) {
  return (
    <div
      className={cn(
        "border border-border px-5 py-5 stagger-fade",
        delay,
      )}
    >
      <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 font-serif text-4xl tracking-tight">{value}</p>
    </div>
  );
}
