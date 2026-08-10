import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

import { fourWallRoom, roomWalkBounds } from "./build-room";

/** Timber Salon — warm walnut walls, herringbone oak, amber evening light. Free. */
export const timberSalonTemplate: SceneTemplate = {
  id: "timber-salon",
  version: 1,
  name: "Timber Salon",
  tagline: "Warm walnut, herringbone oak, amber evening light",
  category: "timber",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/timber-salon/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.05,
    background: "#2a2118",
    toneMapping: "aces",
    fog: { color: "#2a2118", near: 12, far: 28 },
  },
  lighting: {
    ambient: { color: "#f0e0c8", intensity: 0.36 },
    hemisphere: {
      skyColor: "#ffe8c8",
      groundColor: "#5a4030",
      intensity: 0.35,
    },
    key: {
      color: "#ffd9a8",
      intensity: 1.1,
      position: [-1.5, 5.4, 2],
    },
    fill: {
      color: "#c8a078",
      intensity: 0.32,
      position: [3, 2.5, -1.5],
    },
    rim: {
      color: "#ffc878",
      intensity: 0.18,
      position: [0, 2.8, -4.5],
    },
    presets: [
      { id: "evening", label: "Evening", spotIntensity: 1.1, temperatureK: 3200 },
      { id: "candle", label: "Candle", spotIntensity: 0.85, temperatureK: 2700 },
    ],
  },
  materials: {
    wall: "#5c4634",
    floor: "#3d2a1c",
    ceiling: "#4a3828",
    trim: "#2e2016",
    wallRoughness: 0.78,
    floorRoughness: 0.48,
    floorMetalness: 0.04,
    ceilingRoughness: 0.9,
    floorStyle: "parquet",
  },
  walls: fourWallRoom({ width: 9.5, depth: 9.5, height: 3.2, northAnchors: 3 }),
  spawn: { position: [0, 1.52, 3.0], yaw: Math.PI },
  walkBounds: roomWalkBounds(4.0, 4.0),
  capacity: { recommended: 7, max: 10 },
  frameDefaults: createFrameSpec({
    style: "ornate",
    color: "#1a120c",
    widthCm: 4.5,
    matteCm: 5,
    matteColor: "#f0e6d4",
  }),
  preview: { imagePath: "/templates/timber-salon/preview.jpg" },
};
