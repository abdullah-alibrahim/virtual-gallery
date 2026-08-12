import type { ArtistProfile, Asset } from "@/core/entities";
import { toAspectRatio } from "@/core/value-objects/aspect-ratio";
import { toSlug } from "@/core/value-objects/slug";

/**
 * Ismail Rifai — works copied from his public Facebook photos for a local
 * Pro studio + walkable exhibition. Files live under /public/artists/ismail-rifai.
 */

export const ISMAIL_ASSET_PREFIX = "ismail:";
export const ISMAIL_SLUG = "ismail-rifai";
export const ISMAIL_DISPLAY_NAME = "Ismail Rifai";
export const ISMAIL_FACEBOOK_URL = "https://www.facebook.com/ismail.rifai.3";
export const ISMAIL_GALLERY_TITLE = "The Hall";
export const ISMAIL_GALLERY_TITLE_AR = "القاعة";
export const ISMAIL_GALLERY_SLUG = "ismail-rifai-selected-works";
export const ISMAIL_BOATS_TITLE = "Marakeb";
export const ISMAIL_BOATS_TITLE_AR = "مراكب";
export const ISMAIL_BOATS_SLUG = "ismail-rifai-marakeb";
export const ISMAIL_EMAIL = "ismail@virtualgallery.dev";

const ISMAIL_MEDIUM_AR: Readonly<Record<string, string>> = {
  "Oil on canvas": "زيت على قماش",
  "Ink on paper": "حبر على ورق",
  "Acrylic on canvas": "أكريليك على قماش",
  "Charcoal and acrylic": "فحم وأكريليك",
  "Mixed media on canvas": "وسائط مختلطة على قماش",
  "Ink, charcoal and gesso on paper": "حبر وفحم وجيسو على ورق",
  "Monotype on paper": "مونوتيب على ورق",
  "Oil, charcoal and mixed media": "زيت وفحم ووسائط مختلطة",
  "Charcoal, ink and mixed media": "فحم وحبر ووسائط مختلطة",
};

export function ismailMediumLocalized(medium: string, arabic: boolean): string {
  if (!arabic) return medium;
  return ISMAIL_MEDIUM_AR[medium] ?? medium;
}

export function ismailWorkCopy(
  work: IsmailWork,
  arabic: boolean,
): {
  title: string;
  description: string;
  medium: string;
  category: string;
} {
  const section = ISMAIL_SECTIONS.find((item) => item.id === ismailSectionOf(work));
  return {
    title: arabic ? work.titleAr : work.title,
    description: arabic ? work.descriptionAr : work.description,
    medium: ismailMediumLocalized(work.medium, arabic),
    category: arabic
      ? (work.categoryAr ?? section?.titleAr ?? "لوحة")
      : (work.category ?? section?.title ?? "Painting"),
  };
}

export type IsmailSectionId = "roads" | "figures" | "marakeb" | "shamsi";

export interface IsmailSection {
  readonly id: IsmailSectionId;
  readonly title: string;
  readonly titleAr: string;
  readonly blurb: string;
  readonly blurbAr: string;
  readonly wallPrefixes: readonly string[];
}

export const ISMAIL_SECTIONS: readonly IsmailSection[] = [
  {
    id: "roads",
    title: "Roads",
    titleAr: "طرق",
    blurb: "Night asphalt, yellow bands, hills under haze.",
    blurbAr: "إسفلت ليلي، وأشرطة صفراء، وتلال تحت الضباب.",
    wallPrefixes: ["nave-north", "nave-east"],
  },
  {
    id: "figures",
    title: "Figures",
    titleAr: "أشكال",
    blurb: "Bodies held close — charcoal, ink, and quiet scale.",
    blurbAr: "أجساد متقاربة — فحم وحبر ومقياس هادئ.",
    wallPrefixes: ["nave-south", "nave-west"],
  },
  {
    id: "marakeb",
    title: "Marakeb",
    titleAr: "مراكب",
    blurb: "Hulls as memory — prow, night voyage, thicket.",
    blurbAr: "الأبدان كذاكرة — مقدمة، ورحلة ليلية، وأجمة.",
    wallPrefixes: ["east-wing"],
  },
  {
    id: "shamsi",
    title: "Bait Al Shamsi Tree",
    titleAr: "شجرة بيت الشامسي",
    blurb: "The almond tree in Bait Obaid Al-Shamsi’s courtyard.",
    blurbAr: "شجرة اللوز في ساحة بيت عبيد الشامسي.",
    wallPrefixes: ["west-wing"],
  },
];

