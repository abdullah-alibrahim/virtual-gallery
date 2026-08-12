import type { SceneArtwork, SceneTemplate } from "@/core/entities";
import { estimateExhibitionDimensions } from "@/core/services/artwork-ai-assist";
import { createDimensions } from "@/core/value-objects/dimensions";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

import {
  DEMO_ARTWORK_PIXELS,
  demoArtworkUrl,
} from "./demo-artwork-pixels";

/** Long-edge centimetres — size variety without inventing a fake aspect. */
const LONG_EDGES_CM = [148, 128, 156, 132, 142, 138, 160, 150, 136] as const;

/**
 * Hang demo textures on a template’s preferred anchors for marketing previews.
 * Frame follows the JPEG’s pixel aspect — never a forced square or stretch.
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
    const file = DEMO_ARTWORK_PIXELS[index % DEMO_ARTWORK_PIXELS.length]!;
    const url = demoArtworkUrl(file.file);
    const long = LONG_EDGES_CM[index % LONG_EDGES_CM.length]!;
    const suggested = estimateExhibitionDimensions(
      file.widthPx,
      file.heightPx,
      long,
    );
    const maxW = slot.anchor.maxWidth * 100;
    const maxH = slot.anchor.maxHeight * 100;
    const scale = Math.min(
      1,
      (maxW * 0.9) / suggested.width,
      (maxH * 0.9) / suggested.height,
    );
    const w = Math.round(suggested.width * scale);
    const h = Math.round(suggested.height * scale);
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
        aspectRatio: file.widthPx / file.heightPx,
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
