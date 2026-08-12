"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import type { GalleryListItem } from "@/infrastructure/galleries/list-galleries";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function FirstShowChecklist({
  galleries,
}: {
  galleries: GalleryListItem[];
}) {
  const t = useT();
  const published = galleries.find((gallery) => gallery.status === "published");
  if (published || galleries.length === 0) return null;

  const hung = galleries.some((gallery) => gallery.artworkCount > 0);
  const target =
    galleries.find((gallery) => gallery.artworkCount > 0) ?? galleries[0];
  if (!target) return null;
  const editorHref = `/galleries/${target.id}/edit`;
  const shareUrl = `/g/${target.slug}`;

  return (
    <section className="border border-border px-5 py-5">
      <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
        {t("dashboard.checklistTitle")}
      </p>
      <ol className="mt-4 flex flex-col gap-4">
        <ChecklistRow
          done={hung}
          title={t("dashboard.checklistHang")}
          body={t("dashboard.checklistHangBody")}
          action={
            <Link
              href={editorHref}
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              {t("dashboard.checklistOpenEditor")}
            </Link>
          }
        />
        <ChecklistRow
          done={false}
          title={t("dashboard.checklistPublish")}
          body={t("dashboard.checklistPublishBody")}
          action={
            <Link
              href={editorHref}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("editor.publish")}
            </Link>
          }
        />
        <ChecklistRow
          done={false}
          title={t("dashboard.checklistShare")}
          body={t("dashboard.checklistShareBody", { url: shareUrl })}
        />
      </ol>
    </section>
  );
}

function ChecklistRow({
  done,
  title,
  body,
  action,
}: {
  done: boolean;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-foreground">
          <span
            className={cn(
              "me-2 inline-block size-1.5 rounded-full",
              done ? "bg-foreground" : "bg-border",
            )}
            aria-hidden
          />
          {title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      {action}
    </li>
  );
}