const SECTION_BY_ID: Readonly<Record<string, IsmailSectionId>> = {
  "01": "roads",
  "02": "roads",
  "03": "shamsi",
  "04": "figures",
  "05": "shamsi",
  "06": "figures",
  "07": "roads",
  "08": "figures",
  "09": "figures",
  "10": "shamsi",
  "11": "roads",
  "12": "roads",
  "13": "roads",
};

export type IsmailAvailability =
  | "available"
  | "sold"
  | "reserved"
  | "priceOnRequest";

export interface IsmailWork {
  readonly id: string;
  readonly file: string;
  readonly title: string;
  readonly titleAr: string;
  readonly year: number;
  readonly medium: string;
  readonly description: string;
  readonly descriptionAr: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly dominantColor: string;
  readonly category?: string;
  readonly categoryAr?: string;
  readonly widthCm?: number;
  readonly heightCm?: number;
  readonly priceAed?: number | null;
  readonly availability?: IsmailAvailability;
  readonly signed?: string;
  readonly provenance?: string;
  readonly inventoryNo?: string;
  readonly exhibition?: string;
  readonly section?: IsmailSectionId;
}

export interface IsmailCatalog {
  readonly category: string;
  readonly categoryAr: string;
  readonly widthCm: number;
  readonly heightCm: number;
  readonly priceAed: number | null;
  readonly availability: IsmailAvailability;
  readonly signed: string;
  readonly provenance: string;
  readonly inventoryNo: string;
  readonly exhibition: string;
}

/** Dummy catalogue fields when Facebook metadata is missing. */
export function ismailCatalog(work: IsmailWork): IsmailCatalog {
  const section = ISMAIL_SECTIONS.find((item) => item.id === ismailSectionOf(work));
  return {
    category: work.category ?? section?.title ?? "Painting",
    categoryAr: work.categoryAr ?? section?.titleAr ?? "لوحة",
    widthCm: work.widthCm ?? 100,
    heightCm: work.heightCm ?? 100,
    priceAed: work.priceAed === undefined ? 14000 : work.priceAed,
    availability: work.availability ?? "available",
    signed: work.signed ?? "Signed and dated, lower left",
    provenance: work.provenance ?? "Studio of the artist, Sharjah",
    inventoryNo: work.inventoryNo ?? `IR-${work.id}`,
    exhibition: work.exhibition ?? "Studio hang, Virtual Gallery",
  };
}

