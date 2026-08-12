import type { SceneManifest } from "@/core/entities";
import { megaWingTemplate } from "@/core/templates";
import { toSlug } from "@/core/value-objects/slug";
import { buildMarketingPreviewArtworks } from "@/features/marketing/lib/marketing-preview-artworks";

const PRO_DEMO_TITLES = [
  "Nave Light",
  "West Wing Study",
  "Beamed Ceiling",
  "Track Field",
  "East Volume",
  "Long Horizon",
  "Gallery Bench",
  "Cool Stone",
  "Amber Panel",
  "Side Aisle",
  "Northern Span",
  "Quiet Column",
  "Open Nave",
  "Wing Passage",
  "Daylight Wall",
  "Evening Track",
  "Centre Line",
  "Tall Canvas",
  "Soft Shadow",
  "Museum Pace",
  "Wide Bay",
  "Corner Light",
  "Proving Ground",
  "Last Hang",
] as const;

/**
 * Walkable Mega Wing Pro demo — filled hang anchors, static textures, no auth.
 * Same public-viewer pattern as Quiet Rooms (`buildDemoManifest`).
 */
export function buildProDemoManifest(
  _siteUrl = "http://localhost:3000",
): SceneManifest {
  const hung = buildMarketingPreviewArtworks(megaWingTemplate, 24);
  const artworks = hung.map((artwork, index) => ({
    ...artwork,
    id: `pro-demo-${index + 1}`,
    title: PRO_DEMO_TITLES[index % PRO_DEMO_TITLES.length]!,
    medium: index % 3 === 0 ? "Oil on linen" : index % 3 === 1 ? "Acrylic" : "Mixed media",
    year: 2022 + (index % 4),
    availability:
      index % 5 === 0
        ? ("priceOnRequest" as const)
        : artwork.availability,
    description:
      index % 5 === 0
        ? "A centrepiece of the hall. Pricing and placement available on request."
        : artwork.description,
    ...(index === 0
      ? {
          innerWorld: {
            type: "text" as const,
            title: "Nave at Dusk",
            body: "The hall lengthens after day.\nTracks cool to amber.\nA single footfall answers another —\nthen quiet, measured, returns.",
          },
        }
      : {}),
    ...(index === 5
      ? {
          innerWorld: {
            type: "room" as const,
            title: "Harbor chamber",
            body: "Step from the wing into a coastal pavilion — another pace of light.",
            href: "/demo/harbor",
            spawnLabel: "Harbor Pavilion demo",
          },
        }
      : {}),
  }));

  return {
    version: 1,
    galleryId: "demo-mega-wing",
    slug: toSlug("mega-wing-pro-demo"),
    publishedVersion: 1,
    title: "Mega Wing",
    description:
      "This hall was composed for collectors who prefer room over screen: twin side volumes, long sightlines, and works hung at exhibition scale. Walk slowly. The light is measured.",
    visibility: "public",
    artist: {
      displayName: "Pro Demo Studio",
      slug: toSlug("pro-demo-studio"),
      allowInquiries: true,
      contact: { allowInquiries: true, showEmail: false },
      socials: {
        website: "https://virtual.gallery",
        instagram: "virtualgallery",
        twitter: "virtualgallery",
        behance: "https://www.behance.net/gallery",
      },
    },
    galleryWebsite: "https://virtual.gallery/demo/pro",
    template: megaWingTemplate,
    artworks,
    settings: {
      walkSpeed: 1.85,
      showTitles: true,
      allowZoom: true,
      eveningTour: {
        enabled: true,
        startAt: "2026-01-01T00:00:00.000Z",
        endAt: "2027-12-31T23:59:59.000Z",
        inviteCode: "dusk",
      },
    },
    compiledAt: new Date("2026-08-01T12:00:00.000Z").toISOString(),
  };
}
