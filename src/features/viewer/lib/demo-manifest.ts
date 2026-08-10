import type { SceneArtwork, SceneManifest } from "@/core/entities";
import { modernWhiteTemplate } from "@/core/templates";
import { createDimensions } from "@/core/value-objects/dimensions";
import { createFrameSpec } from "@/core/value-objects/frame-spec";
import { createMoney } from "@/core/value-objects/money";
import { toSlug } from "@/core/value-objects/slug";

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
    style: "thin",
    color: "#111111",
    widthCm: 1.8,
    matteCm: 0,
  });

  const artworks: SceneArtwork[] = [
    // North wall — three large works
    piece({
      id: "starry-night",
      title: "The Starry Night",
      year: 1889,
      medium: "Oil on canvas",
      w: 180,
      h: 140,
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
      w: 160,
      h: 200,
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
      w: 190,
      h: 145,
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
      w: 150,
      h: 150,
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
      w: 170,
      h: 120,
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
      w: 120,
      h: 180,
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
      w: 110,
      h: 160,
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
      w: 165,
      h: 120,
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
      w: 140,
      h: 140,
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
    artworks,
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
  w: number;
  h: number;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  url: string;
  frame: ReturnType<typeof createFrameSpec>;
  price?: ReturnType<typeof createMoney>;
}): SceneArtwork {
  return {
    id: input.id,
    title: input.title,
    description: "",
    year: input.year,
    medium: input.medium,
    dimensions: createDimensions(input.w, input.h, "cm"),
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
      aspectRatio: input.w / input.h,
      blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
    },
  };
}
