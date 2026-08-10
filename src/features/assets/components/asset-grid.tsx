"use client";

import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, type Translator } from "@/i18n";
import {
  subscribeWorkspaceAssets,
  type AssetListItem,
} from "@/infrastructure/firebase/assets-client";
import { cn } from "@/lib/utils";

export function AssetGrid({ workspaceId }: { workspaceId: string }) {
  const t = useT();
  const [assets, setAssets] = useState<readonly AssetListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeWorkspaceAssets(
      workspaceId,
      (items) => {
        setAssets(items);
        setError(null);
      },
      (err) => setError(err.message),
    );
    return unsub;
  }, [workspaceId]);

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {t("assets.couldNotLoad")}: {error}
      </p>
    );
  }

  if (!assets) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="aspect-[4/3] w-full" />
        <Skeleton className="aspect-[4/3] w-full" />
        <Skeleton className="aspect-[4/3] w-full" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title={t("assets.emptyLibrary")}
        description={t("assets.emptyLibraryBody")}
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {assets.map((asset) => (
        <li
          key={asset.id}
          className="overflow-hidden rounded-lg border border-border bg-card"
        >
          <div
            className="relative aspect-[4/3] bg-muted"
            style={
              asset.dominantColor
                ? { backgroundColor: asset.dominantColor }
                : undefined
            }
          >
            {asset.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- dynamic Storage URLs
              <img
                src={asset.thumbUrl}
                alt={asset.fileName}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                {asset.status === "processing" || asset.status === "uploading"
                  ? t("assets.processing")
                  : t("assets.noPreview")}
              </div>
            )}
            <div className="absolute top-2 left-2">
              <Badge variant={statusVariant(asset.status)}>
                {statusLabel(asset.status, t)}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-1 p-3">
            <p className="truncate text-sm font-medium">{asset.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(asset.bytes)}
              {asset.width && asset.height
                ? ` · ${asset.width}×${asset.height}`
                : null}
              {asset.textureFormat ? ` · ${asset.textureFormat}` : null}
            </p>
            {asset.error ? (
              <p className={cn("text-xs text-destructive")}>{asset.error}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function statusLabel(status: AssetListItem["status"], t: Translator): string {
  switch (status) {
    case "ready":
      return t("assets.ready");
    case "failed":
      return t("assets.failed");
    case "processing":
      return t("assets.buildingLods");
    case "uploading":
      return t("assets.uploading");
    default:
      return status;
  }
}

function statusVariant(
  status: AssetListItem["status"],
): "neutral" | "success" | "warning" | "destructive" | "primary" {
  switch (status) {
    case "ready":
      return "success";
    case "failed":
      return "destructive";
    case "processing":
      return "primary";
    case "uploading":
      return "warning";
    default:
      return "neutral";
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
