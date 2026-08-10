"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";

import { signOut } from "../lib/session-client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const t = useT();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void (async () => {
          await signOut();
          router.replace("/sign-in?force=1");
          router.refresh();
        })();
      }}
    >
      <LogOut aria-hidden />
      {t("common.signOut")}
    </Button>
  );
}
