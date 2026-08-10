import type { SceneTemplate, TemplateMaterials } from "@/core/entities";

import { blackGalleryTemplate } from "./black-gallery";
import { brutalistHallTemplate } from "./brutalist-hall";
import { coastalPavilionTemplate } from "./coastal-pavilion";
import { concreteLoftTemplate } from "./concrete-loft";
import { courtyardAtriumTemplate } from "./courtyard-atrium";
import { courtyardRingTemplate } from "./courtyard-ring";
import { daylightAtriumTemplate } from "./daylight-atrium";
import { daylightMuseumTemplate } from "./daylight-museum";
import { editionHallTemplate } from "./edition-hall";
import { enfiladeTemplate } from "./enfilade";
import { grandNaveTemplate } from "./grand-nave";
import { hallAntechamberTemplate } from "./hall-antechamber";
import { harborPavilionTemplate } from "./harbor-pavilion";
import { industrialTemplate } from "./industrial";
import { lWingAtelierTemplate } from "./l-wing-atelier";
import { longCorridorTemplate } from "./long-corridor";
import { luxuryTemplate } from "./luxury";
import { megaWingTemplate } from "./mega-wing";
import { minimalTemplate } from "./minimal";
import { modernWhiteTemplate } from "./modern-white";
import { nightCubeTemplate } from "./night-cube";
import { noirSalonTemplate } from "./noir-salon";
import { plazaHallTemplate } from "./plaza-hall";
import { softMuseumTemplate } from "./soft-museum";
import { timberSalonTemplate } from "./timber-salon";
import { twinSuiteTemplate } from "./twin-suite";
import { wingSuiteTemplate } from "./wing-suite";
import { zenCourtTemplate } from "./zen-court";

/**
 * In-repo template catalogue. Firestore seeding copies these documents;
 * the demo viewer and tests import them directly.
 *
 * Adding a style = one file in this folder + one line below. No renderer code.
 */
export const TEMPLATE_CATALOGUE: readonly SceneTemplate[] = [
  modernWhiteTemplate,
  softMuseumTemplate,
  daylightMuseumTemplate,
  editionHallTemplate,
  harborPavilionTemplate,
  grandNaveTemplate,
  plazaHallTemplate,
  megaWingTemplate,
  noirSalonTemplate,
  courtyardAtriumTemplate,
  concreteLoftTemplate,
  daylightAtriumTemplate,
  coastalPavilionTemplate,
  timberSalonTemplate,
  lWingAtelierTemplate,
  longCorridorTemplate,
  hallAntechamberTemplate,
  twinSuiteTemplate,
  blackGalleryTemplate,
  minimalTemplate,
  nightCubeTemplate,
  luxuryTemplate,
  industrialTemplate,
  brutalistHallTemplate,
  zenCourtTemplate,
  courtyardRingTemplate,
  enfiladeTemplate,
  wingSuiteTemplate,
] as const;

export function getTemplateById(id: string): SceneTemplate | null {
  return TEMPLATE_CATALOGUE.find((t) => t.id === id) ?? null;
}

export function listTemplatesByTier(
  tier: "free" | "pro" | "all" = "all",
): readonly SceneTemplate[] {
  if (tier === "all") return TEMPLATE_CATALOGUE;
  return TEMPLATE_CATALOGUE.filter((t) => t.tier === tier);
}

/**
 * Wall / floor colours for marketing swatches and create-gallery cards.
 * Prefers `materials`; falls back for older published manifests.
 */
export function getTemplateSwatches(template: SceneTemplate): {
  wall: string;
  floor: string;
  ceiling: string;
} {
  if (template.materials) {
    return {
      wall: template.materials.wall,
      floor: template.materials.floor,
      ceiling: template.materials.ceiling,
    };
  }
  const fallback = materialsFallback(template.category, template.environment.background);
  return {
    wall: fallback.wall,
    floor: fallback.floor,
    ceiling: fallback.ceiling,
  };
}

export function materialsFallback(
  category: SceneTemplate["category"],
  background: string,
): TemplateMaterials {
  switch (category) {
    case "black":
    case "night":
      return {
        wall: "#141414",
        floor: "#0e0e0e",
        ceiling: "#080808",
        trim: "#242424",
        floorStyle: "stone",
      };
    case "luxury":
    case "timber":
      return {
        wall: "#2a241c",
        floor: "#1e1914",
        ceiling: "#16120e",
        trim: "#3d3428",
        floorStyle: "parquet",
      };
    case "industrial":
    case "brutalist":
      return {
        wall: "#6e7276",
        floor: "#4a4e52",
        ceiling: "#3e4246",
        trim: "#585c60",
        floorStyle: "concrete",
      };
    case "loft":
      return {
        wall: "#9a958c",
        floor: "#6b5340",
        ceiling: "#8a8580",
        trim: "#6e6860",
        floorStyle: "plank",
      };
    case "minimal":
    case "atrium":
    case "zen":
      return {
        wall: "#f0f2f5",
        floor: "#d8dce2",
        ceiling: "#f7f8fa",
        trim: "#c8ced6",
        floorStyle: "stone",
      };
    case "coastal":
      return {
        wall: "#f3f6f7",
        floor: "#c9d0d4",
        ceiling: "#fafcfd",
        trim: "#d4dde0",
        floorStyle: "stone",
      };
    case "museum":
      return {
        wall: "#e6e2da",
        floor: "#b59a72",
        ceiling: "#f2efe8",
        trim: "#cfc6b8",
        floorStyle: "parquet",
      };
    default:
      return {
        wall: "#f4f2ec",
        floor: background || "#cfc4b0",
        ceiling: "#faf9f6",
        trim: "#cfc9bc",
        floorStyle: "plank",
      };
  }
}

export {
  modernWhiteTemplate,
  blackGalleryTemplate,
  minimalTemplate,
  luxuryTemplate,
  industrialTemplate,
  concreteLoftTemplate,
  daylightAtriumTemplate,
  daylightMuseumTemplate,
  editionHallTemplate,
  harborPavilionTemplate,
  softMuseumTemplate,
  nightCubeTemplate,
  noirSalonTemplate,
  coastalPavilionTemplate,
  timberSalonTemplate,
  brutalistHallTemplate,
  zenCourtTemplate,
  lWingAtelierTemplate,
  longCorridorTemplate,
  courtyardAtriumTemplate,
  courtyardRingTemplate,
  hallAntechamberTemplate,
  twinSuiteTemplate,
  enfiladeTemplate,
  wingSuiteTemplate,
  grandNaveTemplate,
  plazaHallTemplate,
  megaWingTemplate,
};
