"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n";
import { queryKeys } from "@/lib/query-keys";

type LeadRow = {
  id: string;
  galleryId: string;
  galleryTitle?: string | null;
  artworkId: string | null;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
};

async function fetchInbox(): Promise<LeadRow[]> {
  const response = await fetch("/api/leads/inbox");
  if (!response.ok) throw new Error("Could not load inbox");
  const body = (await response.json()) as { leads?: LeadRow[] };
  return body.leads ?? [];
}

export function InboxClient() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.leads.byWorkspace("me"),
    queryFn: fetchInbox,
  });

  const statusLabel: Record<LeadRow["status"], string> = {
    new: t("inbox.new"),
    read: t("inbox.read"),
    replied: t("inbox.replied"),
    archived: t("inbox.archived"),
  };

  async function setStatus(lead: LeadRow, status: LeadRow["status"]) {
    const response = await fetch("/api/leads/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        galleryId: lead.galleryId,
        leadId: lead.id,
        status,
      }),
    });
    if (!response.ok) {
      toast.error(t("inbox.couldNotUpdate"));
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: queryKeys.leads.byWorkspace("me"),
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">{t("inbox.couldNotLoad")}</p>
    );
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={t("inbox.empty")}
        description={t("inbox.emptyBody")}
      />
    );
  }

  return (
    <ul className="divide-y divide-border border border-border stagger-fade stagger-fade-1">
      {leads.map((lead) => (
        <li key={lead.id} className="flex flex-col gap-3 px-4 py-5 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{lead.name}</p>
              <a
                href={`mailto:${lead.email}`}
                className="text-sm text-muted-foreground hover:underline"
              >
                {lead.email}
              </a>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {new Date(lead.createdAt).toLocaleString()}
                <span className="mx-1.5 text-border">·</span>
                <Link
                  href={`/galleries/${lead.galleryId}/edit`}
                  className="hover:underline"
                >
                  {lead.galleryTitle?.trim() || t("inbox.galleryFallback")}
                </Link>
                {lead.artworkId ? (
                  <>
                    <span className="mx-1.5 text-border">·</span>
                    <span>{t("inbox.aboutWork")}</span>
                  </>
                ) : null}
              </p>
            </div>
            <Badge
              variant={
                lead.status === "new"
                  ? "primary"
                  : lead.status === "archived"
                    ? "outline"
                    : "neutral"
              }
            >
              {statusLabel[lead.status]}
            </Badge>
          </div>
          <p className="whitespace-pre-wrap text-sm text-pretty">
            {lead.message}
          </p>
          <div className="flex flex-wrap gap-2">
            {lead.status === "new" ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void setStatus(lead, "read")}
              >
                {t("inbox.markRead")}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void setStatus(lead, "replied")}
            >
              {t("inbox.markReplied")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void setStatus(lead, "archived")}
            >
              {t("inbox.archive")}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
