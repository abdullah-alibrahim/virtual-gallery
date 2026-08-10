import type { Metadata } from "next";

import { AdminOverview } from "@/features/admin";
import { listPlatformOverview } from "@/infrastructure/admin/list-platform-overview";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";

export const metadata: Metadata = {
  title: "Admin · Templates",
  robots: { index: false, follow: false },
};

export default async function AdminTemplatesPage() {
  const ctx = await getAuthContext();
  const overview = await listPlatformOverview();
  const email = ctx?.account?.email || ctx?.session.email || "admin";

  return (
    <AdminOverview overview={overview} actorEmail={email} module="templates" />
  );
}
