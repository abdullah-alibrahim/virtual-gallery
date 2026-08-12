import type { SceneArtwork, SceneManifest, SceneTemplate } from "@/core/entities";
import {
  ISMAIL_BOATS_SLUG,
  ISMAIL_BOATS_TITLE,
  ISMAIL_BOATS_TITLE_AR,
  ISMAIL_BOAT_WORKS,
  ISMAIL_DISPLAY_NAME,
  ISMAIL_FACEBOOK_URL,
  ISMAIL_GALLERY_SLUG,
  ISMAIL_GALLERY_TITLE,
  ISMAIL_GALLERY_TITLE_AR,
  ISMAIL_HALL_WORKS,
  ISMAIL_SECTIONS,
  ISMAIL_SLUG,
  type IsmailWork,
  ismailCatalog,
  ismailSectionOf,
  ismailTextureUrl,
  ismailWorkCopy,
} from "@/core/samples/ismail-rifai";
import { worldPositionOnWall } from "@/core/services/arrange-artworks";
import { megaWingTemplate, noirSalonTemplate } from "@/core/templates";
import { createDimensions } from "@/core/value-objects/dimensions";
import { createFrameSpec } from "@/core/value-objects/frame-spec";
import { createMoney } from "@/core/value-objects/money";
import { toSlug } from "@/core/value-objects/slug";
import { fitScale, yawFromNormal } from "@/three/math/geometry";
import type { PublicGalleryCard } from "@/infrastructure/profiles/list-public-galleries";

type ViewerLocale = "en" | "ar";

/**
 * Walkable Mega Wing (Pro) — one huge hall with named sections:
 * Roads + Figures in the nave, Marakeb east, Bait Al Shamsi Tree west.
 */
export function buildIsmailRifaiManifest(
  _siteUrl = "http://localhost:3000",
  locale: ViewerLocale = "en",
): SceneManifest {
  const arabic = locale === "ar";
  const template = ismailHallTemplate(arabic);
  const works = [...ISMAIL_HALL_WORKS, ...ISMAIL_BOAT_WORKS];
  return {
    version: 1,
    galleryId: "demo-ismail-rifai",
    slug: toSlug(ISMAIL_GALLERY_SLUG),
    publishedVersion: 1,
    title: arabic ? ISMAIL_GALLERY_TITLE_AR : ISMAIL_GALLERY_TITLE,
    description: arabic
      ? "قاعة برو بربعة أقسام — طرق الليل، والأشكال، ومراكب، وشجرة بيت الشامسي — معلّقة بمقياس المعرض."
      : "A Pro Mega Wing in four sections — night roads, figures, Marakeb hulls, and the almond tree of Bait Al Shamsi — hung at exhibition scale.",
    visibility: "public",
    artist: ismailSceneArtist(arabic),
    galleryWebsite: ISMAIL_FACEBOOK_URL,
    template,
    artworks: hangIsmailWorksBySection(template, works, arabic),
    settings: {
      walkSpeed: 1.85,
      showTitles: true,
      allowZoom: true,
    },
    compiledAt: new Date("2026-08-01T12:00:00.000Z").toISOString(),
  };
}

/** Intimate second hang: Marakeb only, Noir Salon (Pro). */
export function buildIsmailBoatsManifest(
  _siteUrl = "http://localhost:3000",
  locale: ViewerLocale = "en",
): SceneManifest {
  const arabic = locale === "ar";
  return buildIsmailSeriesManifest({
    galleryId: "demo-ismail-rifai-boats",
    slug: ISMAIL_BOATS_SLUG,
    title: arabic ? ISMAIL_BOATS_TITLE_AR : ISMAIL_BOATS_TITLE,
    description: arabic
      ? "مراكب — الأبدان كذاكرة. مقدمات هندسية، ورحلات ليلية، ودراسات فحمية في صالون نوار (برو)."
      : "Marakeb — boats as memory and hull. Geometric prows, night voyages, and charcoal studies hung in the Pro Noir Salon.",
    template: noirSalonTemplate,
    works: ISMAIL_BOAT_WORKS,
    walkSpeed: 1.6,
    arabic,
  });
}

export function getIsmailRifaiPublicGalleries(): PublicGalleryCard[] {
  return [
    {
      id: "demo-ismail-rifai",
      title: ISMAIL_GALLERY_TITLE,
      slug: ISMAIL_GALLERY_SLUG,
      description:
        "Mega Wing (Pro) in four sections — Roads, Figures, Marakeb, Bait Al Shamsi Tree. Enter the room — no sign-in.",
      coverThumbUrl: ismailTextureUrl("01.jpg"),
      artworkCount: ISMAIL_HALL_WORKS.length + ISMAIL_BOAT_WORKS.length,
      publishedAt: new Date("2026-08-01T12:00:00.000Z"),
      href: "/demo/ismail",
    },
    {
      id: "demo-ismail-rifai-boats",
      title: ISMAIL_BOATS_TITLE,
      slug: ISMAIL_BOATS_SLUG,
      description:
        "Noir Salon (Pro) hung with the Marakeb boat series. Enter the room — no sign-in.",
      coverThumbUrl: ismailTextureUrl("boats/01.jpg"),
      artworkCount: ISMAIL_BOAT_WORKS.length,
      publishedAt: new Date("2026-08-12T12:00:00.000Z"),
      href: "/demo/ismail/boats",
    },
  ];
}

