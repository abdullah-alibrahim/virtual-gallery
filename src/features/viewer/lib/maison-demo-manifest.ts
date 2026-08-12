import type { SceneManifest } from "@/core/entities";
import { maisonSalonTemplate } from "@/core/templates";
import { toSlug } from "@/core/value-objects/slug";
import { buildMarketingPreviewArtworks } from "@/features/marketing/lib/marketing-preview-artworks";

const MAISON_TITLES_EN = [
  "Velvet Hour",
  "Limestone Quiet",
  "Brass Track",
  "Ivory Plaster",
  "Private Viewing",
  "West Gold",
  "Salon Line",
  "Soft Band",
  "Edition Warmth",
  "North Span",
  "Courtyard Echo",
] as const;

const MAISON_TITLES_AR = [
  "ساعة المخمل",
  "هدوء الحجر",
  "مسار النحاس",
  "جص عاجي",
  "عرض خاص",
  "ذهب الغرب",
  "خط الصالون",
  "شريط ناعم",
  "دفء الطبعة",
  "امتداد الشمال",
  "صدى الفناء",
] as const;

const MAISON_MEDIUM_EN = [
  "Oil on linen",
  "Acrylic on canvas",
  "Mixed media",
  "Charcoal and pastel",
] as const;

const MAISON_MEDIUM_AR = [
  "زيت على كتان",
  "أكريليك على قماش",
  "وسائط مختلطة",
  "فحم وباستيل",
] as const;

/**
 * Walkable Maison Salon demo — haute interior with brass, limestone, plaster.
 */
export function buildMaisonDemoManifest(
  _siteUrl = "http://localhost:3000",
  locale: "en" | "ar" = "en",
): SceneManifest {
  const arabic = locale === "ar";
  const titles = arabic ? MAISON_TITLES_AR : MAISON_TITLES_EN;
  const hung = buildMarketingPreviewArtworks(maisonSalonTemplate, 11);
  const artworks = hung.map((artwork, index) => ({
    ...artwork,
    id: `maison-demo-${index + 1}`,
    title: titles[index % titles.length]!,
    medium: (arabic ? MAISON_MEDIUM_AR : MAISON_MEDIUM_EN)[index % 4]!,
    year: 2019 + (index % 6),
    availability:
      index % 5 === 0
        ? ("priceOnRequest" as const)
        : artwork.availability,
  }));

  const template = {
    ...maisonSalonTemplate,
    architecture: maisonSalonTemplate.architecture
      ? {
          ...maisonSalonTemplate.architecture,
          signs: [
            {
              text: arabic ? "صالة الميزون" : "MAISON SALON",
              subtitle: arabic ? "عرض خاص" : "Private viewing",
              position: [0, 3.7, -5.95] as const,
              yaw: 0,
              width: 4.6,
              height: 0.85,
              style: "wall" as const,
            },
            {
              text: arabic ? "صالة الميزون" : "Maison Salon",
              subtitle: arabic
                ? "حجر · نحاس · جص"
                : "Limestone · brass · plaster",
              position: [0, 0, 5.35] as const,
              yaw: Math.PI,
              width: 1.15,
              height: 0.4,
              style: "plaque" as const,
            },
          ],
        }
      : undefined,
  };

  return {
    version: 1,
    galleryId: "demo-maison-salon",
    slug: toSlug("maison-salon-demo"),
    publishedVersion: 1,
    title: arabic ? "صالة الميزون" : "Maison Salon",
    description: arabic
      ? "قاعة فاخرة: جص عاجي، أرضية حجر لامعة، ضوء نحاس، ونافذة مقوّسة ذهبية. ادخل وتجوّل كأنك في دار عرض خاصة."
      : "A haute viewing room: ivory plaster, polished limestone, brass tracks, and a golden arched window. Walk as if in a private maison.",
    visibility: "public",
    artist: {
      displayName: arabic ? "استوديو الميزون" : "Maison Demo Studio",
      slug: toSlug("maison-demo-studio"),
      allowInquiries: true,
      contact: { allowInquiries: true, showEmail: false },
      socials: {
        website: "https://maison.example",
        instagram: "maisonsalon",
      },
    },
    galleryWebsite: "https://virtual.gallery/demo/maison",
    template,
    artworks,
    settings: {
      walkSpeed: 1.65,
      showTitles: true,
      allowZoom: true,
    },
    compiledAt: new Date("2026-08-12T08:00:00.000Z").toISOString(),
  };
}
