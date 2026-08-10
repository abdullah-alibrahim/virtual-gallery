"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { EditorPlacementTools } from "./editor-placement-tools";
import { editorDraftToManifest } from "../lib/to-scene-manifest";
import { useEditorStore } from "../store/editor-store";

const SceneRoot = dynamic(
  () =>
    import("@/three/scene/scene-root").then((m) => m.SceneRoot),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full flex-col items-center justify-center gap-3 bg-[color:var(--editor-bg)] text-[color:var(--editor-muted)]">
        <p className="font-serif text-lg tracking-tight text-[color:var(--editor-foreground)]">
          Preparing the room…
        </p>
        <div className="h-px w-20 origin-center bg-white/25 viewer-load-line" />
      </div>
    ),
  },
);

export function EditorViewport() {
  const gallery = useEditorStore((s) => s.gallery);
  const template = useEditorStore((s) => s.template);
  const artworks = useEditorStore((s) => s.artworks);
  const assets = useEditorStore((s) => s.assets);
  const selectedArtworkId = useEditorStore((s) => s.selectedArtworkId);
  const selectArtwork = useEditorStore((s) => s.selectArtwork);
  const editorMode = useEditorStore((s) => s.editorMode);
  const placementDragActive = useEditorStore((s) => s.placementDragActive);

  const selected = artworks.find((a) => a.id === selectedArtworkId) ?? null;

  const manifest = useMemo(() => {
    if (!gallery || !template) return null;
    return editorDraftToManifest({
      gallery,
      template,
      artworks,
      assets,
      placeholderUrl: "/demo/artworks/01.jpg",
    });
  }, [gallery, template, artworks, assets]);

  if (!manifest) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 bg-[color:var(--editor-bg)] text-sm text-[color:var(--editor-muted)]">
        <p className="font-serif text-lg tracking-tight text-[color:var(--editor-foreground)]">
          No gallery loaded
        </p>
        <p className="text-xs">Return to the studio and open a show to edit.</p>
      </div>
    );
  }

  const walk = editorMode === "walk";
  const empty = artworks.length === 0;

  return (
    <div className="relative size-full">
      <SceneRoot
        manifest={manifest}
        walkEnabled={walk}
        orbitEnabled={!walk && !placementDragActive}
        selectedArtworkId={selectedArtworkId}
        selectedArtworkLocked={Boolean(selected?.placement.locked)}
        onSelectArtwork={selectArtwork}
        className="size-full"
      >
        {!walk ? <EditorPlacementTools /> : null}
      </SceneRoot>
      {walk ? (
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] tracking-wide text-white/55 backdrop-blur-sm">
          Walk preview · turn to see side walls · Space returns to Edit
        </p>
      ) : empty ? (
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 border border-[color:var(--editor-brass)]/25 bg-black/50 px-3 py-1.5 text-[10px] tracking-wide text-white/60 backdrop-blur-sm">
          Open Assets → click a painting to hang · then drag on the wall to place
        </p>
      ) : (
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] tracking-wide text-white/45 backdrop-blur-sm">
          {selected
            ? selected.placement.locked
              ? "Locked · unlock in inspector to move"
              : "Drag painting to move · arrows nudge · Space for walk"
            : "Select a painting · drag to reposition · Space for walk"}
        </p>
      )}
    </div>
  );
}
