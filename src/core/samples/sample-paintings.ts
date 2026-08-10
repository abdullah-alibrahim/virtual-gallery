import type { Asset } from "@/core/entities";
import { toAspectRatio } from "@/core/value-objects/aspect-ratio";

/**
 * Starter painting pack — public-domain / Met Open Access JPGs under
 * `/public/demo/artworks` (mirrored in `/public/samples/paintings`).
 * Used by the demo walk, landing hero, and the editor “Fill with sample
 * paintings” action. Sample asset ids are `sample:01` … `sample:09`.
 */

export const SAMPLE_ASSET_PREFIX = "sample:";

export interface SamplePainting {
  readonly id: string;
  readonly file: string;
  readonly title: string;
  readonly year: number;
  readonly medium: string;
  readonly artist?: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly dominantColor: string;
}

export const SAMPLE_PAINTINGS: readonly SamplePainting[] = [
  {
    id: "01",
    file: "01.jpg",
    title: "The Starry Night",
    year: 1889,
    medium: "Oil on canvas",
    artist: "Vincent van Gogh",
    widthPx: 1280,
    heightPx: 1014,
    dominantColor: "#1a2a4a",
  },
  {
    id: "02",
    file: "02.jpg",
    title: "Self-Portrait",
    year: 1660,
    medium: "Oil on canvas",
    artist: "Rembrandt",
    widthPx: 1319,
    heightPx: 1600,
    dominantColor: "#5a5048",
  },
  {
    id: "03",
    file: "03.jpg",
    title: "The Great Wave off Kanagawa",
    year: 1831,
    medium: "Woodblock print",
    artist: "Katsushika Hokusai",
    widthPx: 1280,
    heightPx: 883,
    dominantColor: "#8a3030",
  },
  {
    id: "04",
    file: "04.jpg",
    title: "Water Lilies",
    year: 1906,
    medium: "Oil on canvas",
    artist: "Claude Monet",
    widthPx: 1280,
    heightPx: 1230,
    dominantColor: "#6a8a7a",
  },
  {
    id: "05",
    file: "05.jpg",
    title: "A Pair of Shoes",
    year: 1886,
    medium: "Oil on canvas",
    artist: "Vincent van Gogh",
    widthPx: 1600,
    heightPx: 1338,
    dominantColor: "#6a5040",
  },
  {
    id: "06",
    file: "06.jpg",
    title: "The Fighting Temeraire",
    year: 1839,
    medium: "Oil on canvas",
    artist: "J. M. W. Turner",
    widthPx: 1280,
    heightPx: 951,
    dominantColor: "#6a7a88",
  },
  {
    id: "07",
    file: "07.jpg",
    title: "Arrangement in Flesh Colour and Black",
    year: 1883,
    medium: "Oil on canvas",
    artist: "James McNeill Whistler",
    widthPx: 759,
    heightPx: 1600,
    dominantColor: "#4a4540",
  },
  {
    id: "08",
    file: "08.jpg",
    title: "Trees and Houses Near the Jas de Bouffan",
    year: 1885,
    medium: "Oil on canvas",
    artist: "Paul Cézanne",
    widthPx: 1600,
    heightPx: 1202,
    dominantColor: "#8a7060",
  },
  {
    id: "09",
    file: "09.jpg",
    title: "Sunflowers",
    year: 1887,
    medium: "Oil on canvas",
    artist: "Vincent van Gogh",
    widthPx: 1600,
    heightPx: 1130,
    dominantColor: "#c4a040",
  },
] as const;

export function sampleAssetId(id: string): string {
  return `${SAMPLE_ASSET_PREFIX}${id}`;
}

export function isSampleAssetId(assetId: string): boolean {
  return assetId.startsWith(SAMPLE_ASSET_PREFIX);
}

export function sampleTextureUrl(file: string): string {
  return `/demo/artworks/${file}`;
}

export function getSamplePaintingByAssetId(
  assetId: string,
): SamplePainting | null {
  if (!isSampleAssetId(assetId)) return null;
  const id = assetId.slice(SAMPLE_ASSET_PREFIX.length);
  return SAMPLE_PAINTINGS.find((p) => p.id === id) ?? null;
}

export function resolveSampleTextureUrl(assetId: string): string | null {
  const painting = getSamplePaintingByAssetId(assetId);
  return painting ? sampleTextureUrl(painting.file) : null;
}

/**
 * Synthetic domain Asset for publish compile. JPGs go in every LOD slot —
 * the viewer’s texture loader accepts JPG/PNG (not only KTX2).
 */
export function buildSampleDomainAsset(
  assetId: string,
  workspaceId: string,
): Asset | null {
  const painting = getSamplePaintingByAssetId(assetId);
  if (!painting) return null;
  const url = sampleTextureUrl(painting.file);
  const now = new Date(0);
  return {
    id: assetId,
    workspaceId,
    kind: "image",
    status: "ready",
    original: {
      path: `samples/${painting.file}`,
      bytes: 0,
      mime: "image/jpeg",
      width: painting.widthPx,
      height: painting.heightPx,
    },
    variants: {
      ktx2_512: url,
      ktx2_1024: url,
      ktx2_2048: url,
      thumb_512: url,
      audio_m4a: null,
    },
    meta: {
      aspectRatio: toAspectRatio(painting.widthPx, painting.heightPx),
      dominantColor: painting.dominantColor,
      blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
      exif: null,
    },
    error: null,
    createdAt: now,
    updatedAt: now,
  };
}
