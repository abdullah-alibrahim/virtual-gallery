"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function UseThisRoomButton({
  templateId,
  title,
  className,
  size = "sm",
  variant = "primary",
}: {
  templateId: string;
  title: string;
  className?: string;
  size?: "sm" | "lg";
  variant?: "primary" | "secondary";
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const response = await fetch("/api/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, templateId }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        galleryId?: string;
        code?: string;
      } | null;

      if (response.status === 401) {
        router.push(
          `/sign-in?force=1&next=${encodeURIComponent(`/galleries/new?template=${templateId}`)}`,
        );
        return;
      }
      if (response.status === 403) {
        toast.error(body?.error ?? t("galleries.proRequired"));
        router.push("/settings/billing");
        return;
      }
      if (!response.ok || !body?.galleryId) {
        throw new Error(body?.error ?? t("galleries.couldNotCreate"));
      }
      toast.success(t("galleries.created"));
      router.push(`/galleries/${body.galleryId}/edit`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("galleries.couldNotCreate"),
      );
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onClick()}
      className={cn(buttonVariants({ size, variant }), className)}
    >
      {busy ? t("galleries.creating") : t("templates.useThisRoom")}
    </button>
  );
}
