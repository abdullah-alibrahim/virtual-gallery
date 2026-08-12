"use client";

import type { Availability, FloorStyle } from "@/core/entities";
import {
  CEILING_TEXTURE_PRESETS,
  FLOOR_TEXTURE_PRESETS,
  SURFACE_TEXTURE_NONE,
  WALL_TEXTURE_PRESETS,
} from "@/core/entities";
import { applyGalleryOverrides } from "@/core/services/apply-gallery-overrides";
import {
  alignPlacementToEyeLine,
  buildPlacementOnWall,
  distributePlacementsOnWall,
  EYE_LINE_M,
  findWall,
  wallCoords,
} from "@/core/services/wall-placement";
import {
  dimensionsRoughlyMatch,
  estimateExhibitionDimensions,
  suggestFrameFromArtwork,
} from "@/core/services/artwork-ai-assist";
import { FRAME_STYLES } from "@/core/value-objects/frame-spec";
import { createDimensions } from "@/core/value-objects/dimensions";
import { createFrameSpec } from "@/core/value-objects/frame-spec";
import { createMoney } from "@/core/value-objects/money";
import { useT } from "@/i18n";
import type { MessageKey } from "@/i18n/translate";
import { toast } from "sonner";

import { useEditorStore } from "../store/editor-store";
import {
  EditorField,
  EditorSelect,
  EditorTextarea,
  PropertyRow,
} from "./property-row";

const AVAILABILITY_KEYS: Record<Availability, MessageKey> = {
  available: "editor.available",
  sold: "editor.sold",
  reserved: "editor.reserved",
  nfs: "editor.nfs",
  priceOnRequest: "editor.priceOnRequest",
};

const FRAME_STYLE_KEYS: Record<(typeof FRAME_STYLES)[number], MessageKey> = {
  none: "editor.none",
  thin: "editor.thin",
  classic: "editor.classic",
  gallery: "editor.gallery",
  floater: "editor.floater",
  ornate: "editor.ornate",
};

const FLOOR_STYLE_KEYS: Record<FloorStyle, MessageKey> = {
  plank: "editor.plank",
  parquet: "editor.parquet",
  concrete: "editor.concrete",
  stone: "editor.stone",
};

/**
 * All painting properties. Every automatic placement decision is overridable here.
 * Room / Surfaces stays visible so wall and floor can be edited without a selection.
 */
