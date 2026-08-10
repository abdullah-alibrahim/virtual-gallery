"use client";

import { ExternalLink, History, Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

import { useEditorStore } from "../store/editor-store";

type VersionRow = {
  version: number;
  artworkCount: number;
  compiledAt: string;
  isLive: boolean;
};

type SceneIssue = {
  kind: string;
  message: string;
  artworkId?: string;
};

/**
 * Publish / unpublish / rollback controls for the editor toolbar.
 */
export function PublishControls() {
  const t = useT();
  const gallery = useEditorStore((s) => s.gallery);
  const saveState = useEditorStore((s) => s.saveState);
  const applyGalleryMeta = useEditorStore((s) => s.applyGalleryMeta);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [issues, setIssues] = useState<SceneIssue[]>([]);

  const loadVersions = useCallback(async () => {
    if (!gallery) return;
    const response = await fetch(`/api/galleries/${gallery.id}/versions`);
    if (!response.ok) return;
    const body = (await response.json()) as { versions: VersionRow[] };
    setVersions(body.versions);
  }, [gallery]);

  function toggleHistory() {
    setOpen((wasOpen) => {
      const next = !wasOpen;
      if (next) void loadVersions();
      return next;
    });
  }

  if (!gallery) return null;

  const dirty =
    saveState === "dirty" ||
    saveState === "saving" ||
    gallery.hasUnpublishedChanges;
  const wasLive = gallery.status === "published";
  const viewerPath = `/g/${gallery.slug}`;
  const publicUrl = `${siteConfig.url}${viewerPath}`;

  async function publish() {
    if (!gallery) return;
    const firstPublish = gallery.status !== "published";
    setBusy(true);
    setIssues([]);
    try {
      const response = await fetch(`/api/galleries/${gallery.id}/publish`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        issues?: SceneIssue[];
        version?: number;
        viewerUrl?: string;
      } | null;

      if (!response.ok) {
        if (body?.issues?.length) {
          setIssues(body.issues);
          setOpen(true);
        }
        throw new Error(body?.error ?? t("editor.publishFailed"));
      }

      applyGalleryMeta({
        status: "published",
        publishedVersion: body?.version ?? (gallery.publishedVersion ?? 0) + 1,
        publishedAt: new Date(),
        hasUnpublishedChanges: false,
      });
      toast.success(
        body?.version
          ? t("editor.publishedToast", {
              version: body.version,
              slug: gallery.slug,
            })
          : t("editor.galleryPublished"),
      );
      void loadVersions();
      if (firstPublish) setOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("editor.publishFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    if (!gallery) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/galleries/${gallery.id}/unpublish`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(body?.error ?? t("editor.unpublishFailed"));
      }
      applyGalleryMeta({ status: "unpublished" });
      toast.success(t("editor.galleryUnpublished"));
      void loadVersions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("editor.unpublishFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function rollback(version: number) {
    if (!gallery) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/galleries/${gallery.id}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        version?: number;
      } | null;
      if (!response.ok) {
        throw new Error(body?.error ?? t("editor.rollbackFailed"));
      }
      applyGalleryMeta({
        status: "published",
        publishedVersion: version,
        publishedAt: new Date(),
        hasUnpublishedChanges: true,
      });
      toast.success(t("editor.rolledBack", { version }));
      void loadVersions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("editor.rollbackFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex items-center gap-1.5">
      {wasLive ? (
        <a
          href={viewerPath}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 px-2 text-xs text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)]"
          title={publicUrl}
        >
          <ExternalLink className="size-3.5" aria-hidden />
          {t("editor.live")}
        </a>
      ) : null}

      {dirty ? (
        <span className="hidden text-[11px] text-amber-200/80 sm:inline">
          {t("editor.unpublishedChanges")}
        </span>
      ) : null}

      <Button
        type="button"
        size="sm"
        disabled={busy || saveState === "saving"}
        onClick={() => void publish()}
        className="h-8 gap-1.5"
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Upload className="size-3.5" aria-hidden />
        )}
        {wasLive ? t("editor.updateLive") : t("editor.publish")}
      </Button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        title={t("editor.publishHistory")}
        aria-label={t("editor.publishHistory")}
        disabled={busy}
        onClick={toggleHistory}
        className="size-8 text-[color:var(--editor-muted)] hover:bg-white/10 hover:text-[color:var(--editor-foreground)]"
      >
        <History className="size-4" />
      </Button>

      {open ? (
        <div
          className={cn(
            "absolute top-full end-0 z-50 mt-2 w-80 border border-[color:var(--editor-border)]",
            "bg-[color:var(--editor-panel)] p-3 shadow-lg",
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{t("editor.publishHistory")}</p>
              <p className="text-xs text-[color:var(--editor-muted)]">
                {wasLive
                  ? dirty
                    ? t("editor.draftHasChanges")
                    : t("editor.liveAs", {
                        version: gallery.publishedVersion ?? 0,
                      })
                  : t("editor.notLiveYet")}
              </p>
              <p className="mt-1 truncate font-mono text-[10px] text-[color:var(--editor-muted)]">
                {publicUrl}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)]"
              onClick={() => setOpen(false)}
            >
              {t("common.close")}
            </button>
          </div>

          {issues.length > 0 ? (
            <ul className="mb-3 space-y-1 border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
              {issues.map((issue, index) => (
                <li key={`${issue.kind}-${index}`}>{issue.message}</li>
              ))}
            </ul>
          ) : null}

          {wasLive ? (
            <div className="mb-3">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => void unpublish()}
              >
                {t("editor.unpublish")}
              </Button>
            </div>
          ) : null}

          <p className="mb-1.5 text-[11px] tracking-wide text-[color:var(--editor-muted)] uppercase">
            {t("editor.versions")}
          </p>
          {versions.length === 0 ? (
            <p className="text-xs text-[color:var(--editor-muted)]">
              {t("editor.noVersions")}
            </p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {versions.map((row) => (
                <li
                  key={row.version}
                  className="flex items-center justify-between gap-2 border border-[color:var(--editor-border)] px-2 py-1.5 text-xs"
                >
                  <div>
                    <p className="font-medium">
                      v{row.version}
                      {row.isLive ? (
                        <span className="ms-1.5 text-[color:var(--editor-muted)]">
                          {t("editor.live")}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[color:var(--editor-muted)]">
                      {t("editor.worksCount", { count: row.artworkCount })}
                      {row.compiledAt
                        ? ` · ${new Date(row.compiledAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  {!row.isLive ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      className="h-7 px-2"
                      onClick={() => void rollback(row.version)}
                    >
                      {t("editor.restore")}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
