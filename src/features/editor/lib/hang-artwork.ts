import type { Artwork, SceneTemplate } from "@/core/entities";
import { arrangeArtworks } from "@/core/services/arrange-artworks";
import { getIsmailWorkByAssetId } from "@/core/samples/ismail-rifai";
import { getSamplePaintingByAssetId } from "@/core/samples/sample-paintings";
import { createDimensions } from "@/core/value-objects/dimensions";
import { createFrameSpec } from "@/core/value-objects/frame-spec";
import type { AssetListItem } from "@/infrastructure/firebase/assets-client";

/**
 * Builds a new Artwork hung on the next free anchor via `arrangeArtworks`.
 * Returns null when the template is full.
 */
export function hangAssetAsArtwork(input: {
  asset: AssetListItem;
  galleryId: string;
  workspaceId: string;
  template: SceneTemplate;
  existing: readonly Artwork[];
  /** Template lighting preset id; falls back to first preset. */
  lightingPresetId?: string;
}): Artwork | null {
  const sample =
    getSamplePaintingByAssetId(input.asset.id) ??
    getIsmailWorkByAssetId(input.asset.id);
  // Default hang height ~1.2 m so new works read as exhibition pieces,
  // not postcard stamps on large museum walls.
  const heightCm = 120;
  const widthCm =
    input.asset.width && input.asset.height
      ? Math.round((input.asset.width / input.asset.height) * heightCm)
      : 120;

  const preset =
    input.template.lighting.presets.find(
      (p) => p.id === input.lightingPresetId,
    ) ?? input.template.lighting.presets[0];

  const draft: Artwork = {
    id: crypto.randomUUID(),
    galleryId: input.galleryId,
    workspaceId: input.workspaceId,
    assetId: input.asset.id,
    order: input.existing.length,
    title: sample?.title ?? titleFromFileName(input.asset.fileName),
    description: "",
    year: sample?.year ?? new Date().getFullYear(),
    medium: sample?.medium ?? null,
    category: null,
    dimensions: createDimensions(widthCm, heightCm, "cm"),
    price: null,
    availability: "available",
    frame: input.template.frameDefaults,
    placement: {
      wallId: input.template.walls[0]?.id ?? "north",
      anchorIndex: null,
      position: [0, 1.6, 0],
      rotation: [0, 0, 0],
      scale: 1,
      autoPlaced: true,
    },
    lighting: {
      enabled: true,
      intensity: preset?.spotIntensity ?? 1.15,
      angle: Math.PI / 6.5,
      temperatureK: preset?.temperatureK ?? 4300,
    },
    media: {
      audioAssetId: null,
      videoUrl: null,
      hotspot: { enabled: true, offset: [0, 0, 0.08] },
    },
    commerce: { externalUrl: null, allowInquiries: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Lock existing anchor assignments — arrange would otherwise reshuffle all
  // auto-placed works by size, but we only apply the draft's proposal. Without
  // this, a larger new work steals a preferred slot still occupied on-screen.
  const result = arrangeArtworks({
    artworks: [...input.existing, draft],
    template: input.template,
    preserveAssigned: true,
  });

  const placement = result.placements.find((p) => p.artworkId === draft.id);
  if (!placement) return null;

  return {
    ...draft,
    placement: {
      wallId: placement.wallId,
      anchorIndex: placement.anchorIndex,
      position: placement.position,
      rotation: placement.rotation,
      scale: placement.scale,
      autoPlaced: true,
    },
    lighting: {
      ...draft.lighting,
      intensity: placement.lighting.intensity,
      angle: placement.lighting.angle,
      temperatureK: placement.lighting.temperatureK,
    },
    frame: createFrameSpec({
      style: input.template.frameDefaults.style,
      color: input.template.frameDefaults.color,
      widthCm: input.template.frameDefaults.widthCm,
      matteCm: input.template.frameDefaults.matteCm,
      matteColor: input.template.frameDefaults.matteColor,
    }),
  };
}

function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[-_]+/g, " ").trim();
  if (!cleaned) return "Untitled";
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 80);
}