function ismailSceneArtist(arabic: boolean): SceneManifest["artist"] {
  return {
    displayName: arabic ? "إسماعيل الرفاعي" : ISMAIL_DISPLAY_NAME,
    slug: toSlug(ISMAIL_SLUG),
    avatarUrl: `${ismailTextureUrl("avatar.jpg")}?v=4`,
    allowInquiries: true,
    contact: { allowInquiries: true, showEmail: false },
    socials: { facebook: ISMAIL_FACEBOOK_URL },
  };
}

function ismailHallTemplate(arabic: boolean): SceneTemplate {
  const architecture = megaWingTemplate.architecture;
  const roads = ISMAIL_SECTIONS.find((s) => s.id === "roads")!;
  const figures = ISMAIL_SECTIONS.find((s) => s.id === "figures")!;
  const marakeb = ISMAIL_SECTIONS.find((s) => s.id === "marakeb")!;
  const shamsi = ISMAIL_SECTIONS.find((s) => s.id === "shamsi")!;

  return {
    ...megaWingTemplate,
    architecture: architecture
      ? {
          ...architecture,
          signs: [
            {
              text: arabic ? "إسماعيل الرفاعي" : "ISMAIL RIFAI",
              subtitle: arabic ? ISMAIL_GALLERY_TITLE_AR : "The Hall",
              position: [0, 4.2, -10.88],
              yaw: 0,
              width: 5.6,
              height: 1.0,
              style: "wall",
            },
            {
              text: arabic ? roads.titleAr : roads.title,
              subtitle: arabic ? roads.title : roads.titleAr,
              position: [-5.4, 3.55, -10.88],
              yaw: 0,
              width: 2.8,
              height: 0.62,
              style: "wall",
            },
            {
              text: arabic ? figures.titleAr : figures.title,
              subtitle: arabic ? figures.title : figures.titleAr,
              position: [0, 3.55, 10.88],
              yaw: Math.PI,
              width: 2.8,
              height: 0.62,
              style: "wall",
            },
            {
              text: arabic ? marakeb.titleAr : marakeb.title,
              subtitle: arabic ? marakeb.title : marakeb.titleAr,
              position: [8.94, 4.55, 0],
              yaw: -Math.PI / 2,
              width: 2.8,
              height: 0.55,
              style: "wall",
            },
            {
              text: arabic ? marakeb.titleAr : marakeb.title,
              subtitle: arabic ? marakeb.title : marakeb.titleAr,
              position: [17.38, 3.9, 0],
              yaw: -Math.PI / 2,
              width: 3.2,
              height: 0.7,
              style: "wall",
            },
            {
              text: arabic ? "الشامسي" : "BAIT AL SHAMSI",
              subtitle: arabic ? shamsi.title : shamsi.titleAr,
              position: [-8.94, 4.55, 0],
              yaw: Math.PI / 2,
              width: 3.4,
              height: 0.62,
              style: "wall",
            },
            {
              text: arabic ? "الشامسي" : "BAIT AL SHAMSI",
              subtitle: arabic ? shamsi.title : shamsi.titleAr,
              position: [-17.38, 3.9, 0],
              yaw: Math.PI / 2,
              width: 4.0,
              height: 0.78,
              style: "wall",
            },
            {
              text: arabic ? "إسماعيل الرفاعي" : "Ismail Rifai",
              subtitle: arabic ? "الشارقة" : "Sharjah",
              position: [0, 0, 10.15],
              yaw: Math.PI,
              width: 1.15,
              height: 0.42,
              style: "plaque",
            },
          ],
        }
      : architecture,
  };
}

function buildIsmailSeriesManifest(input: {
  galleryId: string;
  slug: string;
  title: string;
  description: string;
  template: SceneTemplate;
  works: readonly IsmailWork[];
  walkSpeed: number;
  arabic: boolean;
}): SceneManifest {
  return {
    version: 1,
    galleryId: input.galleryId,
    slug: toSlug(input.slug),
    publishedVersion: 1,
    title: input.title,
    description: input.description,
    visibility: "public",
    artist: ismailSceneArtist(input.arabic),
    galleryWebsite: ISMAIL_FACEBOOK_URL,
    template: input.template,
    artworks: hangIsmailWorks(input.template, input.works, undefined, input.arabic),
    settings: {
      walkSpeed: input.walkSpeed,
      showTitles: true,
      allowZoom: true,
    },
    compiledAt: new Date("2026-08-01T12:00:00.000Z").toISOString(),
  };
}