export const ISMAIL_WORKS: readonly IsmailWork[] = [
  {
    id: "01",
    file: "01.jpg",
    title: "Yellow Line",
    titleAr: "الخط الأصفر",
    year: 2025,
    medium: "Oil on canvas",
    category: "Landscape",
    categoryAr: "منظر",
    widthCm: 120,
    heightCm: 120,
    priceAed: 18000,
    availability: "available",
    description:
      "A night road cut by a yellow band and a white arrow — trees and hills held above the asphalt.",
    descriptionAr:
      "طريق ليلي يشقّه خط أصفر وسهم أبيض، والتلال والأشجار فوق الإسفلت.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#1a2430",
  },
  {
    id: "02",
    file: "02.jpg",
    title: "Night Embankment",
    titleAr: "جرف الليل",
    year: 2025,
    medium: "Oil on canvas",
    widthCm: 110,
    heightCm: 110,
    description:
      "A dark slope under a thin dusk sky, marked by two yellow road lines.",
    descriptionAr: "منحدر داكن تحت سماء شفق رقيقة، وخطّان أصفران للطريق.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#2a1818",
  },
  {
    id: "03",
    file: "03.jpg",
    title: "Ink Mountain",
    titleAr: "جبل الحبر",
    year: 2024,
    medium: "Ink on paper",
    widthCm: 80,
    heightCm: 80,
    description:
      "Monochrome wash: a dark mass over a pale field, misted like weather.",
    descriptionAr: "غسلة أحادية: كتلة داكنة فوق حقل باهت، كطقس ضبابي.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#6a6a68",
  },
  {
    id: "04",
    file: "04.jpg",
    title: "Figures in Blue",
    titleAr: "أشكال زرقاء",
    year: 2024,
    medium: "Acrylic on canvas",
    widthCm: 100,
    heightCm: 100,
    description:
      "Stylised figures in lavender and turquoise, outlined against a deep blue field.",
    descriptionAr: "أشكال بأرجواني وفيروزي على حقل أزرق عميق.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#2a3a78",
  },
  {
    id: "05",
    file: "05.jpg",
    title: "Pale Horizon",
    titleAr: "أفق شاحب",
    year: 2024,
    medium: "Ink on paper",
    widthCm: 90,
    heightCm: 90,
    description:
      "A quiet ink landscape — dark foreground, a pale oval of light, hills under haze.",
    descriptionAr: "منظر حبري هادئ: أمامية داكنة، بيضاوي شاحب من الضوء، وتلال تحت الضباب.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#4a4a48",
  },
  {
    id: "06",
    file: "06.jpg",
    title: "Embrace",
    titleAr: "عناق",
    year: 2023,
    medium: "Charcoal and acrylic",
    widthCm: 85,
    heightCm: 85,
    description:
      "Two figures folded together on black — a sculptural, intimate mass.",
    descriptionAr: "شكلان يطويان بعضهما على أسود — كتلة نحتية حميمة.",
    widthPx: 960,
    heightPx: 960,
    dominantColor: "#1a1a1a",
  },
  {
    id: "07",
    file: "07.jpg",
    title: "Indigo Bands",
    titleAr: "أشرطة نيليّة",
    year: 2025,
    medium: "Oil on canvas",
    widthCm: 120,
    heightCm: 120,
    description:
      "A stormy indigo field above mustard-yellow bands and lilac strata.",
    descriptionAr: "حقل نيلي عاصف فوق أشرطة صفراء وطبقات ليلكية.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#1a2a68",
  },
  {
    id: "08",
    file: "08.jpg",
    title: "Circular Embrace",
    titleAr: "عناق دائري",
    year: 2024,
    medium: "Charcoal and acrylic",
    widthCm: 95,
    heightCm: 95,
    description:
      "Two figures locked in a circular hold on black — grey stone texture.",
    descriptionAr: "شكلان في عناق دائري على أسود — ملمس رمادي كالحجر.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#2a2a2a",
  },
  {
    id: "09",
    file: "09.jpg",
    title: "Pale Head",
    titleAr: "رأس شاحب",
    year: 2018,
    medium: "Acrylic on canvas",
    widthCm: 80,
    heightCm: 80,
    description:
      "A luminous pale head over a plum body, framed by thin white edges on black.",
    descriptionAr: "رأس شاحب مضيء فوق جسد برقوقي، بإطار أبيض رفيع على أسود.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#2a1028",
  },
  {
    id: "10",
    file: "10.jpg",
    title: "Ink Horizon",
    titleAr: "أفق الحبر",
    year: 2024,
    medium: "Ink on paper",
    widthCm: 90,
    heightCm: 90,
    description:
      "High-contrast ink bands — a pale bleed between two dark fields.",
    descriptionAr: "أشرطة حبر عالية التباين — نزف شاحب بين حقلين داكنين.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#1a1a1a",
  },
  {
    id: "11",
    file: "11.jpg",
    title: "Copper & Gold",
    titleAr: "نحاس وذهب",
    year: 2025,
    medium: "Mixed media on canvas",
    widthCm: 110,
    heightCm: 110,
    description:
      "Burnt-orange texture over charcoal bands, cut by two metallic gold lines.",
    descriptionAr: "ملمس برتقالي محروق فوق أشرطة فحمية، يشقّه خطّان ذهبيان.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#4a2818",
  },
  {
    id: "12",
    file: "12.jpg",
    title: "Crimson Hills",
    titleAr: "تلال قرمزية",
    year: 2025,
    medium: "Oil on canvas",
    widthCm: 115,
    heightCm: 115,
    description:
      "Fiery crimson hills under a slate sky, grounded by charcoal and a gold seam.",
    descriptionAr: "تلال قرمزية تحت سماء رصاصية، وأرضية فحمية بخط ذهبي.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#6a2018",
  },
  {
    id: "13",
    file: "13.jpg",
    title: "Desert Road",
    titleAr: "طريق الصحراء",
    year: 2023,
    medium: "Mixed media on canvas",
    widthCm: 120,
    heightCm: 120,
    description:
      "Craggy ochre terrain above a double yellow road through dark asphalt.",
    descriptionAr: "تضاريس مغرة فوق طريق بخطين أصفرين عبر إسفلت داكن.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#5a4030",
  },
] as const;

