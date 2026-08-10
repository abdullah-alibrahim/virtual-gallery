import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Black Gallery — dramatic free template with a darker envelope.
 */
export const blackGalleryTemplate: SceneTemplate = {
  id: "black-gallery",
  version: 2,
  name: "Black Gallery",
  tagline: "Charcoal walls, focused warm spots",
  category: "black",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/black-gallery/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 0.95,
    background: "#0a0a0a",
    toneMapping: "aces",
    fog: { color: "#0a0a0a", near: 7, far: 20 },
  },
  lighting: {
    ambient: { color: "#c8c2b8", intensity: 0.16 },
    hemisphere: {
      skyColor: "#5a554c",
      groundColor: "#121212",
      intensity: 0.22,
    },
    key: {
      color: "#ffd7a8",
      intensity: 0.85,
      position: [0, 4.8, 1.5],
    },
    fill: {
      color: "#8a9bb0",
      intensity: 0.18,
      position: [-3, 2.5, -2],
    },
    rim: {
      color: "#ffe8c8",
      intensity: 0.28,
      position: [2.5, 3.2, -3.5],
    },
    presets: [
      { id: "spot", label: "Spotlight", spotIntensity: 1.7, temperatureK: 3200 },
      { id: "cool", label: "Cool", spotIntensity: 1.4, temperatureK: 5200 },
    ],
  },
  materials: {
    wall: "#141414",
    floor: "#0e0e0e",
    ceiling: "#080808",
    trim: "#242424",
    wallRoughness: 0.9,
    floorRoughness: 0.55,
    floorMetalness: 0.08,
    ceilingRoughness: 1,
    floorStyle: "stone",
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -4.5],
      normal: [0, 0, 1],
      width: 9,
      height: 3.6,
      anchors: [
        { position: [-2.6, 1.65, 0.04], maxWidth: 2.1, maxHeight: 2.3, preferred: true },
        { position: [0, 1.65, 0.04], maxWidth: 2.3, maxHeight: 2.5, preferred: true },
        { position: [2.6, 1.65, 0.04], maxWidth: 2.1, maxHeight: 2.3 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [4.5, 0, 0],
      normal: [-1, 0, 0],
      width: 9,
      height: 3.6,
      anchors: [
        { position: [0.04, 1.65, -2], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [0.04, 1.65, 2], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-4.5, 0, 0],
      normal: [1, 0, 0],
      width: 9,
      height: 3.6,
      anchors: [
        { position: [-0.04, 1.65, -2], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [-0.04, 1.65, 2], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 4.5],
      normal: [0, 0, -1],
      width: 9,
      height: 3.6,
      anchors: [
        { position: [0, 1.65, -0.04], maxWidth: 2.2, maxHeight: 2.4, preferred: true },
      ],
    },
  ],
  spawn: { position: [0, 1.6, 2.8], yaw: Math.PI },
  walkBounds: [
    [-3.9, -3.9],
    [3.9, -3.9],
    [3.9, 3.9],
    [-3.9, 3.9],
  ],
  capacity: { recommended: 7, max: 10 },
  frameDefaults: createFrameSpec({
    style: "thin",
    color: "#111111",
    widthCm: 1.5,
    matteCm: 0,
    matteColor: "#111111",
  }),
  preview: { imagePath: "/templates/black-gallery/preview.jpg" },
};