export function InspectorPanel() {
  const t = useT();
  const artworks = useEditorStore((s) => s.artworks);
  const assets = useEditorStore((s) => s.assets);
  const selectedArtworkId = useEditorStore((s) => s.selectedArtworkId);
  const template = useEditorStore((s) => s.template);
  const gallery = useEditorStore((s) => s.gallery);
  const updateArtwork = useEditorStore((s) => s.updateArtwork);
  const moveArtwork = useEditorStore((s) => s.moveArtwork);
  const moveArtworksBatch = useEditorStore((s) => s.moveArtworksBatch);
  const duplicateArtwork = useEditorStore((s) => s.duplicateArtwork);
  const bringArtworkForward = useEditorStore((s) => s.bringArtworkForward);
  const snapToAnchors = useEditorStore((s) => s.snapToAnchors);
  const setSnapToAnchors = useEditorStore((s) => s.setSnapToAnchors);
  const updateMaterialOverrides = useEditorStore(
    (s) => s.updateMaterialOverrides,
  );
  const updateLightingOverrides = useEditorStore(
    (s) => s.updateLightingOverrides,
  );
  const updateEnvironmentOverrides = useEditorStore(
    (s) => s.updateEnvironmentOverrides,
  );
  const updateArchitectureOverrides = useEditorStore(
    (s) => s.updateArchitectureOverrides,
  );
  const applyLightingPreset = useEditorStore((s) => s.applyLightingPreset);
  const updateGallerySettingsPatch = useEditorStore(
    (s) => s.updateGallerySettingsPatch,
  );

  const artwork = artworks.find((a) => a.id === selectedArtworkId) ?? null;
  const linkedAsset = artwork
    ? (assets.find((a) => a.id === artwork.assetId) ?? null)
    : null;
  const sizeSuggestion =
    linkedAsset?.width && linkedAsset.height
      ? estimateExhibitionDimensions(linkedAsset.width, linkedAsset.height)
      : null;
  const showSizeSuggest =
    Boolean(artwork && sizeSuggestion) &&
    artwork != null &&
    sizeSuggestion != null &&
    !dimensionsRoughlyMatch(artwork.dimensions, sizeSuggestion);
  const frameSuggestion =
    artwork && template
      ? suggestFrameFromArtwork({
          dominantColor: linkedAsset?.dominantColor ?? null,
          category: template.category,
          defaults: template.frameDefaults,
        })
      : null;
  const showFrameSuggest =
    Boolean(artwork && frameSuggestion) &&
    artwork != null &&
    frameSuggestion != null &&
    (artwork.frame.style !== frameSuggestion.frame.style ||
      artwork.frame.color !== frameSuggestion.frame.color ||
      artwork.frame.matteCm !== frameSuggestion.frame.matteCm ||
      artwork.frame.matteColor !== frameSuggestion.frame.matteColor ||
      artwork.frame.widthCm !== frameSuggestion.frame.widthCm);
  const resolved =
    template && gallery ? applyGalleryOverrides(template, gallery) : null;
  const materials = resolved?.materials ?? null;
  const lighting = resolved?.lighting ?? null;
  const environment = resolved?.environment ?? null;
  const architecture = template?.architecture;
  const hasMaterialOverrides = Boolean(
    gallery?.materialOverrides &&
      Object.keys(gallery.materialOverrides).length > 0,
  );
  const hasLightingOverrides = Boolean(
    gallery?.lightingOverrides &&
      Object.keys(gallery.lightingOverrides).length > 0,
  );
  const hasEnvironmentOverrides = Boolean(
    gallery?.environmentOverrides &&
      Object.keys(gallery.environmentOverrides).length > 0,
  );
  const hasArchitectureOverrides = Boolean(
    gallery?.architectureOverrides &&
      Object.keys(gallery.architectureOverrides).length > 0,
  );
  const bandEnabled =
    gallery?.materialOverrides?.wallBandEnabled !== false &&
    materials?.wallBand !== undefined;
  const lightingPresets = template?.lighting.presets ?? [];
  const activePresetId =
    gallery?.settings.lightingPreset ?? lightingPresets[0]?.id ?? "";
  const spotIntensity =
    gallery?.lightingOverrides?.spotIntensity ??
    lightingPresets.find((p) => p.id === activePresetId)?.spotIntensity ??
    1.2;
  const spotKelvin =
    gallery?.lightingOverrides?.temperatureK ??
    lightingPresets.find((p) => p.id === activePresetId)?.temperatureK ??
    4000;

  return (
    <div className="flex h-full flex-col">
      <Header
        title={
          artwork
            ? artwork.title || t("common.untitled")
            : t("editor.roomLight")
        }
      />
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-3">
        {materials ? (
          <Section title={t("editor.surfaces")}>
            <p className="mb-1 px-0.5 text-[10px] leading-relaxed text-[color:var(--editor-muted)]">
              {t("editor.materialsFinish")}
            </p>
            <PropertyRow label={t("editor.wall")}>
              <EditorField
                type="color"
                value={toColorInputValue(materials.wall)}
                onChange={(e) =>
                  updateMaterialOverrides({ wall: e.target.value })
                }
              />
            </PropertyRow>
            <PropertyRow label={t("editor.floor")}>
              <EditorField
                type="color"
                value={toColorInputValue(materials.floor)}
                onChange={(e) =>
                  updateMaterialOverrides({ floor: e.target.value })
                }
              />
            </PropertyRow>
            <PropertyRow label={t("editor.style")}>
              <EditorSelect
                value={materials.floorStyle ?? "plank"}
                onChange={(e) =>
                  updateMaterialOverrides({
                    floorStyle: e.target.value as FloorStyle,
                  })
                }
              >
                {(Object.keys(FLOOR_STYLE_KEYS) as FloorStyle[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {t(FLOOR_STYLE_KEYS[value])}
                    </option>
                  ),
                )}
              </EditorSelect>
            </PropertyRow>
            <PropertyRow label={t("editor.floorMap")}>
              <EditorSelect
                value={materials.floorTextureId ?? SURFACE_TEXTURE_NONE}
                onChange={(e) =>
                  updateMaterialOverrides({
                    floorTextureId: e.target.value,
                  })
                }
              >
                <option value={SURFACE_TEXTURE_NONE}>Auto (style)</option>
                {FLOOR_TEXTURE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </EditorSelect>
            </PropertyRow>
            <PropertyRow label={t("editor.wallMap")}>
              <EditorSelect
                value={materials.wallTextureId ?? SURFACE_TEXTURE_NONE}
                onChange={(e) =>
                  updateMaterialOverrides({
                    wallTextureId: e.target.value,
                  })
                }
              >
                <option value={SURFACE_TEXTURE_NONE}>Procedural</option>
                {WALL_TEXTURE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </EditorSelect>
            </PropertyRow>
            <PropertyRow label="Ceil map">
              <EditorSelect
                value={materials.ceilingTextureId ?? SURFACE_TEXTURE_NONE}
                onChange={(e) =>
                  updateMaterialOverrides({
                    ceilingTextureId: e.target.value,
                  })
                }
              >
                <option value={SURFACE_TEXTURE_NONE}>Procedural</option>
                {CEILING_TEXTURE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </EditorSelect>
            </PropertyRow>
            <PropertyRow label={t("editor.ceiling")}>
              <EditorField
                type="color"
                value={toColorInputValue(materials.ceiling)}
                onChange={(e) =>
                  updateMaterialOverrides({ ceiling: e.target.value })
                }
              />
            </PropertyRow>
            <PropertyRow label={t("editor.trim")}>
              <EditorField
                type="color"
                value={toColorInputValue(materials.trim)}
                onChange={(e) =>
                  updateMaterialOverrides({ trim: e.target.value })
                }
              />
            </PropertyRow>
            <PropertyRow label={t("editor.band")}>
              <EditorSelect
                value={bandEnabled ? "on" : "off"}
                onChange={(e) => {
                  const on = e.target.value === "on";
                  updateMaterialOverrides(
                    on
                      ? {
                          wallBandEnabled: true,
                          wallBand:
                            materials.wallBand ??
                            template?.materials.wallBand ??
                            "#d4cfc4",
                          wallBandBottomM:
                            materials.wallBandBottomM ??
                            template?.materials.wallBandBottomM ??
                            0.9,
                          wallBandTopM:
                            materials.wallBandTopM ??
                            template?.materials.wallBandTopM ??
                            2.4,
                        }
                      : { wallBandEnabled: false },
                  );
                }}
              >
                <option value="on">{t("editor.on")}</option>
                <option value="off">{t("editor.off")}</option>
              </EditorSelect>
            </PropertyRow>
            {bandEnabled ? (
              <>
                <PropertyRow label="Band colour">
                  <EditorField
                    type="color"
                    value={toColorInputValue(materials.wallBand ?? "#d4cfc4")}
                    onChange={(e) =>
                      updateMaterialOverrides({
                        wallBandEnabled: true,
                        wallBand: e.target.value,
                      })
                    }
                  />
                </PropertyRow>
                <PropertyRow label="Band low m">
                  <EditorField
                    type="number"
                    step="0.05"
                    min="0"
                    max="8"
                    value={materials.wallBandBottomM ?? 0.9}
                    onChange={(e) =>
                      updateMaterialOverrides({
                        wallBandEnabled: true,
                        wallBandBottomM: clampRange(
                          Number(e.target.value),
                          0,
                          8,
                        ),
                      })
                    }
                  />
                </PropertyRow>
                <PropertyRow label="Band high m">
                  <EditorField
                    type="number"
                    step="0.05"
                    min="0"
                    max="8"
                    value={materials.wallBandTopM ?? 2.4}
                    onChange={(e) =>
                      updateMaterialOverrides({
                        wallBandEnabled: true,
                        wallBandTopM: clampRange(Number(e.target.value), 0, 8),
                      })
                    }
                  />
                </PropertyRow>
              </>
            ) : null}
            <PropertyRow label="Wall rough">
              <EditorField
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={materials.wallRoughness ?? 0.85}
                onChange={(e) =>
                  updateMaterialOverrides({
                    wallRoughness: clamp01(Number(e.target.value)),
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label="Ceil rough">
              <EditorField
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={materials.ceilingRoughness ?? 0.92}
                onChange={(e) =>
                  updateMaterialOverrides({
                    ceilingRoughness: clamp01(Number(e.target.value)),
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label="Floor rough">
              <EditorField
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={materials.floorRoughness ?? 0.7}
                onChange={(e) =>
                  updateMaterialOverrides({
                    floorRoughness: clamp01(Number(e.target.value)),
                  })
                }
              />
            </PropertyRow>
            {hasMaterialOverrides ? (
              <button
                type="button"
                className="mt-1 self-start text-[11px] text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)]"
                onClick={() => updateMaterialOverrides(null)}
              >
                Reset surfaces
              </button>
            ) : null}
          </Section>
        ) : null}

        {lighting ? (
          <Section title={t("editor.lighting")}>
            <p className="mb-1 px-0.5 text-[10px] leading-relaxed text-[color:var(--editor-muted)]">
              Room wash, tracks, and exhibition spots — live in the 3D view.
            </p>
            {lightingPresets.length > 0 ? (
              <PropertyRow label={t("editor.preset")}>
                <EditorSelect
                  value={activePresetId}
                  onChange={(e) => applyLightingPreset(e.target.value)}
                >
                  {lightingPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </EditorSelect>
              </PropertyRow>
            ) : null}
            <PropertyRow label={t("editor.ambient")}>
              <EditorField
                type="number"
                step="0.05"
                min="0"
                max="4"
                value={Number(lighting.ambient.intensity.toFixed(2))}
                onChange={(e) =>
                  updateLightingOverrides({
                    ambientIntensity: clampRange(
                      Number(e.target.value),
                      0,
                      4,
                    ),
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label="Key">
              <EditorField
                type="number"
                step="0.05"
                min="0"
                max="6"
                value={Number(
                  (lighting.key?.intensity ?? template?.lighting.key?.intensity ?? 1).toFixed(2),
                )}
                onChange={(e) =>
                  updateLightingOverrides({
                    keyIntensity: clampRange(Number(e.target.value), 0, 6),
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label="Fill">
              <EditorField
                type="number"
                step="0.05"
                min="0"
                max="4"
                value={Number(
                  (lighting.fill?.intensity ?? template?.lighting.fill?.intensity ?? 0.3).toFixed(2),
                )}
                onChange={(e) =>
                  updateLightingOverrides({
                    fillIntensity: clampRange(Number(e.target.value), 0, 4),
                  })
                }
              />
            </PropertyRow>
            {architecture?.trackLights ||
            gallery?.lightingOverrides?.trackIntensity !== undefined ? (
              <PropertyRow label={t("editor.tracks")}>
                <EditorField
                  type="number"
                  step="0.1"
                  min="0"
                  max="8"
                  value={
                    resolved?.architecture?.trackLights?.intensity ??
                    architecture?.trackLights?.intensity ??
                    1.5
                  }
                  onChange={(e) =>
                    updateLightingOverrides({
                      trackIntensity: clampRange(Number(e.target.value), 0, 8),
                    })
                  }
                />
              </PropertyRow>
            ) : null}
            <PropertyRow label={t("editor.artSpots")}>
              <EditorField
                type="number"
                step="0.1"
                min="0"
                max="8"
                value={spotIntensity}
                onChange={(e) =>
                  updateLightingOverrides({
                    spotIntensity: clampRange(Number(e.target.value), 0, 8),
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label="Kelvin">
              <EditorField
                type="number"
                step="100"
                min="2000"
                max="8000"
                value={spotKelvin}
                onChange={(e) =>
                  updateLightingOverrides({
                    temperatureK: clampRange(
                      Number(e.target.value) || 4000,
                      2000,
                      8000,
                    ),
                  })
                }
              />
            </PropertyRow>
            <PropertyRow label="Warm/cool">
              <EditorField
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={gallery?.lightingOverrides?.warmCool ?? 0}
                onChange={(e) =>
                  updateLightingOverrides({
                    warmCool: clampRange(Number(e.target.value), -1, 1),
                  })
                }
              />
            </PropertyRow>
            {hasLightingOverrides ? (
              <button
                type="button"
                className="mt-1 self-start text-[11px] text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)]"
                onClick={() => updateLightingOverrides(null)}
              >
                Reset lighting
              </button>
            ) : null}
          </Section>
        ) : null}

        {environment ? (
          <Section title={t("editor.environment")}>
            <p className="mb-1 px-0.5 text-[10px] leading-relaxed text-[color:var(--editor-muted)]">
              Void colour and tone exposure for the room.
            </p>
            <PropertyRow label={t("editor.background")}>
              <EditorField
                type="color"
                value={toColorInputValue(environment.background)}
                onChange={(e) =>
                  updateEnvironmentOverrides({ background: e.target.value })
                }
              />
            </PropertyRow>
            <PropertyRow label={t("editor.exposure")}>
              <EditorField
                type="number"
                step="0.05"
                min="0.2"
                max="3"
                value={Number(environment.exposure.toFixed(2))}
                onChange={(e) =>
                  updateEnvironmentOverrides({
                    exposure: clampRange(Number(e.target.value), 0.2, 3),
                  })
                }
              />
            </PropertyRow>
            {architecture?.skylight ? (
              <PropertyRow label="Skylight">
                <EditorSelect
                  value={
                    gallery?.environmentOverrides?.skylightEnabled === false
                      ? "off"
                      : "on"
                  }
                  onChange={(e) =>
                    updateEnvironmentOverrides({
                      skylightEnabled: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">{t("editor.on")}</option>
                  <option value="off">{t("editor.off")}</option>
                </EditorSelect>
              </PropertyRow>
            ) : null}
            {architecture?.window ? (
              <PropertyRow label="Window">
                <EditorSelect
                  value={
                    gallery?.environmentOverrides?.windowEnabled === false
                      ? "off"
                      : "on"
                  }
                  onChange={(e) =>
                    updateEnvironmentOverrides({
                      windowEnabled: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">{t("editor.on")}</option>
                  <option value="off">{t("editor.off")}</option>
                </EditorSelect>
              </PropertyRow>
            ) : null}
            {hasEnvironmentOverrides ? (
              <button
                type="button"
                className="mt-1 self-start text-[11px] text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)]"
                onClick={() => updateEnvironmentOverrides(null)}
              >
                Reset environment
              </button>
            ) : null}
          </Section>
        ) : null}

        {architecture ? (
          <Section title={t("editor.architecture")}>
            <p className="mb-1 px-0.5 text-[10px] leading-relaxed text-[color:var(--editor-muted)]">
              Show or hide dressing already in this hall.
            </p>
            {architecture.benches ? (
              <PropertyRow label="Benches">
                <EditorSelect
                  value={
                    gallery?.architectureOverrides?.showBenches === false
                      ? "off"
                      : "on"
                  }
                  onChange={(e) =>
                    updateArchitectureOverrides({
                      showBenches: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">{t("editor.on")}</option>
                  <option value="off">{t("editor.off")}</option>
                </EditorSelect>
              </PropertyRow>
            ) : null}
            {architecture.glbProps?.some((p) => p.model === "plant") ? (
              <PropertyRow label="Plants">
                <EditorSelect
                  value={
                    gallery?.architectureOverrides?.showPlants === false
                      ? "off"
                      : "on"
                  }
                  onChange={(e) =>
                    updateArchitectureOverrides({
                      showPlants: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">{t("editor.on")}</option>
                  <option value="off">{t("editor.off")}</option>
                </EditorSelect>
              </PropertyRow>
            ) : null}
            {architecture.signs ? (
              <PropertyRow label="Signs">
                <EditorSelect
                  value={
                    gallery?.architectureOverrides?.showSigns === false
                      ? "off"
                      : "on"
                  }
                  onChange={(e) =>
                    updateArchitectureOverrides({
                      showSigns: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">{t("editor.on")}</option>
                  <option value="off">{t("editor.off")}</option>
                </EditorSelect>
              </PropertyRow>
            ) : null}
            {architecture.trackLights ? (
              <PropertyRow label={t("editor.tracks")}>
                <EditorSelect
                  value={
                    gallery?.architectureOverrides?.showTracks === false
                      ? "off"
                      : "on"
                  }
                  onChange={(e) =>
                    updateArchitectureOverrides({
                      showTracks: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">{t("editor.on")}</option>
                  <option value="off">{t("editor.off")}</option>
                </EditorSelect>
              </PropertyRow>
            ) : null}
            {architecture.plinths ? (
              <PropertyRow label="Plinths">
                <EditorSelect
                  value={
                    gallery?.architectureOverrides?.showPlinths === false
                      ? "off"
                      : "on"
                  }
                  onChange={(e) =>
                    updateArchitectureOverrides({
                      showPlinths: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">{t("editor.on")}</option>
                  <option value="off">{t("editor.off")}</option>
                </EditorSelect>
              </PropertyRow>
            ) : null}
            {architecture.beams ? (
              <PropertyRow label="Beams">
                <EditorSelect
                  value={
                    gallery?.architectureOverrides?.showBeams === false
                      ? "off"
                      : "on"
                  }
                  onChange={(e) =>
                    updateArchitectureOverrides({
                      showBeams: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">{t("editor.on")}</option>
                  <option value="off">{t("editor.off")}</option>
                </EditorSelect>
              </PropertyRow>
            ) : null}
            {hasArchitectureOverrides ? (
              <button
                type="button"
                className="mt-1 self-start text-[11px] text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)]"
                onClick={() => updateArchitectureOverrides(null)}
              >
                Reset architecture
              </button>
            ) : null}
          </Section>
        ) : null}

        <Section title={t("editor.eveningTour")}>
          <PropertyRow label={t("editor.eveningTourEnabled")}>
            <EditorSelect
              value={gallery?.settings.eveningTour?.enabled ? "on" : "off"}
              onChange={(e) => {
                const enabled = e.target.value === "on";
                const current = gallery?.settings.eveningTour;
                updateGallerySettingsPatch({
                  eveningTour: {
                    enabled,
                    startAt:
                      current?.startAt ??
                      new Date().toISOString().slice(0, 19) + "Z",
                    endAt:
                      current?.endAt ??
                      new Date(Date.now() + 7 * 864e5)
                        .toISOString()
                        .slice(0, 19) + "Z",
                    inviteCode: current?.inviteCode ?? "dusk",
                  },
                });
              }}
            >
              <option value="on">{t("editor.on")}</option>
              <option value="off">{t("editor.off")}</option>
            </EditorSelect>
          </PropertyRow>
          <PropertyRow label={t("editor.eveningStart")}>
            <EditorField
              value={gallery?.settings.eveningTour?.startAt ?? ""}
              placeholder="2026-08-11T18:00:00.000Z"
              onChange={(e) => {
                const current = gallery?.settings.eveningTour;
                updateGallerySettingsPatch({
                  eveningTour: {
                    enabled: current?.enabled ?? false,
                    startAt: e.target.value,
                    endAt: current?.endAt ?? e.target.value,
                    inviteCode: current?.inviteCode ?? null,
                  },
                });
              }}
            />
          </PropertyRow>
          <PropertyRow label={t("editor.eveningEnd")}>
            <EditorField
              value={gallery?.settings.eveningTour?.endAt ?? ""}
              placeholder="2026-08-18T23:00:00.000Z"
              onChange={(e) => {
                const current = gallery?.settings.eveningTour;
                updateGallerySettingsPatch({
                  eveningTour: {
                    enabled: current?.enabled ?? false,
                    startAt: current?.startAt ?? e.target.value,
                    endAt: e.target.value,
                    inviteCode: current?.inviteCode ?? null,
                  },
                });
              }}
            />
          </PropertyRow>
          <PropertyRow label={t("editor.eveningInviteCode")}>
            <EditorField
              value={gallery?.settings.eveningTour?.inviteCode ?? ""}
              placeholder="dusk"
              onChange={(e) => {
                const current = gallery?.settings.eveningTour;
                updateGallerySettingsPatch({
                  eveningTour: {
                    enabled: current?.enabled ?? false,
                    startAt:
                      current?.startAt ?? new Date().toISOString(),
                    endAt: current?.endAt ?? new Date().toISOString(),
                    inviteCode: e.target.value || null,
                  },
                });
              }}
            />
          </PropertyRow>
          {gallery?.settings.eveningTour?.inviteCode ? (
            <button
              type="button"
              className="mt-1 self-start text-[11px] text-[color:var(--editor-muted)] hover:text-[color:var(--editor-foreground)]"
              onClick={() => {
                const code = gallery.settings.eveningTour?.inviteCode;
                if (!code || typeof window === "undefined") return;
                const url = `${window.location.origin}/g/${gallery.slug}?evening=${encodeURIComponent(code)}`;
                void navigator.clipboard.writeText(url);
              }}
            >
              {t("editor.copyEveningInvite")}
            </button>
          ) : null}
        </Section>

        {!artwork ? (
          <p className="px-1 py-6 text-center text-xs leading-relaxed text-[color:var(--editor-muted)]">
            {artworks.length === 0
              ? t("editor.hangHint")
              : t("editor.selectHint")}
          </p>
        ) : (
          <>
            <div
              aria-hidden
              className="h-px w-full bg-[color:var(--editor-border)]"
            />
            <Section title={t("editor.details")}>
              <PropertyRow label={t("editor.title")}>
                <EditorField
                  value={artwork.title}
                  onChange={(e) =>
                    updateArtwork(
                      artwork.id,
                      { title: e.target.value },
                      "Rename",
                    )
                  }
                />
              </PropertyRow>
              <PropertyRow label={t("editor.year")}>
                <EditorField
                  type="number"
                  value={artwork.year ?? ""}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      year:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </PropertyRow>
              <PropertyRow label={t("editor.medium")}>
                <EditorField
                  value={artwork.medium ?? ""}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      medium: e.target.value || null,
                    })
                  }
                />
              </PropertyRow>
              <PropertyRow label={t("editor.category")}>
                <EditorField
                  value={artwork.category ?? ""}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      category: e.target.value || null,
                    })
                  }
                />
              </PropertyRow>
              <div className="grid grid-cols-[88px_1fr] gap-2 text-xs">
                <span className="pt-2 text-[color:var(--editor-muted)]">
                  Description
                </span>
                <EditorTextarea
                  value={artwork.description}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </Section>

            <Section title={t("editor.sizePrice")}>
              {showSizeSuggest && sizeSuggestion ? (
                <div className="mb-3 border border-[color:var(--editor-border)] bg-black/20 px-2.5 py-2">
                  <p className="text-[10px] leading-relaxed text-[color:var(--editor-muted)]">
                    {t("editor.aiSizeHint", {
                      size: `${sizeSuggestion.width} × ${sizeSuggestion.height} ${sizeSuggestion.unit}`,
                    })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="border border-white/15 bg-white/10 px-2 py-1 text-[10px] tracking-wide text-white/85 hover:bg-white/15"
                      onClick={() => {
                        if (!artwork || !sizeSuggestion) return;
                        updateArtwork(artwork.id, {
                          dimensions: sizeSuggestion,
                        });
                        toast.message(t("editor.aiSizeApplied"));
                      }}
                    >
                      {t("editor.aiApplySize")}
                    </button>
                  </div>
                </div>
              ) : null}
              <PropertyRow label={t("editor.width")}>
                <EditorField
                  type="number"
                  value={artwork.dimensions.width}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      dimensions: createDimensions(
                        Number(e.target.value) || 1,
                        artwork.dimensions.height,
                        artwork.dimensions.unit,
                        artwork.dimensions.depth,
                      ),
                    })
                  }
                />
              </PropertyRow>
              <PropertyRow label={t("editor.height")}>
                <EditorField
                  type="number"
                  value={artwork.dimensions.height}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      dimensions: createDimensions(
                        artwork.dimensions.width,
                        Number(e.target.value) || 1,
                        artwork.dimensions.unit,
                        artwork.dimensions.depth,
                      ),
                    })
                  }
                />
              </PropertyRow>
              <PropertyRow label={t("editor.unit")}>
                <EditorSelect
                  value={artwork.dimensions.unit}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      dimensions: createDimensions(
                        artwork.dimensions.width,
                        artwork.dimensions.height,
                        e.target.value === "in" ? "in" : "cm",
                        artwork.dimensions.depth,
                      ),
                    })
                  }
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </EditorSelect>
              </PropertyRow>
              <PropertyRow label={t("editor.price")}>
                <EditorField
                  value={artwork.price?.amount ?? ""}
                  placeholder="0"
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (!raw) {
                      updateArtwork(artwork.id, { price: null });
                      return;
                    }
                    try {
                      updateArtwork(artwork.id, {
                        price: createMoney(
                          raw,
                          artwork.price?.currency ?? "USD",
                        ),
                      });
                    } catch {
                      // ignore invalid mid-typing
                    }
                  }}
                />
              </PropertyRow>
              <PropertyRow label={t("editor.status")}>
                <EditorSelect
                  value={artwork.availability}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      availability: e.target.value as Availability,
                    })
                  }
                >
                  {(Object.keys(AVAILABILITY_KEYS) as Availability[]).map(
                    (value) => (
                      <option key={value} value={value}>
                        {t(AVAILABILITY_KEYS[value])}
                      </option>
                    ),
                  )}
                </EditorSelect>
              </PropertyRow>
            </Section>

            <Section title={t("editor.frame")}>
              {showFrameSuggest && frameSuggestion ? (
                <div className="mb-3 border border-[color:var(--editor-border)] bg-black/20 px-2.5 py-2">
                  <p className="text-[10px] leading-relaxed text-[color:var(--editor-muted)]">
                    {t(
                      `editor.aiFrame_${frameSuggestion.reasonKey}` as MessageKey,
                    )}
                  </p>
                  <button
                    type="button"
                    className="mt-2 border border-white/15 bg-white/10 px-2 py-1 text-[10px] tracking-wide text-white/85 hover:bg-white/15"
                    onClick={() => {
                      if (!artwork || !frameSuggestion) return;
                      updateArtwork(artwork.id, {
                        frame: frameSuggestion.frame,
                      });
                      toast.message(t("editor.aiFrameApplied"));
                    }}
                  >
                    {t("editor.aiApplyFrame")}
                  </button>
                </div>
              ) : null}
              <PropertyRow label={t("editor.style")}>
                <EditorSelect
                  value={artwork.frame.style}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      frame: createFrameSpec({
                        ...artwork.frame,
                        style: e.target.value as (typeof FRAME_STYLES)[number],
                      }),
                    })
                  }
                >
                  {FRAME_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {t(FRAME_STYLE_KEYS[style])}
                    </option>
                  ))}
                </EditorSelect>
              </PropertyRow>
              <PropertyRow label={t("editor.colour")}>
                <EditorField
                  type="color"
                  value={artwork.frame.color}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      frame: createFrameSpec({
                        ...artwork.frame,
                        color: e.target.value,
                      }),
                    })
                  }
                />
              </PropertyRow>
              <PropertyRow label="Width cm">
                <EditorField
                  type="number"
                  step="0.5"
                  value={artwork.frame.widthCm}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      frame: createFrameSpec({
                        ...artwork.frame,
                        widthCm: Number(e.target.value) || 0,
                      }),
                    })
                  }
                />
              </PropertyRow>
              <PropertyRow label="Matte cm">
                <EditorField
                  type="number"
                  step="0.5"
                  value={artwork.frame.matteCm}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      frame: createFrameSpec({
                        ...artwork.frame,
                        matteCm: Number(e.target.value) || 0,
                      }),
                    })
                  }
                />
              </PropertyRow>
              <PropertyRow label={t("editor.matteColour")}>
                <EditorField
                  type="color"
                  value={artwork.frame.matteColor}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      frame: createFrameSpec({
                        ...artwork.frame,
                        matteColor: e.target.value,
                      }),
                    })
                  }
                />
              </PropertyRow>
            </Section>

            <Section title={t("editor.placement")}>
              <p className="mb-1 px-0.5 text-[10px] leading-relaxed text-[color:var(--editor-muted)]">
                Drag on the canvas, or set offset / height precisely. Eye-line is{" "}
                {EYE_LINE_M.toFixed(2)} m.
              </p>
              <PropertyRow label={t("editor.wall")}>
                <EditorSelect
                  value={artwork.placement.wallId}
                  disabled={Boolean(artwork.placement.locked)}
                  onChange={(e) => {
                    const wall = template?.walls.find(
                      (w) => w.id === e.target.value,
                    );
                    if (!wall) return;
                    const currentWall = findWall(
                      template?.walls ?? [],
                      artwork.placement.wallId,
                    );
                    const coords = currentWall
                      ? wallCoords(currentWall, artwork.placement.position)
                      : { along: 0, height: EYE_LINE_M };
                    moveArtwork(
                      artwork.id,
                      {
                        ...buildPlacementOnWall({
                          wall,
                          along: coords.along,
                          height: coords.height,
                          scale: artwork.placement.scale,
                          snapToAnchors: false,
                        }),
                        locked: artwork.placement.locked,
                      },
                      "Change wall",
                    );
                  }}
                >
                  {template?.walls.map((wall) => (
                    <option key={wall.id} value={wall.id}>
                      {wall.label}
                    </option>
                  ))}
                </EditorSelect>
              </PropertyRow>
              {(() => {
                const wall = findWall(
                  template?.walls ?? [],
                  artwork.placement.wallId,
                );
                if (!wall) return null;
                const { along, height } = wallCoords(
                  wall,
                  artwork.placement.position,
                );
                const locked = Boolean(artwork.placement.locked);
                return (
                  <>
                    <PropertyRow label="Along m">
                      <EditorField
                        type="number"
                        step="0.05"
                        disabled={locked}
                        value={Number(along.toFixed(2))}
                        onChange={(e) => {
                          const nextAlong = Number(e.target.value);
                          if (Number.isNaN(nextAlong)) return;
                          moveArtwork(
                            artwork.id,
                            {
                              ...buildPlacementOnWall({
                                wall,
                                along: nextAlong,
                                height,
                                scale: artwork.placement.scale,
                                snapToAnchors,
                              }),
                              locked: artwork.placement.locked,
                            },
                            "Offset along wall",
                          );
                        }}
                      />
                    </PropertyRow>
                    <PropertyRow label="Height m">
                      <EditorField
                        type="number"
                        step="0.05"
                        min="0.25"
                        disabled={locked}
                        value={Number(height.toFixed(2))}
                        onChange={(e) => {
                          const nextHeight = Number(e.target.value);
                          if (Number.isNaN(nextHeight)) return;
                          moveArtwork(
                            artwork.id,
                            {
                              ...buildPlacementOnWall({
                                wall,
                                along,
                                height: nextHeight,
                                scale: artwork.placement.scale,
                                snapToAnchors,
                              }),
                              locked: artwork.placement.locked,
                            },
                            "Set height",
                          );
                        }}
                      />
                    </PropertyRow>
                    <PropertyRow label="Height cm">
                      <EditorField
                        type="number"
                        step="1"
                        disabled={locked}
                        value={Math.round(height * 100)}
                        onChange={(e) => {
                          const cm = Number(e.target.value);
                          if (Number.isNaN(cm)) return;
                          moveArtwork(
                            artwork.id,
                            {
                              ...buildPlacementOnWall({
                                wall,
                                along,
                                height: cm / 100,
                                scale: artwork.placement.scale,
                                snapToAnchors,
                              }),
                              locked: artwork.placement.locked,
                            },
                            "Set height",
                          );
                        }}
                      />
                    </PropertyRow>
                  </>
                );
              })()}
              <PropertyRow label={t("editor.scale")}>
                <EditorField
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="2"
                  disabled={Boolean(artwork.placement.locked)}
                  value={artwork.placement.scale}
                  onChange={(e) =>
                    moveArtwork(artwork.id, {
                      ...artwork.placement,
                      scale: Number(e.target.value) || 1,
                      autoPlaced: false,
                    })
                  }
                />
              </PropertyRow>
              <PropertyRow label="Yaw°">
                <EditorField
                  type="number"
                  step="1"
                  disabled={Boolean(artwork.placement.locked)}
                  value={Math.round(
                    (artwork.placement.rotation[1] * 180) / Math.PI,
                  )}
                  onChange={(e) => {
                    const deg = Number(e.target.value) || 0;
                    moveArtwork(artwork.id, {
                      ...artwork.placement,
                      rotation: [
                        artwork.placement.rotation[0],
                        (deg * Math.PI) / 180,
                        artwork.placement.rotation[2],
                      ],
                      autoPlaced: false,
                    });
                  }}
                />
              </PropertyRow>
              <PropertyRow label={t("editor.snap")}>
                <EditorSelect
                  value={snapToAnchors ? "on" : "off"}
                  onChange={(e) => setSnapToAnchors(e.target.value === "on")}
                >
                  <option value="on">Anchors</option>
                  <option value="off">Free</option>
                </EditorSelect>
              </PropertyRow>
              <PropertyRow label={t("editor.lock")}>
                <EditorSelect
                  value={artwork.placement.locked ? "on" : "off"}
                  onChange={(e) =>
                    moveArtwork(
                      artwork.id,
                      {
                        ...artwork.placement,
                        locked: e.target.value === "on",
                        autoPlaced: false,
                      },
                      e.target.value === "on" ? "Lock position" : "Unlock",
                    )
                  }
                >
                  <option value="off">{t("editor.off")}</option>
                  <option value="on">{t("editor.locked")}</option>
                </EditorSelect>
              </PropertyRow>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <ToolLink
                  label={t("editor.eyeLine")}
                  disabled={Boolean(artwork.placement.locked)}
                  onClick={() => {
                    const wall = findWall(
                      template?.walls ?? [],
                      artwork.placement.wallId,
                    );
                    if (!wall) return;
                    moveArtwork(
                      artwork.id,
                      alignPlacementToEyeLine(wall, artwork.placement),
                      "Align eye-line",
                    );
                  }}
                />
                <ToolLink
                  label={t("editor.distributeWall")}
                  onClick={() => {
                    const wall = findWall(
                      template?.walls ?? [],
                      artwork.placement.wallId,
                    );
                    if (!wall) return;
                    const next = distributePlacementsOnWall({
                      wall,
                      artworks,
                    });
                    const moves = [...next.entries()].map(
                      ([artworkId, after]) => ({ artworkId, after }),
                    );
                    moveArtworksBatch(moves, "Distribute on wall");
                  }}
                />
                <ToolLink
                  label="Duplicate"
                  onClick={() => duplicateArtwork(artwork.id)}
                />
                <ToolLink
                  label="Bring forward"
                  onClick={() => bringArtworkForward(artwork.id)}
                />
              </div>
              {artwork.placement.anchorIndex != null ? (
                <p className="mt-1 text-[10px] text-[color:var(--editor-muted)]">
                  On anchor {artwork.placement.anchorIndex + 1}
                  {artwork.placement.autoPlaced ? " · auto" : " · manual"}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-[color:var(--editor-muted)]">
                  Free placement
                  {artwork.placement.autoPlaced ? "" : " · manual"}
                </p>
              )}
            </Section>

            <Section title={t("editor.light")}>
              <PropertyRow label={t("editor.spot")}>
                <EditorSelect
                  value={artwork.lighting.enabled ? "on" : "off"}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      lighting: {
                        ...artwork.lighting,
                        enabled: e.target.value === "on",
                      },
                    })
                  }
                >
                  <option value="on">{t("editor.on")}</option>
                  <option value="off">{t("editor.off")}</option>
                </EditorSelect>
              </PropertyRow>
              <PropertyRow label={t("editor.intensity")}>
                <EditorField
                  type="number"
                  step="0.1"
                  value={artwork.lighting.intensity}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      lighting: {
                        ...artwork.lighting,
                        intensity: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </PropertyRow>
              <PropertyRow label="Kelvin">
                <EditorField
                  type="number"
                  step="100"
                  value={artwork.lighting.temperatureK}
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      lighting: {
                        ...artwork.lighting,
                        temperatureK: Number(e.target.value) || 4000,
                      },
                    })
                  }
                />
              </PropertyRow>
            </Section>

            <Section title={t("editor.innerWorld")}>
              <PropertyRow label={t("editor.voiceNoteUrl")}>
                <EditorField
                  value={artwork.media.audioUrl ?? ""}
                  placeholder="https://…"
                  onChange={(e) =>
                    updateArtwork(artwork.id, {
                      media: {
                        ...artwork.media,
                        audioUrl: e.target.value.trim() || null,
                      },
                    })
                  }
                />
              </PropertyRow>
              <PropertyRow label={t("editor.innerWorldType")}>
                <EditorSelect
                  value={artwork.media.innerWorld?.type ?? "none"}
                  onChange={(e) => {
                    const type = e.target.value;
                    if (type === "none") {
                      updateArtwork(artwork.id, {
                        media: { ...artwork.media, innerWorld: null },
                      });
                      return;
                    }
                    if (type === "text") {
                      updateArtwork(artwork.id, {
                        media: {
                          ...artwork.media,
                          innerWorld: {
                            type: "text",
                            title: artwork.title,
                            body: artwork.description || "",
                          },
                        },
                      });
                      return;
                    }
                    if (type === "video") {
                      updateArtwork(artwork.id, {
                        media: {
                          ...artwork.media,
                          innerWorld: {
                            type: "video",
                            url: artwork.media.videoUrl ?? "",
                            title: artwork.title,
                          },
                        },
                      });
                      return;
                    }
                    updateArtwork(artwork.id, {
                      media: {
                        ...artwork.media,
                        innerWorld: {
                          type: "room",
                          title: artwork.title,
                          body: "",
                          href: "",
                        },
                      },
                    });
                  }}
                >
                  <option value="none">{t("editor.innerWorldNone")}</option>
                  <option value="text">{t("editor.innerWorldText")}</option>
                  <option value="video">{t("editor.innerWorldVideo")}</option>
                  <option value="room">{t("editor.innerWorldRoom")}</option>
                </EditorSelect>
              </PropertyRow>
              {artwork.media.innerWorld ? (
                <>
                  <PropertyRow label={t("editor.innerWorldTitle")}>
                    <EditorField
                      value={
                        artwork.media.innerWorld.type === "text"
                          ? artwork.media.innerWorld.title
                          : artwork.media.innerWorld.title ?? ""
                      }
                      onChange={(e) => {
                        const world = artwork.media.innerWorld;
                        if (!world) return;
                        if (world.type === "text") {
                          updateArtwork(artwork.id, {
                            media: {
                              ...artwork.media,
                              innerWorld: { ...world, title: e.target.value },
                            },
                          });
                        } else {
                          updateArtwork(artwork.id, {
                            media: {
                              ...artwork.media,
                              innerWorld: { ...world, title: e.target.value },
                            },
                          });
                        }
                      }}
                    />
                  </PropertyRow>
                  {artwork.media.innerWorld.type === "text" ? (
                    <div className="grid grid-cols-[88px_1fr] gap-2 text-xs">
                      <span className="pt-2 text-[color:var(--editor-muted)]">
                        {t("editor.innerWorldBody")}
                      </span>
                      <EditorTextarea
                        value={artwork.media.innerWorld.body}
                        onChange={(e) => {
                          const world = artwork.media.innerWorld;
                          if (!world || world.type !== "text") return;
                          updateArtwork(artwork.id, {
                            media: {
                              ...artwork.media,
                              innerWorld: { ...world, body: e.target.value },
                            },
                          });
                        }}
                      />
                    </div>
                  ) : null}
                  {artwork.media.innerWorld.type === "video" ? (
                    <PropertyRow label={t("editor.innerWorldUrl")}>
                      <EditorField
                        value={artwork.media.innerWorld.url}
                        onChange={(e) => {
                          const world = artwork.media.innerWorld;
                          if (!world || world.type !== "video") return;
                          updateArtwork(artwork.id, {
                            media: {
                              ...artwork.media,
                              innerWorld: { ...world, url: e.target.value },
                            },
                          });
                        }}
                      />
                    </PropertyRow>
                  ) : null}
                  {artwork.media.innerWorld.type === "room" ? (
                    <>
                      <PropertyRow label={t("editor.innerWorldUrl")}>
                        <EditorField
                          value={artwork.media.innerWorld.href ?? ""}
                          placeholder="/demo/harbor"
                          onChange={(e) => {
                            const world = artwork.media.innerWorld;
                            if (!world || world.type !== "room") return;
                            updateArtwork(artwork.id, {
                              media: {
                                ...artwork.media,
                                innerWorld: {
                                  ...world,
                                  href: e.target.value || undefined,
                                },
                              },
                            });
                          }}
                        />
                      </PropertyRow>
                      <div className="grid grid-cols-[88px_1fr] gap-2 text-xs">
                        <span className="pt-2 text-[color:var(--editor-muted)]">
                          {t("editor.innerWorldBody")}
                        </span>
                        <EditorTextarea
                          value={artwork.media.innerWorld.body ?? ""}
                          onChange={(e) => {
                            const world = artwork.media.innerWorld;
                            if (!world || world.type !== "room") return;
                            updateArtwork(artwork.id, {
                              media: {
                                ...artwork.media,
                                innerWorld: {
                                  ...world,
                                  body: e.target.value || undefined,
                                },
                              },
                            });
                          }}
                        />
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="truncate border-b border-[color:var(--editor-border)] px-3 py-2.5">
      <p className="text-[10px] font-medium tracking-[0.18em] text-[color:var(--editor-brass)]/75 uppercase">
        Curate
      </p>
      <p className="mt-0.5 truncate font-serif text-sm tracking-tight text-[color:var(--editor-foreground)]">
        {title}
      </p>
    </div>
  );
}

function ToolLink({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border border-[color:var(--editor-border)] bg-black/25 px-2 py-1 text-[10px] tracking-wide text-[color:var(--editor-muted)] uppercase transition-colors hover:border-[color:var(--editor-brass)]/40 hover:text-[color:var(--editor-foreground)] disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 border border-[color:var(--editor-border)] bg-[color:var(--editor-bg)]/50 p-2.5">
      <h3 className="text-[10px] font-medium tracking-[0.16em] text-[color:var(--editor-muted)] uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** `<input type="color">` requires #rrggbb. */
function toColorInputValue(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#f7f6f2";
}

function clamp01(value: number): number {
  return clampRange(value, 0, 1);
}

function clampRange(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