export const ISMAIL_BOAT_WORKS: readonly IsmailWork[] = [
  {
    id: "boat-01",
    file: "boats/01.jpg",
    title: "Prow",
    titleAr: "مقدمة المركب",
    year: 2026,
    medium: "Mixed media on canvas",
    category: "Marakeb",
    categoryAr: "مراكب",
    widthCm: 120,
    heightCm: 120,
    priceAed: 28000,
    availability: "priceOnRequest",
    inventoryNo: "IR-MKB-01",
    exhibition: "Marakeb · Aswar Art Centre, Sharjah, 2026",
    description:
      "A close geometric prow — white hull planes against charcoal water. From the Marakeb series.",
    descriptionAr:
      "مقدمة هندسية قريبة — أسطح بدن بيضاء على ماء فحمي. من سلسلة مراكب.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#3a3a40",
  },
  {
    id: "boat-02",
    file: "boats/02.jpg",
    title: "Night Voyage",
    titleAr: "رحلة ليلية",
    year: 2024,
    medium: "Acrylic on canvas",
    category: "Marakeb",
    categoryAr: "مراكب",
    widthCm: 100,
    heightCm: 100,
    priceAed: 22000,
    availability: "available",
    inventoryNo: "IR-MKB-02",
    exhibition: "Marakeb · Virtual Gallery hang",
    description:
      "Indigo night over yellow bands, with white triangular hulls at the lower edge.",
    descriptionAr:
      "ليل نيلي فوق أشرطة صفراء، وهياكل مثلثة بيضاء عند الحافة السفلى.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#1a2048",
  },
  {
    id: "boat-03",
    file: "boats/03.jpg",
    title: "Navigator",
    titleAr: "الملاح",
    year: 2023,
    medium: "Charcoal and acrylic",
    category: "Marakeb",
    categoryAr: "مراكب",
    widthCm: 150,
    heightCm: 150,
    priceAed: 24000,
    availability: "available",
    inventoryNo: "IR-MKB-03",
    exhibition: "Marakeb · Studio, Sharjah",
    description:
      "A solitary figure beside the ribbing of a vessel — charcoal, ash, and a single cobalt field.",
    descriptionAr:
      "شكل وحيد بجانب أضلاع المركب — فحم ورماد وحقل كوبالت واحد.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#2a2a2c",
  },
  {
    id: "boat-04",
    file: "boats/04.jpg",
    title: "Reclining Sail",
    titleAr: "شراع مستلقٍ",
    year: 2023,
    medium: "Ink, charcoal and gesso on paper",
    category: "Marakeb",
    categoryAr: "مراكب",
    widthCm: 70,
    heightCm: 70,
    priceAed: 9000,
    availability: "available",
    inventoryNo: "IR-MKB-04",
    exhibition: "Sketchbook diptych · Marakeb studies",
    description:
      "A diptych: a reclining figure facing a pale hull crossed by ladder lines.",
    descriptionAr: "ثنائية: شكل مستلقٍ يقابل بدناً شاحباً تقطعه خطوط سلّم.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#4a4a48",
  },
  {
    id: "boat-05",
    file: "boats/05.jpg",
    title: "Silence of the Hull",
    titleAr: "صمت البدن",
    year: 2023,
    medium: "Monotype on paper",
    category: "Marakeb",
    categoryAr: "مراكب",
    widthCm: 60,
    heightCm: 60,
    priceAed: 7500,
    availability: "reserved",
    inventoryNo: "IR-MKB-05",
    exhibition: "Marakeb studies · Sharjah",
    description:
      "Two fields of ink — a dark mass like a hull at night, and a bright white plane of fog.",
    descriptionAr: "حقلان من الحبر — كتلة داكنة كبدن ليلي، ومستوى أبيض من الضباب.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#2a2a28",
  },
  {
    id: "boat-06",
    file: "boats/06.jpg",
    title: "The Passage",
    titleAr: "العبور",
    year: 2023,
    medium: "Oil, charcoal and mixed media",
    category: "Marakeb",
    categoryAr: "مراكب",
    widthCm: 150,
    heightCm: 150,
    priceAed: 32000,
    availability: "priceOnRequest",
    inventoryNo: "IR-MKB-06",
    exhibition: "Marakeb · Aswar Art Centre, Sharjah",
    description:
      "Figures gathered on rounded hull-like forms — a monochrome crossing.",
    descriptionAr: "أشكال مجتمعة على أشكال مستديرة كالأبدان — عبور أحادي اللون.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#1a1a1a",
  },
  {
    id: "boat-07",
    file: "boats/07.jpg",
    title: "Vessel in the Thicket",
    titleAr: "مركب في الأغصان",
    year: 2024,
    medium: "Charcoal, ink and mixed media",
    category: "Marakeb",
    categoryAr: "مراكب",
    widthCm: 100,
    heightCm: 100,
    priceAed: 16000,
    availability: "sold",
    inventoryNo: "IR-MKB-07",
    exhibition: "Marakeb · Private collection",
    description:
      "Tangled branches and reflections — a hull suggested in the dense monochrome thicket.",
    descriptionAr: "أغصان متشابكة وانعكاسات — بدن يُلمَح في الأجمة أحادية اللون.",
    widthPx: 1080,
    heightPx: 1080,
    dominantColor: "#2a2a28",
  },
] as const;

