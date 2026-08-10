import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { AssetGrid } from "@/features/assets/components/asset-grid";
import { AssetUploader } from "@/features/assets/components/asset-uploader";
import { SamplePaintingsPack } from "@/features/assets/components/sample-paintings-pack";
import { StorageUsage } from "@/features/assets/components/storage-usage";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { getTranslator } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Assets",
};

export default async function AssetsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.account) redirect("/sign-in?force=1");
  if (!ctx.account.onboarding.completed) redirect("/onboarding");

  const { t } = await getTranslator();

  const workspaceId = ctx.account.defaultWorkspaceId;
  const workspace = await getAdminDb()
    .collection("workspaces")
    .doc(workspaceId)
    .get();
  const data = workspace.data();
  const used = Number(data?.usage?.storageBytes ?? 0);
  const limit = Number(data?.limits?.storageBytes ?? 0);

  return (
    <AppPage>
      <PageHeader
        title={t("assets.title")}
        description={t("assets.description")}
      />

      <div className="flex flex-col gap-10 stagger-fade stagger-fade-1">
        <StorageUsage usedBytes={used} limitBytes={limit} />
        <AssetUploader />
        <SamplePaintingsPack />
        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-2xl tracking-tight">
            {t("assets.library")}
          </h2>
          <AssetGrid workspaceId={workspaceId} />
        </section>
      </div>
    </AppPage>
  );
}
