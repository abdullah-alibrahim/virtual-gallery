"use client";

import {
  Footprints,
  MousePointer2,
  Redo2,
  Save,
  Undo2,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { HouseMark } from "@/components/shared/house-mark";
import { Button } from "@/components/ui/button";
import { arrangeArtworks } from "@/core/services/arrange-artworks";
import {
  NUDGE_STEP_COARSE_M,
  NUDGE_STEP_FINE_M,
  NUDGE_STEP_M,
  nudgePlacement,
} from "@/core/services/wall-placement";
import { DeleteGalleryControl } from "@/features/galleries/components/delete-gallery-control";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

import { PublishControls } from "./publish-controls";
import { useEditorStore } from "../store/editor-store";

export function EditorToolbar({
  trialActive = false,
  trialDaysLeft = 0,
  plan = "pro",
}: {
  trialActive?: boolean;
  trialDaysLeft?: number;
  plan?: "free" | "pro" | "studio";
} = {}) {
  const t = useT();
  const gallery = useEditorStore((s) => s.gallery);
  const template = useEditorStore((s) => s.template);
  const artworks = useEditorStore((s) => s.artworks);
  const saveState = useEditorStore((s) => s.saveState);
  const editorMode = useEditorStore((s) => s.editorMode);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const stack = useEditorStore((s) => s.stack);
  const revision = useEditorStore((s) => s.revision);
  const setEditorMode = useEditorStore((s) => s.setEditorMode);
  const moveArtwork = useEditorStore((s) => s.moveArtwork);
  const assetsCollapsed = useUiStore((s) => s.editorPanels.assetsCollapsed);
  const setEditorPanel = useUiStore((s) => s.setEditorPanel);

  void revision;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      const tag = (event.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (meta && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }
      if (
        meta &&
        (event.key.toLowerCase() === "y" ||
          (event.key.toLowerCase() === "z" && event.shiftKey))
      ) {
        event.preventDefault();
        redo();
        return;
      }
      if (event.code === "Space" && !meta && !typing) {
        event.preventDefault();
        setEditorMode(editorMode === "walk" ? "edit" : "walk");
        return;
      }

      if (typing || editorMode !== "edit" || meta) return;

      const state = useEditorStore.getState();
      const id = state.selectedArtworkId;
      const artwork = state.artworks.find((a) => a.id === id);
      const wall = state.template?.walls.find(
        (w) => w.id === artwork?.placement.wallId,
      );
      if (!artwork || !wall || artwork.placement.locked) return;

      const step = event.shiftKey
        ? NUDGE_STEP_COARSE_M
        : event.altKey
          ? NUDGE_STEP_FINE_M
          : NUDGE_STEP_M;

      let dAlong = 0;
      let dHeight = 0;
      switch (event.key) {
        case "ArrowLeft":
          dAlong = -step;
          break;
        case "ArrowRight":
          dAlong = step;
          break;
        case "ArrowUp":
          dHeight = step;
          break;
        case "ArrowDown":
          dHeight = -step;
          break;
        default:
          return;
      }
      event.preventDefault();
      moveArtwork(
        artwork.id,
        nudgePlacement({
          wall,
          placement: artwork.placement,
          dAlong,
          dHeight,
          // Keyboard nudges stay free so precision steps are not stolen by snap.
          snapToAnchors: false,
        }),
        "Nudge",
      );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, editorMode, setEditorMode, moveArtwork]);

  function autoArrange() {
    if (!template) return;
    const result = arrangeArtworks({ artworks, template });
    let moved = 0;
    for (const placement of result.placements) {
      const artwork = artworks.find((a) => a.id === placement.artworkId);
      if (!artwork || !artwork.placement.autoPlaced) continue;
      moveArtwork(placement.artworkId, {
        wallId: placement.wallId,
        anchorIndex: placement.anchorIndex,
        position: placement.position,
        rotation: placement.rotation,
        scale: placement.scale,
        autoPlaced: true,
      });
      moved += 1;
    }
    if (result.overflow.length > 0) {
      toast.warning(
        t("editor.overflow", { count: result.overflow.length }),
      );
    } else {
      toast.success(moved ? t("editor.arranged", { count: moved }) : t("editor.nothingToArrange"));
    }
  }

  return (
    <div className="flex w-full min-w-0 items-center gap-1.5 text-sm sm:gap-2">
      <HouseMark
        size={13}
        className="ms-1 shrink-0 text-[color:var(--editor-brass)]"
      />
      <div className="min-w-0 shrink">
        <p className="hidden text-[9px] tracking-[0.16em] text-[color:var(--editor-brass)]/70 uppercase sm:block">
          {t("editor.studio")}
        </p>
        <Link
          href="/dashboard"
          className="block max-w-[8rem] truncate font-serif text-base tracking-tight text-[color:var(--editor-foreground)] sm:max-w-[14rem] lg:max-w-[18rem]"
          title={gallery?.title ?? t("editor.gallery")}
        >
          {gallery?.title ?? t("editor.gallery")}
        </Link>
      </div>

      <div className="mx-1 hidden h-5 w-px bg-[color:var(--editor-border)] sm:block" />

      <div className="flex items-center gap-0.5">
        <ToolButton
          label={stack.canUndo ? `${t("editor.undo")} ${stack.undoLabel}` : t("editor.undo")}
          onClick={undo}
          disabled={!stack.canUndo}
        >
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton
          label={stack.canRedo ? `${t("editor.redo")} ${stack.redoLabel}` : t("editor.redo")}
          onClick={redo}
          disabled={!stack.canRedo}
        >
          <Redo2 className="size-4" />
        </ToolButton>
      </div>

      <div
        className="inline-flex items-center border border-[color:var(--editor-border)] p-0.5"
        role="group"
        aria-label={t("editor.mode")}
      >
        <ModeButton
          label={t("editor.edit")}
          active={editorMode === "edit"}
          onClick={() => setEditorMode("edit")}
        >
          <MousePointer2 className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">{t("editor.edit")}</span>
        </ModeButton>
        <ModeButton
          label={t("editor.walkPreview")}
          active={editorMode === "walk"}
          onClick={() => setEditorMode("walk")}
        >
          <Footprints className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">{t("editor.walk")}</span>
        </ModeButton>
      </div>

      <ToolButton label={t("editor.arrangeTitle")} onClick={autoArrange}>
        <Wand2 className="size-4" />
        <span className="sr-only">{t("editor.arrange")}</span>
      </ToolButton>
      <button
        type="button"
        onClick={autoArrange}
        className="hidden items-center gap-1.5 px-2 text-xs text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)] lg:inline-flex"
        title={t("editor.arrangeHint")}
      >
        {t("editor.arrange")}
      </button>

      <div className="flex-1" />

      {trialActive || plan === "free" ? (
        <Link
          href="/settings/billing"
          className="hidden shrink-0 items-center px-2 text-[10px] tracking-[0.14em] text-[color:var(--editor-brass)] uppercase sm:inline-flex"
        >
          {trialActive
            ? t("billing.trialChip", { days: trialDaysLeft })
            : t("billing.keepPro")}
        </Link>
      ) : null}

      <button
        type="button"
        className="hidden shrink-0 text-xs text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)] md:inline"
        onClick={() => setEditorPanel("assetsCollapsed", !assetsCollapsed)}
      >
        {assetsCollapsed ? t("editor.showAssets") : t("editor.hideAssets")}
      </button>

      {gallery ? (
        <DeleteGalleryControl
          galleryId={gallery.id}
          galleryTitle={gallery.title}
          variant="editor"
        />
      ) : null}

      <div
        className={cn(
          "hidden items-center gap-1.5 px-1 text-xs sm:inline-flex",
          saveState === "error"
            ? "text-red-300"
            : "text-[color:var(--editor-muted)]",
        )}
      >
        <Save className="size-3.5" aria-hidden />
        {saveLabel(saveState, t)}
      </div>

      <LanguageSwitcher size="xs" variant="editor" className="hidden sm:inline-flex" />
      <PublishControls />
    </div>
  );
}

function ModeButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs tracking-wide transition-colors",
        active
          ? "bg-white/12 text-[color:var(--editor-foreground)]"
          : "text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)]",
      )}
    >
      {children}
    </button>
  );
}

function ToolButton({
  children,
  label,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "size-8 text-[color:var(--editor-muted)] hover:bg-white/10 hover:text-[color:var(--editor-foreground)]",
        active && "bg-white/10 text-[color:var(--editor-foreground)]",
        disabled && "opacity-40",
      )}
    >
      {children}
    </Button>
  );
}

function saveLabel(
  state: string,
  t: (key: string) => string,
): string {
  switch (state) {
    case "dirty":
      return t("editor.unsaved");
    case "saving":
      return t("editor.saving");
    case "saved":
      return t("editor.saved");
    case "error":
      return t("editor.saveFailed");
    default:
      return t("editor.allSaved");
  }
}