/** Bait Obaid Al-Shamsi almond tree — west wing of The Hall. */
export const ISMAIL_TREE_WORKS: readonly IsmailWork[] = [
  {
    id: "shamsi-01",
    file: "trees/01.jpg",
    title: "Bait Al Shamsi Tree",
    titleAr: "شجرة بيت الشامسي",
    year: 2023,
    medium: "Ink on paper",
    category: "Bait Al Shamsi Tree",
    categoryAr: "شجرة بيت الشامسي",
    section: "shamsi",
    widthCm: 100,
    heightCm: 100,
    priceAed: 16000,
    availability: "available",
    inventoryNo: "IR-SHM-01",
    exhibition: "Bait Obaid Al-Shamsi · Arts Square, Sharjah",
    description:
      "The almond tree in the courtyard of Bait Obaid Al-Shamsi — ink weather, a pale oval of light, hills held in haze.",
    descriptionAr:
      "شجرة اللوز في ساحة بيت عبيد الشامسي — طقس حبر، وبيضاوي شاحب من الضوء، وتلال في الضباب.",
    widthPx: 828,
    heightPx: 828,
    dominantColor: "#4a4a48",
  },
] as const;

export function ismailSectionOf(work: IsmailWork): IsmailSectionId {
  if (work.section) return work.section;
  if (work.category === "Marakeb") return "marakeb";
  return SECTION_BY_ID[work.id] ?? "roads";
}

