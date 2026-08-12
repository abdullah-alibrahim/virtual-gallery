import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

import { fourWallRoom, roomWalkBounds } from "./build-room";

/** Coastal Pavilion — salt-white plaster, pale stone, cool sea light. Free. */
export const coastalPavilionTemplate: SceneTemplate = {
  id: "coastal-pavilion",
  version: 1,
  name: "Coastal Pavilion",
  tagline: "Salt-white walls, pale stone, cool sea light",
  category: "coastal",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/coastal-pavilion/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.18,
    background: "#e8eef2",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#eef5f8", intensity: 0.28 },
    hemisphere: {
      skyColor: "#dceaf2",
      groundColor: "#b8c4c0",
      intensity: 0.42,
    },
    key: {
      color: "#f4fbff",
      intensity: 1.22,
      position: [2.2, 6.2, 1.5],
    },
    fill: {
      color: "#c5d8e0",
      intensity: 0.42,
      position: [-3.2, 2.8, -2],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.22,
      position: [0, 3.2, -5],
    },
    presets: [
      { id: "noon", label: "Noon", spotIntensity: 1.12, temperatureK: 5600 },
      { id: "haze", label: "Haze", spotIntensity: 0.95, temperatureK: 6500 },
    ],
  },
  materials: {
    wall: "#f3f6f7",
    wallBand: "#c5d0d4",
    wallBandBottomM: 0.88,
    wallBandTopM: 2.35,
    floor: "#c9d0d4",
    ceiling: "#fafcfd",
    trim: "#d4dde0",
    wallRoughness: 0.92,
    floorRoughness: 0.34,
    floorMetalness: 0.05,
    ceilingRoughness: 0.96,
    floorStyle: "stone",
    floorTextureId: "stone_tile",
    wallTextureId: "plaster_smooth",
  },
  architecture: {
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 5,
      lengthM: 8.5,
      center: [0, 0],
      spacingM: 5.6,
      intensity: 0.36,
      maxLive: 4,
      railColor: "#9aa6ac",
    },
    benches: [
      {
        position: [0, 0, 2.0],
        size: [2.0, 0.42, 0.48],
        color: "#c9b89a",
        glb: true,
      },
    ],
    glbProps: [
      { model: "plant", position: [4.2, 0, 4.0], scale: 1.25, yaw: 0.3 },
      { model: "plant", position: [-4.2, 0, 4.0], scale: 1.22, yaw: -0.4 },
      { model: "vase", position: [3.4, 0, -3.6], scale: 0.95 },
      { model: "bust", position: [-3.4, 0, -3.6], scale: 1.0 },
    ],
  },
  walls: fourWallRoom({ width: 11, depth: 10, height: 3.4, northAnchors: 3 }),
  spawn: { position: [0, 1.55, 3.2], yaw: Math.PI },
  walkBounds: roomWalkBounds(4.6, 4.2),
  capacity: { recommended: 8, max: 12 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#2a3438",
    widthCm: 2.6,
    matteCm: 7,
    matteColor: "#f4f8f9",
  }),
  preview: { imagePath: "/templates/coastal-pavilion/preview.jpg" },
};
