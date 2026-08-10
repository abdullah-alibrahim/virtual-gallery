import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppTopbar } from "@/components/shared/app-topbar";
import { AuthHydrator } from "@/features/auth/components/auth-hydrator";
import { SignOutButton } from "@/features/auth";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { isPlatformAdmin } from "@/infrastructure/firebase/platform-admin";

export default async function AppShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/sign-in?force=1");

  const displayName =
    ctx.account?.displayName || ctx.session.name || "Artist";
  const email = ctx.account?.email || ctx.session.email || "";

  return (
    <AuthHydrator>
      <div className="flex min-h-dvh bg-background">
        <AppSidebar
          studioName={displayName}
          showAdmin={isPlatformAdmin(ctx.session)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar
            displayName={displayName}
            email={email}
            actions={<SignOutButton />}
          />
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </AuthHydrator>
  );
}
