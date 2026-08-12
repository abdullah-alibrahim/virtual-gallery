"use client";

import { create } from "zustand";

import type {
  Artwork,
  ArtworkPlacement,
  Gallery,
  GalleryArchitectureOverrides,
  GalleryEnvironmentOverrides,
  GalleryLightingOverrides,
  GalleryMaterialOverrides,
  SceneTemplate,
} from "@/core/entities";
import { recomputeAutoPlacedWorldPositions } from "@/core/services/arrange-artworks";
import { nudgePlacement } from "@/core/services/wall-placement";
import type { AssetListItem } from "@/infrastructure/firebase/assets-client";

import {
  createAddArtworkCommand,
  createBatchMoveArtworksCommand,
  createMoveArtworkCommand,
  createRemoveArtworkCommand,
  createUpdateArtworkCommand,
  type ArtworkPatch,
} from "../commands/artwork-commands";
import { CommandStack } from "../commands/stack";
import {
  reviveArtwork,
  reviveAsset,
  reviveGallery,
} from "../lib/revive";
import { mergeAssetsWithSamples } from "../lib/sample-assets";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
export type GizmoMode = "select" | "move" | "rotate" | "scale";
export type EditorMode = "edit" | "walk";

interface EditorState {
  gallery: Gallery | null;
  template: SceneTemplate | null;
  artworks: Artwork[];
  assets: AssetListItem[];
  selectedArtworkId: string | null;
  gizmoMode: GizmoMode;
  editorMode: EditorMode;
  /** Live wall-drag in progress — disables orbit. */
  placementDragActive: boolean;
  /** Snap free drops to nearby anchors. */
  snapToAnchors: boolean;
  saveState: SaveState;
  saveError: string | null;
  revision: number;
  stack: CommandStack;

  hydrate: (input: {
    gallery: Gallery;
    template: SceneTemplate;
    artworks: Artwork[];
    assets: AssetListItem[];
  }) => void;
  selectArtwork: (id: string | null) => void;
  setGizmoMode: (mode: GizmoMode) => void;
  setEditorMode: (mode: EditorMode) => void;
  setPlacementDragActive: (active: boolean) => void;
  setSnapToAnchors: (snap: boolean) => void;
  setAssets: (assets: AssetListItem[]) => void;
  setSaveState: (state: SaveState, error?: string | null) => void;
  markSaved: (revision: number) => void;
  applyGalleryMeta: (
    meta: Partial<
      Pick<
        Gallery,
        | "status"
        | "publishedVersion"
        | "publishedAt"
        | "hasUnpublishedChanges"
        | "manifestPath"
      >
    >,
  ) => void;
  updateMaterialOverrides: (
    patch: GalleryMaterialOverrides | null,
  ) => void;
  updateLightingOverrides: (
    patch: GalleryLightingOverrides | null,
  ) => void;
  updateEnvironmentOverrides: (
    patch: GalleryEnvironmentOverrides | null,
  ) => void;
  updateArchitectureOverrides: (
    patch: GalleryArchitectureOverrides | null,
  ) => void;
  applyLightingPreset: (presetId: string) => void;
  updateGallerySettingsPatch: (
    patch: Partial<
      Pick<
        Gallery["settings"],
        "eveningTour" | "walkSpeed" | "showTitles" | "allowZoom"
      >
    >,
  ) => void;

  applyPatch: (artworkId: string, patch: ArtworkPatch) => void;
  applyPlacement: (artworkId: string, placement: ArtworkPlacement) => void;
  insertArtwork: (artwork: Artwork) => void;
  removeArtworkLocal: (artworkId: string) => void;

  updateArtwork: (
    artworkId: string,
    after: ArtworkPatch,
    label?: string,
  ) => void;
  moveArtwork: (artworkId: string, after: ArtworkPlacement, label?: string) => void;
  /** Commit a move that was already applied via applyPlacement (drag). */
  commitPlacementMove: (
    artworkId: string,
    before: ArtworkPlacement,
    after: ArtworkPlacement,
  ) => void;
  moveArtworksBatch: (
    moves: readonly {
      artworkId: string;
      after: ArtworkPlacement;
    }[],
    label?: string,
  ) => void;
  addArtwork: (artwork: Artwork) => void;
  removeArtwork: (artworkId: string) => void;
  duplicateArtwork: (artworkId: string) => void;
  bringArtworkForward: (artworkId: string) => void;
  undo: () => void;
  redo: () => void;
}

