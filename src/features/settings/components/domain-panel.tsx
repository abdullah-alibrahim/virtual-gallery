"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useT } from "@/i18n";

type HostnameState = {
  host: string;
  status: "pending" | "verified";
  cnameTarget: string;
};

export function DomainPanel({
  current,
  cnameTarget,
}: {
  current: HostnameState | null;
  cnameTarget: string;
}) {
  const t = useT();
  const router = useRouter();
  const [host, setHost] = useState(current?.host ?? "");
  const [busy, setBusy] = useState<"save" | "verify" | "remove" | null>(null);

  async function post(action: "save" | "verify" | "remove") {
    setBusy(action);
    try {
      const response = await fetch("/api/settings/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          host: action === "save" ? host : undefined,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(body?.error ?? t("domain.updateFailed"));
      }
      toast.success(
        action === "verify"
          ? t("domain.verified")
          : action === "remove"
            ? t("domain.removed")
            : t("domain.saved"),
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("domain.updateFailed"),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <form
      className="flex max-w-xl flex-col gap-6"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void post("save");
      }}
    >
      <Alert tone="info" title={t("domain.dnsTitle")}>
        <p>
          {t("domain.dnsBody", { host: host || "gallery.yourstudio.com", target: cnameTarget })}
        </p>
        <p className="mt-2">{t("domain.vercelHint")}</p>
      </Alert>

      {current?.status === "verified" ? (
        <Alert tone="success" title={t("domain.liveTitle")}>
          {t("domain.liveBody", { host: current.host })}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="custom-host">{t("domain.hostLabel")}</Label>
        <Input
          id="custom-host"
          value={host}
          onChange={(event) => setHost(event.target.value)}
          placeholder="gallery.yourstudio.com"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy !== null}>
          {busy === "save" ? t("billing.working") : t("domain.save")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null || !current}
          onClick={() => void post("verify")}
        >
          {busy === "verify" ? t("billing.working") : t("domain.verify")}
        </Button>
        {current ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy !== null}
            onClick={() => void post("remove")}
          >
            {busy === "remove" ? t("billing.working") : t("domain.remove")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
