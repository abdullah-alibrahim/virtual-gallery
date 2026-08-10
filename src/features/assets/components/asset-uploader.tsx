"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/core/services/asset-upload";
import { useT, type Translator } from "@/i18n";
import { cn } from "@/lib/utils";

import { uploadAndProcessFile } from "../lib/upload-file";
import { useUploadQueue } from "../stores/upload-queue";

const ACCEPT = Object.fromEntries(
  ACCEPTED_IMAGE_TYPES.map((type) => [type, [] as string[]]),
);

export function AssetUploader({ className }: { className?: string }) {
  const t = useT();
  const addFiles = useUploadQueue((s) => s.addFiles);
  const patch = useUploadQueue((s) => s.patch);
  const items = useUploadQueue((s) => s.items);
  const clearFinished = useUploadQueue((s) => s.clearFinished);
  const remove = useUploadQueue((s) => s.remove);
  const [active, setActive] = useState(0);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length === 0) return;
      const ids = addFiles(accepted);
      const filesById = new Map(ids.map((id, i) => [id, accepted[i]!]));

      void (async () => {
        for (const id of ids) {
          const file = filesById.get(id);
          if (!file) continue;
          setActive((n) => n + 1);
          try {
            await uploadAndProcessFile(file, {
              onStatus: (status) => patch(id, { status }),
              onProgress: (ratio) =>
                patch(id, { progress: Math.round(ratio * 100) }),
              onAssetId: (assetId) => patch(id, { assetId }),
            });
            toast.success(`${file.name} is ready`);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : t("assets.failed");
            patch(id, { status: "failed", error: message });
            toast.error(message);
          } finally {
            setActive((n) => Math.max(0, n - 1));
          }
        }
      })();
    },
    [addFiles, patch, t],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: ACCEPT,
      maxSize: MAX_UPLOAD_BYTES,
      multiple: true,
      disabled: active > 3,
    });

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-border px-6 py-14 text-center transition-colors scale-in",
          isDragActive && "border-foreground/40 bg-accent/40",
          active > 3 && "pointer-events-none opacity-60",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex size-12 items-center justify-center border border-border bg-muted/60">
          <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex max-w-sm flex-col gap-1.5">
          <p className="font-serif text-xl tracking-tight">
            {isDragActive ? t("assets.dropToUpload") : t("assets.dragHere")}
          </p>
          <p className="text-sm text-muted-foreground text-pretty">
            JPEG, PNG, WebP, TIFF, or GIF · up to 80 MB each. We build the LOD
            ladder — visitors never receive your original.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm">
          {t("assets.browseFiles")}
        </Button>
      </div>

      {fileRejections.length > 0 ? (
        <Alert tone="warning" title={t("assets.filesSkipped")}>
          {fileRejections[0]?.errors[0]?.message ?? t("assets.unsupportedFile")}
        </Alert>
      ) : null}

      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t("assets.uploadQueue")}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFinished}
            >
              {t("assets.clearFinished")}
            </Button>
          </div>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {labelFor(item.status, t)}
                    {item.status === "uploading"
                      ? ` · ${item.progress}%`
                      : null}
                    {item.error ? ` · ${item.error}` : null}
                  </p>
                  {item.status === "uploading" ||
                  item.status === "processing" ? (
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${
                            item.status === "processing" ? 100 : item.progress
                          }%`,
                        }}
                      />
                    </div>
                  ) : null}
                </div>
                {item.status === "processing" ||
                item.status === "reserving" ||
                item.status === "uploading" ? (
                  <Loader2
                    className="size-4 shrink-0 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={t("common.close")}
                    onClick={() => remove(item.id)}
                  >
                    <X className="size-3.5" aria-hidden />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function labelFor(status: string, t: Translator): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "reserving":
      return "Checking plan limits";
    case "uploading":
      return t("assets.uploading");
    case "processing":
      return t("assets.processing");
    case "ready":
      return t("assets.ready");
    case "failed":
      return t("assets.failed");
    default:
      return status;
  }
}
