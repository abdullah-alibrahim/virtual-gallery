import type { SceneArtwork, SceneTemplate } from "@/core/entities";
import { createDimensions } from "@/core/value-objects/dimensions";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

const DEMO_TEXTURES = [
  "/demo/artworks/01.jpg",
  "/demo/artworks/02.jpg",
  "/demo/artworks/03.jpg",
  "/demo/artworks/04.jpg",
  "/demo/artworks/05.jpg",
  "/demo/artworks/06.jpg",
  "/demo/artworks/07.jpg",
  "/demo/artworks/08.jpg",
  "/demo/artworks/09.jpg",
] as const;

const ASPECTS = [
  [180, 140],
  [160, 200],
  [190, 145],
  [150, 150],
  [170, 120],
  [130, 185],
  [145, 175],
  [165, 125],
  [155, 155],
] as const;

/**
 * Hang demo textures on a template’s preferred anchors for marketing previews.
 * Pure — no React / WebGL. Prefer north-wall preferred anchors first.
 */
export function buildMarketingPreviewArtworks(
  template: SceneTemplate,
  max = 6,
): SceneArtwork[] {
  const frame = createFrameSpec({
    style: template.frameDefaults.style,
    color: template.frameDefaults.color,
    widthCm: Math.max(template.frameDefaults.widthCm, 3.5),
    matteCm: Math.max(template.frameDefaults.matteCm, 6),
    matteColor: template.frameDefaults.matteColor,
  });

  const slots = collectSlots(template).slice(0, max);
  const preset = template.lighting.presets[0];

  return slots.map((slot, index) => {
    const aspect = ASPECTS[index % ASPECTS.length]!;
    const url = DEMO_TEXTURES[index % DEMO_TEXTURES.length]!;
    const maxW = slot.anchor.maxWidth * 100;
    const maxH = slot.anchor.maxHeight * 100;
    const scale = Math.min(1, (maxW * 0.9) / aspect[0], (maxH * 0.9) / aspect[1]);
    const w = Math.round(aspect[0] * scale);
    const h = Math.round(aspect[1] * scale);
    const yaw = Math.atan2(slot.wall.normal[0], slot.wall.normal[2]);
    const position: [number, number, number] = [
      slot.wall.origin[0] + slot.anchor.position[0],
      slot.wall.origin[1] + slot.anchor.position[1],
      slot.wall.origin[2] + slot.anchor.position[2],
    ];

    return {
      id: `preview-${template.id}-${index}`,
      title: `Study ${index + 1}`,
      description: "",
      year: 2025,
      medium: "Oil",
      dimensions: createDimensions(w, h, "cm"),
      availability: "available" as const,
      frame,
      placement: {
        position,
        rotation: [0, yaw, 0] as const,
        scale: 1,
      },
      lighting: {
        enabled: true,
        intensity: (preset?.spotIntensity ?? 1.08) * 1.05,
        angle: 0.46,
        temperatureK: preset?.temperatureK ?? 4300,
      },
      textures: {
        lod0: url,
        lod1: url,
        lod2: url,
      },
      meta: {
        aspectRatio: w / h,
        blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
      },
    };
  });
}

function collectSlots(template: SceneTemplate) {
  const preferred: {
    wall: SceneTemplate["walls"][number];
    anchor: SceneTemplate["walls"][number]["anchors"][number];
  }[] = [];
  const rest: typeof preferred = [];

  for (const wall of template.walls) {
    for (const anchor of wall.anchors) {
      const entry = { wall, anchor };
      if (anchor.preferred) preferred.push(entry);
      else rest.push(entry);
    }
  }

  // Prefer north-ish walls (looking toward -Z) first for frontal previews.
  const score = (wall: SceneTemplate["walls"][number]) =>
    wall.normal[2] > 0.5 ? 0 : wall.id === "north" ? 0 : 1;

  preferred.sort((a, b) => score(a.wall) - score(b.wall));
  rest.sort((a, b) => score(a.wall) - score(b.wall));
  return [...preferred, ...rest];
}