function mergeArtwork(artwork: Artwork, patch: ArtworkPatch): Artwork {
  return {
    ...artwork,
    ...patch,
    frame: patch.frame ?? artwork.frame,
    placement: patch.placement ?? artwork.placement,
    lighting: patch.lighting ?? artwork.lighting,
    media: patch.media ?? artwork.media,
    commerce: patch.commerce ?? artwork.commerce,
    dimensions: patch.dimensions ?? artwork.dimensions,
    updatedAt: new Date(),
  };
}

function mergePartialOverrides<T extends object>(
  current: T | null,
  patch: T | null,
): T | null {
  if (patch === null) return null;
  const merged = { ...(current ?? {}), ...patch } as T;
  return Object.keys(merged).length === 0 ? null : merged;
}

export const useEditorStore = create<EditorState>((set, get) => {
  const stack = new CommandStack();
  stack.subscribe(() => set({ revision: get().revision + 1 }));

  return {
    gallery: null,
    template: null,
    artworks: [],
    assets: [],
    selectedArtworkId: null,
    gizmoMode: "select",
    editorMode: "edit",
    placementDragActive: false,
    snapToAnchors: true,
    saveState: "idle",
    saveError: null,
    revision: 0,
    stack,

    hydrate: ({ gallery, template, artworks, assets }) => {
      stack.clear();
      const revived = artworks.map(reviveArtwork);
      const fixed = recomputeAutoPlacedWorldPositions(revived, template);
      const positionsFixed = fixed.some(
        (artwork, i) => artwork !== revived[i],
      );
      set({
        gallery: reviveGallery(gallery),
        template,
        artworks: fixed,
        assets: mergeAssetsWithSamples(assets, gallery.workspaceId).map(
          reviveAsset,
        ),
        selectedArtworkId: null,
        // Persist corrected east/west positions via autosave when needed.
        saveState: positionsFixed ? "dirty" : "idle",
        saveError: null,
        revision: 0,
        editorMode: "edit",
        gizmoMode: "select",
        placementDragActive: false,
      });
    },

    selectArtwork: (selectedArtworkId) => set({ selectedArtworkId }),
    setGizmoMode: (gizmoMode) => set({ gizmoMode }),
    setEditorMode: (editorMode) => set({ editorMode }),
    setPlacementDragActive: (placementDragActive) =>
      set({ placementDragActive }),
    setSnapToAnchors: (snapToAnchors) => set({ snapToAnchors }),
    setAssets: (assets) =>
      set((state) => ({
        assets: mergeAssetsWithSamples(
          assets,
          state.gallery?.workspaceId ?? assets[0]?.workspaceId ?? "",
        ).map(reviveAsset),
      })),
    setSaveState: (saveState, saveError = null) =>
      set({ saveState, saveError }),
    markSaved: (revision) =>
      set((state) =>
        state.revision === revision
          ? { saveState: "saved", saveError: null }
          : state,
      ),
    applyGalleryMeta: (meta) =>
      set((state) =>
        state.gallery
          ? { gallery: { ...state.gallery, ...meta } }
          : state,
      ),

    updateMaterialOverrides: (patch) =>
      set((state) => {
        if (!state.gallery) return state;
        return {
          gallery: {
            ...state.gallery,
            materialOverrides: mergePartialOverrides(
              state.gallery.materialOverrides,
              patch,
            ),
            hasUnpublishedChanges: true,
          },
          saveState: "dirty",
          revision: state.revision + 1,
        };
      }),

    updateLightingOverrides: (patch) =>
      set((state) => {
        if (!state.gallery) return state;
        const lightingOverrides = mergePartialOverrides(
          state.gallery.lightingOverrides,
          patch,
        );
        const spotIntensity = lightingOverrides?.spotIntensity;
        const temperatureK = lightingOverrides?.temperatureK;
        const touchSpots =
          patch !== null &&
          (patch.spotIntensity !== undefined ||
            patch.temperatureK !== undefined);

        return {
          gallery: {
            ...state.gallery,
            lightingOverrides,
            hasUnpublishedChanges: true,
          },
          artworks: touchSpots
            ? state.artworks.map((artwork) =>
                artwork.lighting.enabled
                  ? {
                      ...artwork,
                      lighting: {
                        ...artwork.lighting,
                        ...(spotIntensity !== undefined
                          ? { intensity: spotIntensity }
                          : {}),
                        ...(temperatureK !== undefined
                          ? { temperatureK }
                          : {}),
                      },
                      updatedAt: new Date(),
                    }
                  : artwork,
              )
            : state.artworks,
          saveState: "dirty",
          revision: state.revision + 1,
        };
      }),

    updateEnvironmentOverrides: (patch) =>
      set((state) => {
        if (!state.gallery) return state;
        return {
          gallery: {
            ...state.gallery,
            environmentOverrides: mergePartialOverrides(
              state.gallery.environmentOverrides,
              patch,
            ),
            hasUnpublishedChanges: true,
          },
          saveState: "dirty",
          revision: state.revision + 1,
        };
      }),

    updateArchitectureOverrides: (patch) =>
      set((state) => {
        if (!state.gallery) return state;
        return {
          gallery: {
            ...state.gallery,
            architectureOverrides: mergePartialOverrides(
              state.gallery.architectureOverrides,
              patch,
            ),
            hasUnpublishedChanges: true,
          },
          saveState: "dirty",
          revision: state.revision + 1,
        };
      }),

    applyLightingPreset: (presetId) =>
      set((state) => {
        if (!state.gallery || !state.template) return state;
        const preset = state.template.lighting.presets.find(
          (p) => p.id === presetId,
        );
        if (!preset) return state;
        return {
          gallery: {
            ...state.gallery,
            settings: {
              ...state.gallery.settings,
              lightingPreset: preset.id,
            },
            lightingOverrides: mergePartialOverrides(
              state.gallery.lightingOverrides,
              {
                spotIntensity: preset.spotIntensity,
                temperatureK: preset.temperatureK,
              },
            ),
            hasUnpublishedChanges: true,
          },
          artworks: state.artworks.map((artwork) =>
            artwork.lighting.enabled
              ? {
                  ...artwork,
                  lighting: {
                    ...artwork.lighting,
                    intensity: preset.spotIntensity,
                    temperatureK: preset.temperatureK,
                  },
                  updatedAt: new Date(),
                }
              : artwork,
          ),
          saveState: "dirty",
          revision: state.revision + 1,
        };
      }),

    updateGallerySettingsPatch: (patch) =>
      set((state) => {
        if (!state.gallery) return state;
        return {
          gallery: {
            ...state.gallery,
            settings: {
              ...state.gallery.settings,
              ...patch,
            },
            hasUnpublishedChanges: true,
          },
          saveState: "dirty",
          revision: state.revision + 1,
        };
      }),

    applyPatch: (artworkId, patch) =>
      set((state) => ({
        artworks: state.artworks.map((a) =>
          a.id === artworkId ? mergeArtwork(a, patch) : a,
        ),
        saveState: "dirty",
        gallery: state.gallery
          ? { ...state.gallery, hasUnpublishedChanges: true }
          : null,
      })),

    applyPlacement: (artworkId, placement) =>
      get().applyPatch(artworkId, { placement }),

    insertArtwork: (artwork) =>
      set((state) => ({
        artworks: [...state.artworks, artwork],
        selectedArtworkId: artwork.id,
        saveState: "dirty",
        gallery: state.gallery
          ? { ...state.gallery, hasUnpublishedChanges: true }
          : null,
      })),

    removeArtworkLocal: (artworkId) =>
      set((state) => ({
        artworks: state.artworks.filter((a) => a.id !== artworkId),
        selectedArtworkId:
          state.selectedArtworkId === artworkId
            ? null
            : state.selectedArtworkId,
        saveState: "dirty",
        gallery: state.gallery
          ? { ...state.gallery, hasUnpublishedChanges: true }
          : null,
      })),

    updateArtwork: (artworkId, after, label) => {
      const artwork = get().artworks.find((a) => a.id === artworkId);
      if (!artwork) return;
      const before: ArtworkPatch = {};
      for (const key of Object.keys(after) as (keyof ArtworkPatch)[]) {
        before[key] = artwork[key] as never;
      }
      get().stack.execute(
        createUpdateArtworkCommand({
          artworkId,
          before,
          after,
          apply: get().applyPatch,
          label,
        }),
      );
    },

    moveArtwork: (artworkId, after, label) => {
      const artwork = get().artworks.find((a) => a.id === artworkId);
      if (!artwork) return;
      get().stack.execute(
        createMoveArtworkCommand({
          artworkId,
          before: artwork.placement,
          after,
          applyPlacement: get().applyPlacement,
          label,
        }),
      );
    },

    commitPlacementMove: (artworkId, before, after) => {
      if (placementsEqual(before, after)) return;
      get().stack.record(
        createMoveArtworkCommand({
          artworkId,
          before,
          after,
          applyPlacement: get().applyPlacement,
        }),
      );
      // Ensure dirty flag / revision bump even though apply already ran.
      set((state) => ({
        saveState: "dirty",
        revision: state.revision + 1,
        gallery: state.gallery
          ? { ...state.gallery, hasUnpublishedChanges: true }
          : null,
      }));
    },

    moveArtworksBatch: (moves, label) => {
      if (moves.length === 0) return;
      const prepared = moves.flatMap((move) => {
        const artwork = get().artworks.find((a) => a.id === move.artworkId);
        if (!artwork) return [];
        return [
          {
            artworkId: move.artworkId,
            before: artwork.placement,
            after: move.after,
          },
        ];
      });
      if (prepared.length === 0) return;
      get().stack.execute(
        createBatchMoveArtworksCommand({
          moves: prepared,
          applyPlacement: get().applyPlacement,
          label,
        }),
      );
    },

    addArtwork: (artwork) => {
      get().stack.execute(
        createAddArtworkCommand({
          artwork,
          insert: get().insertArtwork,
          remove: get().removeArtworkLocal,
        }),
      );
    },

    removeArtwork: (artworkId) => {
      const artwork = get().artworks.find((a) => a.id === artworkId);
      if (!artwork) return;
      get().stack.execute(
        createRemoveArtworkCommand({
          artwork,
          insert: get().insertArtwork,
          remove: get().removeArtworkLocal,
        }),
      );
    },

    duplicateArtwork: (artworkId) => {
      const artwork = get().artworks.find((a) => a.id === artworkId);
      const template = get().template;
      if (!artwork || !template) return;
      const wall = template.walls.find((w) => w.id === artwork.placement.wallId);
      const maxOrder = get().artworks.reduce(
        (max, a) => Math.max(max, a.order),
        -1,
      );
      let placement: ArtworkPlacement = {
        ...artwork.placement,
        autoPlaced: false,
        locked: false,
        anchorIndex: null,
      };
      if (wall) {
        placement = {
          ...nudgePlacement({
            wall,
            placement: artwork.placement,
            dAlong: 0.35,
            dHeight: 0,
            snapToAnchors: false,
          }),
          locked: false,
        };
      }
      get().addArtwork({
        ...artwork,
        id: crypto.randomUUID(),
        order: maxOrder + 1,
        title: `${artwork.title || "Untitled"} copy`,
        placement,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },

    bringArtworkForward: (artworkId) => {
      const artworks = get().artworks;
      const artwork = artworks.find((a) => a.id === artworkId);
      if (!artwork) return;
      const maxOrder = artworks.reduce((max, a) => Math.max(max, a.order), -1);
      if (artwork.order >= maxOrder) return;
      get().updateArtwork(artworkId, { order: maxOrder + 1 }, "Bring forward");
    },

    undo: () => get().stack.undo(),
    redo: () => get().stack.redo(),
  };
});

function placementsEqual(a: ArtworkPlacement, b: ArtworkPlacement): boolean {
  return (
    a.wallId === b.wallId &&
    a.anchorIndex === b.anchorIndex &&
    a.scale === b.scale &&
    a.autoPlaced === b.autoPlaced &&
    Boolean(a.locked) === Boolean(b.locked) &&
    a.position[0] === b.position[0] &&
    a.position[1] === b.position[1] &&
    a.position[2] === b.position[2] &&
    a.rotation[0] === b.rotation[0] &&
    a.rotation[1] === b.rotation[1] &&
    a.rotation[2] === b.rotation[2]
  );
}