import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { InboxClient } from "@/features/leads/components/inbox-client";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { getTranslator } from "@/i18n/server";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage() {
  const ctx = await getAuthContext();
  if (!ctx?.account) redirect("/sign-in?force=1");
  if (!ctx.account.onboarding.completed) redirect("/onboarding");

  const { t } = await getTranslator();

  return (
    <AppPage>
      <PageHeader
        title={t("inbox.title")}
        description={t("inbox.description")}
      />
      <div className="stagger-fade stagger-fade-1">
        <InboxClient />
      </div>
    </AppPage>
  );
}
