"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Calm confirm-to-delete: type the gallery title, then Confirm / Cancel.
 */
export function DeleteGalleryControl({
  galleryId,
  galleryTitle,
  variant = "list",
  onDeleted,
}: {
  galleryId: string;
  galleryTitle: string;
  variant?: "list" | "editor";
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  const matches = confirmText.trim() === galleryTitle.trim();

  async function handleDelete() {
    if (!matches || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/galleries/${galleryId}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? t("galleries.deleteFailed"));
      }
      toast.success(t("galleries.deleted"));
      setOpen(false);
      if (onDeleted) {
        onDeleted();
      } else {
        router.push("/galleries");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("galleries.deleteFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  function close() {
    if (busy) return;
    setOpen(false);
    setConfirmText("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          variant === "list"
            ? cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")
            : "px-2 text-xs text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)]",
        )}
      >
        {t("common.delete")}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-gallery-${galleryId}-title`}
            className="w-full max-w-md border border-border bg-background p-5 shadow-none"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={`delete-gallery-${galleryId}-title`}
              className="font-serif text-xl tracking-tight"
            >
              {t("galleries.deleteTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("galleries.deleteConfirmBody", { title: galleryTitle })}
            </p>
            <Input
              className="mt-4"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={galleryTitle}
              autoFocus
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleDelete();
                if (e.key === "Escape") close();
              }}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={close}
                disabled={busy}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void handleDelete()}
                disabled={!matches || busy}
              >
                {busy ? t("galleries.deleting") : t("common.delete")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
