"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

import { useEditorStore } from "../store/editor-store";

export function HierarchyPanel() {
  const t = useT();
  const artworks = useEditorStore((s) => s.artworks);
  const selectedArtworkId = useEditorStore((s) => s.selectedArtworkId);
  const selectArtwork = useEditorStore((s) => s.selectArtwork);
  const removeArtwork = useEditorStore((s) => s.removeArtwork);
  const assetsCollapsed = useUiStore((s) => s.editorPanels.assetsCollapsed);
  const setEditorPanel = useUiStore((s) => s.setEditorPanel);

  const ordered = [...artworks].sort((a, b) => a.order - b.order);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[color:var(--editor-border)] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[color:var(--editor-muted)]">
        {t("editor.onWalls")}
      </div>
      <ul className="flex-1 overflow-auto p-1">
        {ordered.length === 0 ? (
          <li className="flex flex-col items-center gap-2 px-3 py-6 text-center text-xs text-[color:var(--editor-muted)]">
            <p>{t("editor.noPaintingsYet")}</p>
            {assetsCollapsed ? (
              <button
                type="button"
                className="text-[color:var(--editor-foreground)] underline underline-offset-2 hover:text-white"
                onClick={() => setEditorPanel("assetsCollapsed", false)}
              >
                {t("editor.showAssets")}
              </button>
            ) : (
              <p>{t("editor.hangHint")}</p>
            )}
          </li>
        ) : (
          ordered.map((artwork) => {
            const active = artwork.id === selectedArtworkId;
            return (
              <li key={artwork.id}>
                <div
                  className={cn(
                    "group flex items-center gap-1 rounded px-2 py-1.5 text-sm",
                    active
                      ? "bg-white/10 text-[color:var(--editor-foreground)]"
                      : "text-[color:var(--editor-muted)] hover:bg-white/5 hover:text-[color:var(--editor-foreground)]",
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate text-left"
                    onClick={() => selectArtwork(artwork.id)}
                  >
                    {artwork.title || t("common.untitled")}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 opacity-0 group-hover:opacity-100"
                    aria-label={`Remove ${artwork.title}`}
                    onClick={() => removeArtwork(artwork.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
