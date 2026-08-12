"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { GalleryListItem } from "@/infrastructure/galleries/list-galleries";
import { useT } from "@/i18n/locale-provider";
import { galleryStatusPresentation } from "@/lib/gallery-status";
import { cn } from "@/lib/utils";

import { DeleteGalleryControl } from "./delete-gallery-control";

export function GalleryList({
  galleries,
  atCap = false,
}: {
  galleries: GalleryListItem[];
  atCap?: boolean;
}) {
  const t = useT();

  if (galleries.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title={t("dashboard.emptyTitle")}
        description={t("dashboard.emptyBody")}
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            {atCap ? null : (
              <Link
                href="/galleries/new"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                {t("dashboard.createFirst")}
              </Link>
            )}
            <Link
              href="/demo/pro"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
            >
              {t("dashboard.walkDemo")}
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <ul className="grid w-full gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
      {galleries.map((gallery, index) => {
        const status = galleryStatusPresentation(gallery.status);
        const delayClass =
          index === 0
            ? ""
            : index === 1
              ? "stagger-fade-1"
              : index === 2
                ? "stagger-fade-2"
                : "stagger-fade-3";
        const workLabel =
          gallery.artworkCount === 1
            ? `1 ${t("walk.work")}`
            : `${gallery.artworkCount} ${t("walk.works")}`;
        return (
          <li
            key={gallery.id}
            className={cn(
              "flex flex-col overflow-hidden border border-border bg-card/60 stagger-fade",
              delayClass,
            )}
          >
            <Link
              href={`/galleries/${gallery.id}/edit`}
              className="group relative block aspect-[16/10] overflow-hidden"
            >
              <GalleryCover gallery={gallery} />
            </Link>
            <div className="flex flex-1 flex-col gap-4 p-5">
              <div className="min-w-0 space-y-2">
                <Link
                  href={`/galleries/${gallery.id}/edit`}
                  className="block truncate font-serif text-xl tracking-tight hover:underline"
                >
                  {gallery.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={status.variant}>{t(status.labelKey)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {workLabel}
                  </span>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <Link
                  href={`/galleries/${gallery.id}/edit`}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                  )}
                >
                  {t("common.edit")}
                </Link>
                {gallery.status === "published" ? (
                  <Link
                    href={`/g/${gallery.slug}`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                    )}
                  >
                    {t("common.open")}
                  </Link>
                ) : null}
                <div className="ms-auto">
                  <DeleteGalleryControl
                    galleryId={gallery.id}
                    galleryTitle={gallery.title}
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function GalleryCover({ gallery }: { gallery: GalleryListItem }) {
  if (gallery.coverThumbUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- dynamic Storage URLs
      <img
        src={gallery.coverThumbUrl}
        alt=""
        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
    );
  }

  const bg = gallery.templateBackground ?? "oklch(0.92 0.02 95)";
  return (
    <div
      className="relative size-full"
      style={{
        background: `linear-gradient(180deg, ${bg} 0%, ${bg} 58%, oklch(0.82 0.02 85) 58%, oklch(0.78 0.02 80) 100%)`,
      }}
      aria-hidden
    >
      <div className="absolute inset-x-[14%] top-[18%] bottom-[48%] flex items-stretch justify-center gap-2 opacity-80 transition-opacity duration-500 group-hover:opacity-100">
        <span className="h-full w-[28%] border border-black/10 bg-[linear-gradient(145deg,#c4784a,#3a2a28)]" />
        <span className="h-full w-[32%] border border-black/10 bg-[radial-gradient(circle_at_45%_40%,#e8f0f5,#1a2a38)]" />
        <span className="h-full w-[26%] border border-black/10 bg-[linear-gradient(160deg,#a83228,#2a0e0c)]" />
      </div>
    </div>
  );
}
