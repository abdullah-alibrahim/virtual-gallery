"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { RoomStill } from "@/components/shared/room-still";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { PlanId } from "@/core/entities";
import { canUseTemplateTier } from "@/core/services/enforce-plan-limits";
import { TEMPLATE_CATALOGUE, getTemplateSwatches } from "@/core/templates";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function CreateGalleryForm({
  remaining,
  limit,
  plan = "free",
}: {
  remaining?: number;
  limit?: number;
  plan?: PlanId;
} = {}) {
  const router = useRouter();
  const t = useT();
  const firstAllowed =
    TEMPLATE_CATALOGUE.find((tpl) => canUseTemplateTier(plan, tpl.tier))?.id ??
    TEMPLATE_CATALOGUE[0]?.id ??
    "";
  const [title, setTitle] = useState(t("galleries.untitled"));
  const [templateId, setTemplateId] = useState(firstAllowed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const selected = TEMPLATE_CATALOGUE.find((tpl) => tpl.id === templateId);
    if (selected && !canUseTemplateTier(plan, selected.tier)) {
      setError(t("galleries.proRequired"));
      return;
    }
    setBusy(true);
    setError(null);
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
      if (!response.ok || !body?.galleryId) {
        if (response.status === 402 || body?.code === "PLAN_LIMIT_REACHED") {
          throw new Error(body?.error ?? t("galleries.planLimit"));
        }
        if (response.status === 403) {
          throw new Error(body?.error ?? t("galleries.proRequired"));
        }
        throw new Error(body?.error ?? t("galleries.couldNotCreate"));
      }
      toast.success(t("galleries.created"));
      router.push(`/galleries/${body.galleryId}/edit`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("galleries.couldNotCreate"),
      );
      setBusy(false);
    }
  }

  const description =
    remaining !== undefined && limit !== undefined
      ? t("galleries.pickRoomRemaining", { remaining, limit })
      : t("galleries.pickRoom");

  const showUpgradeHint =
    Boolean(error) &&
    (error!.toLowerCase().includes("pro") ||
      error!.toLowerCase().includes("limit"));

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-10">
      <PageHeader title={t("galleries.createTitle")} description={description} />

      {error ? (
        <Alert tone="destructive" title={t("galleries.createFailed")}>
          {error}{" "}
          {showUpgradeHint ? (
            <Link
              href="/settings/billing"
              className="underline underline-offset-2"
            >
              {t("common.upgrade")}
            </Link>
          ) : null}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 stagger-fade stagger-fade-1">
        <Label htmlFor="title">{t("galleries.titleLabel")}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={busy}
          className="h-11"
        />
      </div>

      <fieldset className="flex flex-col gap-4 stagger-fade stagger-fade-2">
        <legend className="text-sm font-medium">
          {t("galleries.templateLabel")}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {TEMPLATE_CATALOGUE.map((template) => {
            const locked = !canUseTemplateTier(plan, template.tier);
            const selected = template.id === templateId && !locked;
            const { wall, floor } = getTemplateSwatches(template);
            const walkDemoHref =
              template.id === "modern-white"
                ? "/demo/walk"
                : template.id === "mega-wing"
                  ? "/demo/pro"
                  : template.id === "harbor-pavilion"
                    ? "/demo/harbor"
                    : null;
            const walkDemoLabel =
              template.id === "modern-white"
                ? t("support.walkQuiet")
                : template.id === "mega-wing"
                  ? t("support.tryPro")
                  : template.id === "harbor-pavilion"
                    ? t("demo.harborTitle")
                    : null;
            return (
              <button
                key={template.id}
                type="button"
                disabled={busy || locked}
                onClick={() => {
                  if (!locked) setTemplateId(template.id);
                }}
                className={cn(
                  "relative flex flex-col gap-4 border p-3 text-left transition-colors sm:p-4",
                  locked && "opacity-55",
                  selected
                    ? "border-foreground bg-accent/40"
                    : "border-border hover:bg-accent/30",
                )}
              >
                {locked ? (
                  <span className="absolute top-3 right-3 z-10 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                    {t("galleries.requiresPro")} ·{" "}
                    <Link
                      href="/settings/billing"
                      onClick={(e) => e.stopPropagation()}
                      className="underline underline-offset-2"
                    >
                      {t("common.upgrade")}
                    </Link>
                  </span>
                ) : null}
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <RoomStill
                    template={template}
                    artCount={3}
                    animate={false}
                  />
                </div>
                <div className="flex flex-col gap-2 px-1 pb-1">
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-lg tracking-tight">
                      {template.name}
                    </p>
                    {template.tier === "pro" ? (
                      <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
                        {t("pricing.pro")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.tagline}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="size-2.5 border border-border"
                        style={{ background: wall }}
                        aria-hidden
                      />
                      {t("galleries.wall")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="size-2.5 border border-border"
                        style={{ background: floor }}
                        aria-hidden
                      />
                      {t("editor.floor")}
                    </span>
                    <span>
                      {t("galleries.upToWorks", {
                        max: template.capacity.max,
                      })}
                    </span>
                  </div>
                  {walkDemoHref && walkDemoLabel ? (
                    <Link
                      href={walkDemoHref}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {walkDemoLabel}
                    </Link>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      <Button type="submit" size="lg" disabled={busy || !templateId}>
        {busy ? t("galleries.creating") : t("galleries.openEditor")}
      </Button>
    </form>
  );
}
