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
    ambient: { color: "#eef5f8", intensity: 0.48 },
    hemisphere: {
      skyColor: "#dceaf2",
      groundColor: "#b8c4c0",
      intensity: 0.42,
    },
    key: {
      color: "#f4fbff",
      intensity: 1.15,
      position: [2.2, 6.2, 1.5],
    },
    fill: {
      color: "#c5d8e0",
      intensity: 0.4,
      position: [-3.2, 2.8, -2],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.22,
      position: [0, 3.2, -5],
    },
    presets: [
      { id: "noon", label: "Noon", spotIntensity: 1.15, temperatureK: 5600 },
      { id: "haze", label: "Haze", spotIntensity: 0.95, temperatureK: 6500 },
    ],
  },
  materials: {
    wall: "#f3f6f7",
    floor: "#c9d0d4",
    ceiling: "#fafcfd",
    trim: "#d4dde0",
    wallRoughness: 0.94,
    floorRoughness: 0.62,
    floorMetalness: 0.02,
    ceilingRoughness: 0.98,
    floorStyle: "stone",
  },
  walls: fourWallRoom({ width: 11, depth: 10, height: 3.4, northAnchors: 3 }),
  spawn: { position: [0, 1.55, 3.2], yaw: Math.PI },
  walkBounds: roomWalkBounds(4.6, 4.2),
  capacity: { recommended: 8, max: 12 },
  frameDefaults: createFrameSpec({
    style: "thin",
    color: "#3a4548",
    widthCm: 2.5,
    matteCm: 6,
    matteColor: "#f7fafb",
  }),
  preview: { imagePath: "/templates/coastal-pavilion/preview.jpg" },
};
