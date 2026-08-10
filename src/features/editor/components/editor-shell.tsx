"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

/**
 * Five-panel editor chrome. Panel sizes persist via the UI store.
 * Colours use `--editor-*` tokens so artwork reads true against neutral panels.
 */
export function EditorShell({
  toolbar,
  hierarchy,
  viewport,
  inspector,
  assets,
}: {
  toolbar: ReactNode;
  hierarchy: ReactNode;
  viewport: ReactNode;
  inspector: ReactNode;
  assets: ReactNode;
}) {
  const panels = useUiStore((s) => s.editorPanels);
  const setEditorPanel = useUiStore((s) => s.setEditorPanel);

  return (
    <div
      className="flex h-dvh w-dvw flex-col overflow-hidden text-[color:var(--editor-foreground)]"
      style={{ background: "var(--editor-bg)" }}
    >
      <div
        className="flex h-12 shrink-0 items-center border-b px-3"
        style={{
          background: "var(--editor-panel)",
          borderColor: "var(--editor-border)",
        }}
      >
        {toolbar}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          className="shrink-0 overflow-hidden border-r"
          style={{
            width: panels.hierarchyWidth,
            background: "var(--editor-rail)",
            borderColor: "var(--editor-border)",
          }}
        >
          {hierarchy}
        </aside>

        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-white/10"
          onPointerDown={(event) => {
            event.preventDefault();
            const startX = event.clientX;
            const startW = panels.hierarchyWidth;
            const onMove = (e: PointerEvent) => {
              setEditorPanel(
                "hierarchyWidth",
                Math.min(320, Math.max(140, startW + (e.clientX - startX))),
              );
            };
            const onUp = () => {
              window.removeEventListener("pointermove", onMove);
              window.removeEventListener("pointerup", onUp);
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
          }}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 bg-black">{viewport}</div>

          {!panels.assetsCollapsed ? (
            <>
              <div
                className="h-1 shrink-0 cursor-row-resize hover:bg-white/10"
                onPointerDown={(event) => {
                  event.preventDefault();
                  const startY = event.clientY;
                  const startH = panels.assetsHeight;
                  const onMove = (e: PointerEvent) => {
                    setEditorPanel(
                      "assetsHeight",
                      Math.min(
                        280,
                        Math.max(88, startH - (e.clientY - startY)),
                      ),
                    );
                  };
                  const onUp = () => {
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  };
                  window.addEventListener("pointermove", onMove);
                  window.addEventListener("pointerup", onUp);
                }}
              />
              <div
                className="shrink-0 overflow-hidden border-t"
                style={{
                  height: panels.assetsHeight,
                  background: "var(--editor-panel)",
                  borderColor: "var(--editor-border)",
                }}
              >
                {assets}
              </div>
            </>
          ) : null}
        </div>

        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-white/10"
          onPointerDown={(event) => {
            event.preventDefault();
            const startX = event.clientX;
            const startW = panels.inspectorWidth;
            const onMove = (e: PointerEvent) => {
              setEditorPanel(
                "inspectorWidth",
                Math.min(420, Math.max(240, startW - (e.clientX - startX))),
              );
            };
            const onUp = () => {
              window.removeEventListener("pointermove", onMove);
              window.removeEventListener("pointerup", onUp);
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
          }}
        />

        <aside
          className={cn("shrink-0 overflow-hidden border-l")}
          style={{
            width: panels.inspectorWidth,
            background: "var(--editor-panel)",
            borderColor: "var(--editor-border)",
          }}
        >
          {inspector}
        </aside>
      </div>
    </div>
  );
}
