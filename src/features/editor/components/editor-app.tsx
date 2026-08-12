"use client";

import { useEffect } from "react";

import type { Artwork, Gallery, SceneTemplate } from "@/core/entities";
import { useIsDesktop } from "@/hooks/use-media-query";
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
}: {
  gallery: Gallery;
  template: SceneTemplate;
  artworks: Artwork[];
  assets: AssetListItem[];
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
      toolbar={<EditorToolbar />}
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