export function ismailWorksInSection(
  section: IsmailSectionId,
): readonly IsmailWork[] {
  return ISMAIL_ALL_WORKS.filter((work) => ismailSectionOf(work) === section);
}

export const ISMAIL_HALL_WORKS: readonly IsmailWork[] = [
  ...ISMAIL_WORKS,
  ...ISMAIL_TREE_WORKS,
];

export const ISMAIL_ALL_WORKS: readonly IsmailWork[] = [
  ...ISMAIL_WORKS,
  ...ISMAIL_BOAT_WORKS,
  ...ISMAIL_TREE_WORKS,
];

export function ismailAssetId(id: string): string {
  return `${ISMAIL_ASSET_PREFIX}${id}`;
}

export function isIsmailAssetId(assetId: string): boolean {
  return assetId.startsWith(ISMAIL_ASSET_PREFIX);
}

export function ismailTextureUrl(file: string): string {
  return `/artists/ismail-rifai/${file}`;
}

export function getIsmailWorkByAssetId(assetId: string): IsmailWork | null {
  if (!isIsmailAssetId(assetId)) return null;
  const id = assetId.slice(ISMAIL_ASSET_PREFIX.length);
  return ISMAIL_ALL_WORKS.find((work) => work.id === id) ?? null;
}

export function resolveIsmailTextureUrl(assetId: string): string | null {
  const work = getIsmailWorkByAssetId(assetId);
  return work ? ismailTextureUrl(work.file) : null;
}

export function buildIsmailDomainAsset(
  assetId: string,
  workspaceId: string,
): Asset | null {
  const work = getIsmailWorkByAssetId(assetId);
  if (!work) return null;
  const url = ismailTextureUrl(work.file);
  const now = new Date(0);
  return {
    id: assetId,
    workspaceId,
    kind: "image",
    status: "ready",
    original: {
      path: `artists/ismail-rifai/${work.file}`,
      bytes: 0,
      mime: "image/jpeg",
      width: work.widthPx,
      height: work.heightPx,
    },
    variants: {
      ktx2_512: url,
      ktx2_1024: url,
      ktx2_2048: url,
      thumb_512: url,
      audio_m4a: null,
    },
    meta: {
      aspectRatio: toAspectRatio(work.widthPx, work.heightPx),
      dominantColor: work.dominantColor,
      blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
      exif: null,
    },
    error: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function getIsmailRifaiStaticProfile(): ArtistProfile {
  const now = new Date("2026-08-01T12:00:00.000Z");
  return {
    workspaceId: "ismail-rifai",
    slug: toSlug(ISMAIL_SLUG),
    displayName: ISMAIL_DISPLAY_NAME,
    bio: "Painter based in Sharjah. Landscapes of night roads, the almond tree of Bait Al Shamsi, Marakeb hulls, and close human form — shown here as a walkable hall.",
    statement:
      "I paint the distance between asphalt and hill, between two bodies and the dark that holds them. The almond tree in Bait Obaid Al-Shamsi’s courtyard is a witness I return to. The room is quiet so the work can speak in its own scale.",
    avatarUrl: `${ismailTextureUrl("avatar.jpg")}?v=4`,
    coverUrl: `${ismailTextureUrl("cover.jpg")}?v=3`,
    location: "Sharjah, United Arab Emirates",
    socials: { facebook: ISMAIL_FACEBOOK_URL },
    contact: { allowInquiries: true, showEmail: false },
    featuredGalleryIds: [],
    createdAt: now,
    updatedAt: now,
  };
}