function hangIsmailWorksBySection(
  template: SceneTemplate,
  works: readonly IsmailWork[],
  arabic: boolean,
): SceneArtwork[] {
  const hung: SceneArtwork[] = [];
  const hungIds = new Set<string>();
  const usedKeys = new Set<string>();

  for (const section of ISMAIL_SECTIONS) {
    const sectionWorks = works.filter(
      (work) => ismailSectionOf(work) === section.id && !hungIds.has(work.id),
    );
    const slots = collectSlots(template, section.wallPrefixes).filter(
      (slot) => !usedKeys.has(slotKey(slot)),
    );
    const batch = hangIsmailWorksOnSlots(template, sectionWorks, slots, arabic);
    hung.push(...batch.artworks);
    for (const id of batch.hungIds) hungIds.add(id);
    for (const key of batch.usedKeys) usedKeys.add(key);
  }

  const leftover = works.filter((work) => !hungIds.has(work.id));
  if (leftover.length > 0) {
    const slots = collectSlots(template).filter(
      (slot) => !usedKeys.has(slotKey(slot)),
    );
    hung.push(
      ...hangIsmailWorksOnSlots(template, leftover, slots, arabic).artworks,
    );
  }
  return hung;
}

type HangSlot = {
  wall: SceneTemplate["walls"][number];
  anchor: SceneTemplate["walls"][number]["anchors"][number];
};

function slotKey(slot: HangSlot): string {
  return `${slot.wall.id}:${slot.anchor.position.join(",")}`;
}

function hangIsmailWorks(
  template: SceneTemplate,
  works: readonly IsmailWork[],
  wallPrefixes?: readonly string[],
  arabic = false,
): SceneArtwork[] {
  return hangIsmailWorksOnSlots(
    template,
    works,
    collectSlots(template, wallPrefixes),
    arabic,
  ).artworks;
}

function hangIsmailWorksOnSlots(
  template: SceneTemplate,
  works: readonly IsmailWork[],
  slots: readonly HangSlot[],
  arabic: boolean,
): { artworks: SceneArtwork[]; hungIds: string[]; usedKeys: string[] } {
  if (works.length === 0 || slots.length === 0) {
    return { artworks: [], hungIds: [], usedKeys: [] };
  }
  const frame = createFrameSpec({
    style: template.frameDefaults.style,
    color: template.frameDefaults.color,
    widthCm: Math.max(template.frameDefaults.widthCm, 3.5),
    matteCm: Math.max(template.frameDefaults.matteCm, 6),
    matteColor: template.frameDefaults.matteColor,
  });
  const chosen = slots.slice(0, works.length);
  const preset = template.lighting.presets[0];

  const artworks = chosen.map((slot, index) => {
    const work = works[index]!;
    const catalog = ismailCatalog(work);
    const copy = ismailWorkCopy(work, arabic);
    const url = ismailTextureUrl(work.file);
    const heightCm = catalog.heightCm;
    const widthCm = catalog.widthCm;
    const scale = fitScale(
      widthCm / 100,
      heightCm / 100,
      slot.anchor.maxWidth,
      slot.anchor.maxHeight,
      0.88,
    );
    const yaw = yawFromNormal(slot.wall.normal);
    const world = worldPositionOnWall(slot.wall, slot.anchor.position);
    const position: [number, number, number] = [world[0], world[1], world[2]];
    const price =
      catalog.priceAed == null
        ? undefined
        : createMoney(catalog.priceAed, "AED");

    return {
      id: `ismail-${work.id}`,
      title: copy.title,
      description: copy.description,
      year: work.year,
      medium: copy.medium,
      category: copy.category,
      dimensions: createDimensions(widthCm, heightCm, "cm"),
      ...(price ? { price } : {}),
      availability: catalog.availability,
      frame,
      placement: {
        position,
        rotation: [0, yaw, 0] as const,
        scale,
      },
      lighting: {
        enabled: true,
        intensity: (preset?.spotIntensity ?? 1.08) * 1.05,
        angle: 0.46,
        temperatureK: preset?.temperatureK ?? 4300,
      },
      textures: { lod0: url, lod1: url, lod2: url },
      meta: {
        aspectRatio: work.widthPx / work.heightPx,
        blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
      },
    };
  });

  return {
    artworks,
    hungIds: works.slice(0, chosen.length).map((work) => work.id),
    usedKeys: chosen.map(slotKey),
  };
}

function collectSlots(
  template: SceneTemplate,
  wallPrefixes?: readonly string[],
) {
  const preferred: HangSlot[] = [];
  const rest: HangSlot[] = [];

  for (const wall of template.walls) {
    if (wallPrefixes && !matchesWallPrefix(wall.id, wallPrefixes)) continue;
    for (const anchor of wall.anchors) {
      const entry = { wall, anchor };
      if (anchor.preferred) preferred.push(entry);
      else rest.push(entry);
    }
  }

  const score = (wall: SceneTemplate["walls"][number]) =>
    wall.normal[2] > 0.5 ? 0 : wall.id === "north" ? 0 : 1;

  preferred.sort((a, b) => score(a.wall) - score(b.wall));
  rest.sort((a, b) => score(a.wall) - score(b.wall));
  return [...preferred, ...rest];
}

function matchesWallPrefix(wallId: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) =>
      wallId === prefix ||
      wallId.startsWith(`${prefix}-`) ||
      wallId.startsWith(prefix),
  );
}
