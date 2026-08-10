import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

import { fourWallRoom, roomWalkBounds } from "./build-room";

/** Brutalist Hall — raw concrete volumes, cool skylight, austere scale. Pro. */
export const brutalistHallTemplate: SceneTemplate = {
  id: "brutalist-hall",
  version: 1,
  name: "Brutalist Hall",
  tagline: "Raw concrete, cool skylight, austere scale",
  category: "brutalist",
  tier: "pro",
  status: "active",
  shell: {
    glbPath: "/templates/brutalist-hall/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 0.98,
    background: "#6a6e72",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#d8dce0", intensity: 0.4 },
    hemisphere: {
      skyColor: "#e8ecef",
      groundColor: "#5a5e62",
      intensity: 0.38,
    },
    key: {
      color: "#ffffff",
      intensity: 1.25,
      position: [0, 7.5, 0.5],
    },
    fill: {
      color: "#a8b0b8",
      intensity: 0.35,
      position: [4, 3, -3],
    },
    rim: {
      color: "#c8d0d8",
      intensity: 0.2,
      position: [-2, 4, -6],
    },
    presets: [
      { id: "day", label: "Day", spotIntensity: 1.25, temperatureK: 5500 },
      { id: "overcast", label: "Overcast", spotIntensity: 0.9, temperatureK: 7000 },
    ],
  },
  materials: {
    wall: "#8a8e92",
    floor: "#5e6266",
    ceiling: "#74787c",
    trim: "#4a4e52",
    wallRoughness: 0.92,
    floorRoughness: 0.7,
    floorMetalness: 0.01,
    ceilingRoughness: 0.95,
    floorStyle: "concrete",
  },
  walls: fourWallRoom({
    width: 12,
    depth: 14,
    height: 4.8,
    northAnchors: 4,
    sideAnchors: 3,
    southAnchors: 2,
  }),
  spawn: { position: [0, 1.7, 5.0], yaw: Math.PI },
  walkBounds: roomWalkBounds(5.2, 6.0),
  capacity: { recommended: 12, max: 18 },
  frameDefaults: createFrameSpec({
    style: "thin",
    color: "#1c1e20",
    widthCm: 2,
    matteCm: 4,
    matteColor: "#e8eaec",
  }),
  preview: { imagePath: "/templates/brutalist-hall/preview.jpg" },
};
