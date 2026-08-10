import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Minimal — pale envelope, generous spacing, fewer anchors.
 * Free tier. Pure catalogue data.
 */
export const minimalTemplate: SceneTemplate = {
  id: "minimal",
  version: 2,
  name: "Minimal",
  tagline: "Pale gypsum, wide spacing, quiet air",
  category: "minimal",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/minimal/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.14,
    background: "#e8ebef",
    toneMapping: "neutral",
  },
  materials: {
    wall: "#f0f2f5",
    floor: "#d8dce2",
    ceiling: "#f7f8fa",
    trim: "#c8ced6",
    wallRoughness: 0.96,
    floorRoughness: 0.78,
    floorMetalness: 0.01,
    ceilingRoughness: 1,
    floorStyle: "stone",
  },
  lighting: {
    ambient: { color: "#ffffff", intensity: 0.48 },
    hemisphere: {
      skyColor: "#f7f9fc",
      groundColor: "#d2d6dc",
      intensity: 0.5,
    },
    key: {
      color: "#ffffff",
      intensity: 0.95,
      position: [1.5, 6, 2],
    },
    fill: {
      color: "#e8eef5",
      intensity: 0.4,
      position: [-4, 2.8, -1],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.18,
      position: [2.5, 3.2, -4],
    },
    presets: [
      { id: "even", label: "Even", spotIntensity: 0.95, temperatureK: 5000 },
      { id: "soft", label: "Soft", spotIntensity: 1.1, temperatureK: 4500 },
    ],
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -5.5],
      normal: [0, 0, 1],
      width: 11,
      height: 3.2,
      anchors: [
        { position: [-3.5, 1.5, 0.04], maxWidth: 2.0, maxHeight: 2.0 },
        { position: [0, 1.5, 0.04], maxWidth: 2.4, maxHeight: 2.4, preferred: true },
        { position: [3.5, 1.5, 0.04], maxWidth: 2.0, maxHeight: 2.0 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [5.5, 0, 0],
      normal: [-1, 0, 0],
      width: 11,
      height: 3.2,
      anchors: [
        { position: [0.04, 1.5, 0], maxWidth: 2.2, maxHeight: 2.2, preferred: true },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-5.5, 0, 0],
      normal: [1, 0, 0],
      width: 11,
      height: 3.2,
      anchors: [
        { position: [-0.04, 1.5, 0], maxWidth: 2.2, maxHeight: 2.2 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 5.5],
      normal: [0, 0, -1],
      width: 11,
      height: 3.2,
      anchors: [
        { position: [-2.8, 1.5, -0.04], maxWidth: 1.9, maxHeight: 1.9 },
        { position: [2.8, 1.5, -0.04], maxWidth: 1.9, maxHeight: 1.9 },
      ],
    },
  ],
  spawn: { position: [0, 1.55, 3.6], yaw: Math.PI },
  walkBounds: [
    [-4.8, -4.8],
    [4.8, -4.8],
    [4.8, 4.8],
    [-4.8, 4.8],
  ],
  capacity: { recommended: 6, max: 9 },
  frameDefaults: createFrameSpec({
    style: "none",
    color: "#ffffff",
    widthCm: 0,
    matteCm: 0,
    matteColor: "#ffffff",
  }),
  preview: { imagePath: "/templates/minimal/preview.jpg" },
};
