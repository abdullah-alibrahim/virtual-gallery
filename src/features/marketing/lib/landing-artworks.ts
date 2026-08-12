import type { SceneArtwork } from "@/core/entities";
import { estimateExhibitionDimensions } from "@/core/services/artwork-ai-assist";
import { softMuseumTemplate } from "@/core/templates";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

import { demoArtworkPixels } from "./demo-artwork-pixels";

/**
 * Soft Museum exhibition for the landing hero — oversized framed paintings
 * on the show walls so the first glance reads as a filled gallery, not a shell.
 * Frame follows each JPEG’s pixel aspect.
 */
export function buildLandingArtworks(): SceneArtwork[] {
  const tex = (file: string) => `/demo/artworks/${file}`;
  const frame = softMuseumTemplate.frameDefaults;
  const thick = createFrameSpec({
    style: frame.style,
    color: frame.color,
    widthCm: Math.max(frame.widthCm, 4),
    matteCm: Math.max(frame.matteCm, 8),
    matteColor: frame.matteColor,
  });

  return [
    piece({
      id: "hero-dawn",
      title: "The Starry Night",
      longEdgeCm: 195,
      position: [-3.25, 1.68, -5.16],
      rotation: [0, 0, 0],
      url: tex("01.jpg"),
      frame: thick,
      light: 1.55,
    }),
    piece({
      id: "hero-orbit",
      title: "Self-Portrait",
      longEdgeCm: 220,
      position: [0, 1.78, -5.16],
      rotation: [0, 0, 0],
      url: tex("02.jpg"),
      frame: thick,
      light: 1.65,
    }),
    piece({
      id: "hero-red",
      title: "The Great Wave",
      longEdgeCm: 190,
      position: [3.25, 1.68, -5.16],
      rotation: [0, 0, 0],
      url: tex("03.jpg"),
      frame: thick,
      light: 1.55,
    }),
    piece({
      id: "hero-gold",
      title: "Water Lilies",
      longEdgeCm: 162,
      position: [5.29, 1.68, -2.55],
      rotation: [0, -Math.PI / 2, 0],
      url: tex("04.jpg"),
      frame: thick,
      light: 1.4,
    }),
    piece({
      id: "hero-harbour",
      title: "The Fighting Temeraire",
      longEdgeCm: 170,
      position: [5.29, 1.62, 2.55],
      rotation: [0, -Math.PI / 2, 0],
      url: tex("06.jpg"),
      frame: thick,
      light: 1.3,
    }),
    piece({
      id: "hero-green",
      title: "A Pair of Shoes",
      longEdgeCm: 192,
      position: [-5.29, 1.72, -2.55],
      rotation: [0, Math.PI / 2, 0],
      url: tex("05.jpg"),
      frame: thick,
      light: 1.4,
    }),
    piece({
      id: "hero-ink",
      title: "Arrangement in Flesh Colour and Black",
      longEdgeCm: 170,
      position: [-5.29, 1.66, 2.55],
      rotation: [0, Math.PI / 2, 0],
      url: tex("07.jpg"),
      frame: thick,
      light: 1.3,
    }),
    piece({
      id: "hero-horizon",
      title: "Trees and Houses Near the Jas de Bouffan",
      longEdgeCm: 168,
      position: [-2.4, 1.62, 5.16],
      rotation: [0, Math.PI, 0],
      url: tex("08.jpg"),
      frame: thick,
      light: 1.2,
    }),
  ];
}

function piece(input: {
  id: string;
  title: string;
  longEdgeCm: number;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  url: string;
  frame: ReturnType<typeof createFrameSpec>;
  light: number;
}): SceneArtwork {
  const pixels = demoArtworkPixels(input.url);
  const dimensions = estimateExhibitionDimensions(
    pixels.widthPx,
    pixels.heightPx,
    input.longEdgeCm,
  );
  return {
    id: input.id,
    title: input.title,
    description: "",
    year: 2025,
    medium: "Oil",
    dimensions,
    availability: "available",
    frame: input.frame,
    placement: {
      position: input.position,
      rotation: input.rotation,
      scale: 1,
    },
    lighting: {
      enabled: true,
      intensity: input.light,
      angle: 0.48,
      temperatureK: 4050,
    },
    textures: {
      lod0: input.url,
      lod1: input.url,
      lod2: input.url,
    },
    meta: {
      aspectRatio: pixels.widthPx / pixels.heightPx,
      blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
    },
  };
}
