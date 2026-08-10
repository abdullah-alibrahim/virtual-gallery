import type { SceneManifest } from "@/core/entities";
import { harborPavilionTemplate } from "@/core/templates";
import { toSlug } from "@/core/value-objects/slug";
import { buildMarketingPreviewArtworks } from "@/features/marketing/lib/marketing-preview-artworks";

const HARBOR_DEMO_TITLES = [
  "Morning Tide",
  "Pale Stone",
  "West Light",
  "Harbor Line",
  "Cool Wash",
  "Long Horizon",
  "Salt Air",
  "Skylight Pool",
  "Soft Band",
  "North Span",
  "Quiet Pier",
  "Edition Blue",
] as const;

/**
 * Walkable Harbor Pavilion demo — free flagship coastal hall, static textures.
 */
export function buildHarborDemoManifest(
  _siteUrl = "http://localhost:3000",
): SceneManifest {
  const hung = buildMarketingPreviewArtworks(harborPavilionTemplate, 12);
  const artworks = hung.map((artwork, index) => ({
    ...artwork,
    id: `harbor-demo-${index + 1}`,
    title: HARBOR_DEMO_TITLES[index % HARBOR_DEMO_TITLES.length]!,
    medium: index % 3 === 0 ? "Oil on linen" : index % 3 === 1 ? "Acrylic" : "Watercolor",
    year: 2021 + (index % 5),
    availability:
      index % 4 === 0
        ? ("priceOnRequest" as const)
        : artwork.availability,
  }));

  return {
    version: 1,
    galleryId: "demo-harbor-pavilion",
    slug: toSlug("harbor-pavilion-demo"),
    publishedVersion: 1,
    title: "Harbor Pavilion",
    description:
      "A bright coastal hall: pale stone underfoot, a long west light wall, and morning wash through an arched window. Walk the length. The hang is measured.",
    visibility: "public",
    artist: {
      displayName: "Harbor Demo Studio",
      slug: toSlug("harbor-demo-studio"),
      allowInquiries: true,
      contact: { allowInquiries: true, showEmail: false },
      socials: {
        website: "https://harbor.example",
        instagram: "harborpavilion",
        linkedin: "https://www.linkedin.com/company/virtual-gallery",
      },
    },
    galleryWebsite: "https://virtual.gallery/demo/harbor",
    template: harborPavilionTemplate,
    artworks,
    settings: {
      walkSpeed: 1.8,
      showTitles: true,
      allowZoom: true,
    },
    compiledAt: new Date("2026-08-05T12:00:00.000Z").toISOString(),
  };
}
