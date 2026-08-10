import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Soft Museum — quiet museum grey with even, gentle light.
 * Free tier.
 */
export const softMuseumTemplate: SceneTemplate = {
  id: "soft-museum",
  version: 1,
  name: "Soft Museum",
  tagline: "Museum grey, oak parquet, even wash",
  category: "museum",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/soft-museum/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.1,
    background: "#ddd9d2",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f5f2eb", intensity: 0.44 },
    hemisphere: {
      skyColor: "#f8f5ef",
      groundColor: "#c4b8a8",
      intensity: 0.4,
    },
    key: {
      color: "#fff8ee",
      intensity: 1.05,
      position: [-1, 5.8, 2.5],
    },
    fill: {
      color: "#e8e4dc",
      intensity: 0.38,
      position: [3.5, 3, -2],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.15,
      position: [0, 3, -4.8],
    },
    presets: [
      { id: "museum", label: "Museum", spotIntensity: 1.05, temperatureK: 4200 },
      { id: "soft", label: "Soft", spotIntensity: 1.2, temperatureK: 3900 },
    ],
  },
  materials: {
    wall: "#e6e2da",
    floor: "#b59a72",
    ceiling: "#f2efe8",
    trim: "#cfc6b8",
    wallRoughness: 0.93,
    floorRoughness: 0.52,
    floorMetalness: 0.045,
    ceilingRoughness: 0.98,
    floorStyle: "parquet",
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -5.2],
      normal: [0, 0, 1],
      width: 10.5,
      height: 3.5,
      anchors: [
        { position: [-3.3, 1.6, 0.04], maxWidth: 2.2, maxHeight: 2.3, preferred: true },
        { position: [0, 1.6, 0.04], maxWidth: 2.4, maxHeight: 2.5, preferred: true },
        { position: [3.3, 1.6, 0.04], maxWidth: 2.2, maxHeight: 2.3 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [5.25, 0, 0],
      normal: [-1, 0, 0],
      width: 10.5,
      height: 3.5,
      anchors: [
        { position: [0.04, 1.6, -2.6], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [0.04, 1.6, 2.6], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-5.25, 0, 0],
      normal: [1, 0, 0],
      width: 10.5,
      height: 3.5,
      anchors: [
        { position: [-0.04, 1.6, -2.6], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [-0.04, 1.6, 2.6], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 5.2],
      normal: [0, 0, -1],
      width: 10.5,
      height: 3.5,
      anchors: [
        { position: [-2.4, 1.6, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [2.4, 1.6, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
  ],
  spawn: { position: [0, 1.58, 3.4], yaw: Math.PI },
  walkBounds: [
    [-4.5, -4.5],
    [4.5, -4.5],
    [4.5, 4.5],
    [-4.5, 4.5],
  ],
  capacity: { recommended: 8, max: 12 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#2a2620",
    widthCm: 3.5,
    matteCm: 7,
    matteColor: "#f5f1e8",
  }),
  preview: { imagePath: "/templates/soft-museum/preview.jpg" },
};
