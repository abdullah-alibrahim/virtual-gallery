import type { SceneArtwork, SceneManifest } from "@/core/entities";
import { estimateExhibitionDimensions } from "@/core/services/artwork-ai-assist";
import { modernWhiteTemplate } from "@/core/templates";
import { createFrameSpec } from "@/core/value-objects/frame-spec";
import { createMoney } from "@/core/value-objects/money";
import { toSlug } from "@/core/value-objects/slug";
import { demoArtworkPixels } from "@/features/marketing/lib/demo-artwork-pixels";

/**
 * Walkable Modern White demo — nine large paintings filling every hang anchor.
 */
export function buildDemoManifest(
  _siteUrl = "http://localhost:3000",
): SceneManifest {
  // Relative same-origin paths — absolute site URLs break WebGL textures when
  // the page is opened via 127.0.0.1 (or any host ≠ NEXT_PUBLIC_SITE_URL).
  const tex = (file: string) => `/demo/artworks/${file}`;
  const gallery = createFrameSpec({
    style: "gallery",
    color: "#1a1a1a",
    widthCm: 3.5,
    matteCm: 7,
    matteColor: "#f5f2ea",
  });
  const thin = createFrameSpec({
    style: "gallery",
    color: "#1a1a1a",
    widthCm: 2.4,
    matteCm: 4,
    matteColor: "#f5f2ea",
  });

  const artworks: SceneArtwork[] = [
    // North wall — three large works
    piece({
      id: "starry-night",
      title: "The Starry Night",
      year: 1889,
      medium: "Oil on canvas",
      longEdgeCm: 180,
      position: [-3.2, 1.65, -4.96],
      rotation: [0, 0, 0],
      url: tex("01.jpg"),
      frame: gallery,
      price: createMoney("4200", "USD"),
    }),
    piece({
      id: "self-portrait",
      title: "Self-Portrait",
      year: 1660,
      medium: "Oil on canvas",
      longEdgeCm: 200,
      position: [0, 1.7, -4.96],
      rotation: [0, 0, 0],
      url: tex("02.jpg"),
      frame: gallery,
      price: createMoney("3800", "USD"),
    }),
    piece({
      id: "great-wave",
      title: "The Great Wave off Kanagawa",
      year: 1831,
      medium: "Woodblock print",
      longEdgeCm: 190,
      position: [3.2, 1.65, -4.96],
      rotation: [0, 0, 0],
      url: tex("03.jpg"),
      frame: gallery,
    }),
    // East wall
    piece({
      id: "water-lilies",
      title: "Water Lilies",
      year: 1906,
      medium: "Oil on canvas",
      longEdgeCm: 150,
      position: [4.96, 1.65, -2.5],
      rotation: [0, -Math.PI / 2, 0],
      url: tex("04.jpg"),
      frame: thin,
    }),
    piece({
      id: "fighting-temeraire",
      title: "The Fighting Temeraire",
      year: 1839,
      medium: "Oil on canvas",
      longEdgeCm: 170,
      position: [4.96, 1.6, 2.5],
      rotation: [0, -Math.PI / 2, 0],
      url: tex("06.jpg"),
      frame: gallery,
      price: createMoney("5100", "USD"),
    }),
    // West wall
    piece({
      id: "pair-of-shoes",
      title: "A Pair of Shoes",
      year: 1886,
      medium: "Oil on canvas",
      longEdgeCm: 170,
      position: [-4.96, 1.7, -2.5],
      rotation: [0, Math.PI / 2, 0],
      url: tex("05.jpg"),
      frame: gallery,
    }),
    piece({
      id: "whistler-duret",
      title: "Arrangement in Flesh Colour and Black",
      year: 1883,
      medium: "Oil on canvas",
      longEdgeCm: 160,
      position: [-4.96, 1.65, 2.5],
      rotation: [0, Math.PI / 2, 0],
      url: tex("07.jpg"),
      frame: thin,
    }),
    // South wall
    piece({
      id: "jas-de-bouffan",
      title: "Trees and Houses Near the Jas de Bouffan",
      year: 1885,
      medium: "Oil on canvas",
      longEdgeCm: 165,
      position: [-2.5, 1.6, 4.96],
      rotation: [0, Math.PI, 0],
      url: tex("08.jpg"),
      frame: gallery,
    }),
    piece({
      id: "sunflowers",
      title: "Sunflowers",
      year: 1887,
      medium: "Oil on canvas",
      longEdgeCm: 150,
      position: [2.5, 1.6, 4.96],
      rotation: [0, Math.PI, 0],
      url: tex("09.jpg"),
      frame: gallery,
      price: createMoney("2900", "USD"),
    }),
  ];

  return {
    version: 1,
    galleryId: "demo-quiet-rooms",
    slug: toSlug("quiet-rooms-demo"),
    publishedVersion: 1,
    title: "Quiet Rooms",
    description:
      "A measured hang in Modern White — nine works at exhibition scale, soft daylight, and room enough to stand still.",
    visibility: "public",
    artist: {
      displayName: "Mona Atelier",
      slug: toSlug("mona-atelier"),
      allowInquiries: true,
      contact: { allowInquiries: true, showEmail: false },
      socials: {
        website: "https://mona.atelier.example",
        instagram: "mona.atelier",
        twitter: "monaatelier",
      },
    },
    template: modernWhiteTemplate,
    artworks: artworks.map((a) =>
      a.id === "starry-night"
        ? {
            ...a,
            description:
              "A night that holds its breath — enter the work for a quiet reading.",
            innerWorld: {
              type: "text" as const,
              title: "Under the cypress",
              body: "The sky turns like a slow wheel.\nBlue folds into gold,\nand the village sleeps in a pocket of light.\n\nStand still. The painting walks toward you.",
            },
          }
        : a,
    ),
    settings: {
      walkSpeed: 1.6,
      showTitles: true,
      allowZoom: true,
    },
    compiledAt: new Date("2026-08-01T12:00:00.000Z").toISOString(),
  };
}

function piece(input: {
  id: string;
  title: string;
  year: number;
  medium: string;
  longEdgeCm: number;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  url: string;
  frame: ReturnType<typeof createFrameSpec>;
  price?: ReturnType<typeof createMoney>;
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
    year: input.year,
    medium: input.medium,
    dimensions,
    ...(input.price ? { price: input.price } : {}),
    availability: "available",
    frame: input.frame,
    placement: {
      position: input.position,
      rotation: input.rotation,
      scale: 1,
    },
    lighting: {
      enabled: true,
      intensity: 1.12,
      angle: 0.48,
      temperatureK: 4300,
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
