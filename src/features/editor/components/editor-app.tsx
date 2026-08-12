"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Artwork, Gallery, PlanId, SceneTemplate } from "@/core/entities";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useT } from "@/i18n/locale-provider";
import type { AssetListItem } from "@/infrastructure/firebase/assets-client";

import { AssetsPanel } from "./assets-panel";
import { EditorShell } from "./editor-shell";
import { EditorToolbar } from "./editor-toolbar";
import { EditorViewport } from "./editor-viewport";
import { HierarchyPanel } from "./hierarchy-panel";
import { InspectorPanel } from "./inspector-panel";
import { MobileHandoff } from "./mobile-handoff";
import { useEditorStore } from "../store/editor-store";

export function EditorApp({
  gallery,
  template,
  artworks,
  assets,
  firstExhibition = false,
  trialActive = false,
  trialDaysLeft = 0,
  plan = "pro",
}: {
  gallery: Gallery;
  template: SceneTemplate;
  artworks: Artwork[];
  assets: AssetListItem[];
  firstExhibition?: boolean;
  trialActive?: boolean;
  trialDaysLeft?: number;
  plan?: PlanId;
}) {
  const hydrate = useEditorStore((s) => s.hydrate);
  const setAssets = useEditorStore((s) => s.setAssets);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    hydrate({ gallery, template, artworks, assets });
  }, [hydrate, gallery, template, artworks, assets]);

  useEffect(() => {
    setAssets(assets);
  }, [assets, setAssets]);

  useAutosave(gallery.id);

  if (!isDesktop) {
    return <MobileHandoff galleryTitle={gallery.title} />;
  }

  return (
    <EditorShell
      toolbar={
        <EditorToolbar
          trialActive={trialActive}
          trialDaysLeft={trialDaysLeft}
          plan={plan}
        />
      }
      notice={
        firstExhibition ? <FirstExhibitionNotice /> : null
      }
      hierarchy={<HierarchyPanel />}
      viewport={<EditorViewport />}
      inspector={<InspectorPanel />}
      assets={<AssetsPanel />}
    />
  );
}

function useAutosave(galleryId: string) {
  const saveState = useEditorStore((s) => s.saveState);
  const revision = useEditorStore((s) => s.revision);
  const artworks = useEditorStore((s) => s.artworks);
  const materialOverrides = useEditorStore(
    (s) => s.gallery?.materialOverrides ?? null,
  );
  const lightingOverrides = useEditorStore(
    (s) => s.gallery?.lightingOverrides ?? null,
  );
  const environmentOverrides = useEditorStore(
    (s) => s.gallery?.environmentOverrides ?? null,
  );
  const architectureOverrides = useEditorStore(
    (s) => s.gallery?.architectureOverrides ?? null,
  );
  const lightingPreset = useEditorStore(
    (s) => s.gallery?.settings.lightingPreset,
  );
  const eveningTour = useEditorStore((s) => s.gallery?.settings.eveningTour);
  const setSaveState = useEditorStore((s) => s.setSaveState);
  const markSaved = useEditorStore((s) => s.markSaved);

  useEffect(() => {
    if (saveState !== "dirty") return;

    const handle = window.setTimeout(() => {
      const snapshotRevision = revision;
      const state = useEditorStore.getState();
      const payload = state.artworks;
      const materials = state.gallery?.materialOverrides ?? null;
      const lighting = state.gallery?.lightingOverrides ?? null;
      const environment = state.gallery?.environmentOverrides ?? null;
      const architecture = state.gallery?.architectureOverrides ?? null;
      const preset = state.gallery?.settings.lightingPreset;
      const tour = state.gallery?.settings.eveningTour;
      setSaveState("saving");
      void (async () => {
        try {
          const settings: Record<string, unknown> = {};
          if (preset) settings.lightingPreset = preset;
          if (tour !== undefined) settings.eveningTour = tour ?? null;

          const [artworksRes, galleryRes] = await Promise.all([
            fetch(`/api/galleries/${galleryId}/artworks`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                artworks: payload.map((a) => ({
                  ...a,
                  createdAt: a.createdAt.toISOString(),
                  updatedAt: a.updatedAt.toISOString(),
                })),
              }),
            }),
            fetch(`/api/galleries/${galleryId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                materialOverrides: materials,
                lightingOverrides: lighting,
                environmentOverrides: environment,
                architectureOverrides: architecture,
                settings:
                  Object.keys(settings).length > 0 ? settings : undefined,
              }),
            }),
          ]);
          if (!artworksRes.ok || !galleryRes.ok) {
            throw new Error("Save failed");
          }
          markSaved(snapshotRevision);
        } catch {
          setSaveState("error", "Could not save changes");
        }
      })();
    }, 800);

    return () => window.clearTimeout(handle);
  }, [
    saveState,
    revision,
    artworks,
    materialOverrides,
    lightingOverrides,
    environmentOverrides,
    architectureOverrides,
    lightingPreset,
    eveningTour,
    galleryId,
    setSaveState,
    markSaved,
  ]);
}

function FirstExhibitionNotice() {
  const t = useT();
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div
      className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 text-sm"
      style={{
        background: "var(--editor-panel)",
        borderColor: "var(--editor-border)",
        color: "var(--editor-foreground)",
      }}
    >
      <p className="min-w-0 text-[color:var(--editor-muted)]">
        <span className="text-[color:var(--editor-brass)]">
          {t("editor.firstShowTitle")}
        </span>
        {" — "}
        {t("editor.firstShowBody")}
      </p>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          href="/dashboard"
          className="text-xs text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)]"
        >
          {t("nav.dashboard")}
        </Link>
        <button
          type="button"
          className="text-xs tracking-wide text-[color:var(--editor-brass)] uppercase"
          onClick={() => setVisible(false)}
        >
          {t("editor.firstShowDismiss")}
        </button>
      </div>
    </div>
  );
}
