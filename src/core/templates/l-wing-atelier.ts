import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * L-Wing Atelier — true L plan: long north run + east wing.
 * Fully closed shell; no open corners into clearColor.
 */
export const lWingAtelierTemplate: SceneTemplate = {
  id: "l-wing-atelier",
  version: 1,
  name: "L-Wing Atelier",
  tagline: "L-shaped plan, long run + east wing, soft daylight",
  category: "loft",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/l-wing-atelier/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.06,
    background: "#c8bfb2",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f2ebe3", intensity: 0.36 },
    hemisphere: {
      skyColor: "#fff6ec",
      groundColor: "#a89878",
      intensity: 0.42,
    },
    key: {
      color: "#fff2e4",
      intensity: 1.02,
      position: [-2.5, 6.2, 1.5],
    },
    fill: {
      color: "#d4ccc0",
      intensity: 0.38,
      position: [4.5, 3.2, -2],
    },
    rim: {
      color: "#f8f4ee",
      intensity: 0.14,
      position: [2, 3.5, -5.5],
    },
    presets: [
      { id: "day", label: "Day", spotIntensity: 1.05, temperatureK: 4600 },
    ],
  },
  materials: {
    wall: "#ede7dd",
    floor: "#bda888",
    ceiling: "#f2ede6",
    trim: "#cfc4b6",
    wallRoughness: 0.94,
    floorRoughness: 0.58,
    floorMetalness: 0.025,
    ceilingRoughness: 0.99,
    floorStyle: "plank",
  },
  walls: [
    // North run (full L breadth)
    {
      id: "north-long",
      label: "North run",
      origin: [-0.5, 0, -5.15],
      normal: [0, 0, 1],
      width: 11.3,
      height: 3.5,
      anchors: [
        { position: [-3.5, 1.6, 0.04], maxWidth: 2.1, maxHeight: 2.2, preferred: true },
        { position: [-0.5, 1.6, 0.04], maxWidth: 2.3, maxHeight: 2.4, preferred: true },
        { position: [2.5, 1.6, 0.04], maxWidth: 2.1, maxHeight: 2.2 },
        { position: [4.5, 1.6, 0.04], maxWidth: 1.8, maxHeight: 2.0 },
      ],
    },
    // East outer of the wing
    {
      id: "east-wing",
      label: "East wing",
      origin: [5.15, 0, -0.5],
      normal: [-1, 0, 0],
      width: 9.3,
      height: 3.5,
      anchors: [
        { position: [0.04, 1.6, -2.5], maxWidth: 2.0, maxHeight: 2.2, preferred: true },
        { position: [0.04, 1.6, 0.5], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [0.04, 1.6, 2.8], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
    // West outer of the north run
    {
      id: "west",
      label: "West wall",
      origin: [-6.15, 0, -2.05],
      normal: [1, 0, 0],
      width: 6.2,
      height: 3.5,
      anchors: [
        { position: [-0.04, 1.6, -2.0], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [-0.04, 1.6, 1.2], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    // South face of the west/north arm
    {
      id: "south-stub",
      label: "South stub",
      origin: [-2.55, 0, 1.05],
      normal: [0, 0, -1],
      width: 7.2,
      height: 3.5,
      anchors: [
        { position: [-1.8, 1.6, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [1.5, 1.6, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
    // South face of the east wing
    {
      id: "south-wing",
      label: "East wing south",
      origin: [3.1, 0, 4.15],
      normal: [0, 0, -1],
      width: 4.2,
      height: 3.5,
      anchors: [
        { position: [0, 1.6, -0.04], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    // Inner L — west face of east wing (z > 1)
    {
      id: "inner-corner",
      label: "Inner L face",
      origin: [1.05, 0, 2.6],
      normal: [1, 0, 0],
      width: 3.2,
      height: 3.5,
      anchors: [
        { position: [-0.04, 1.6, 0], maxWidth: 2.0, maxHeight: 2.2, preferred: true },
      ],
    },
  ],
  spawn: { position: [-1.5, 1.58, -1.2], yaw: Math.PI },
  walkBounds: [
    [-5.7, -4.7],
    [4.7, -4.7],
    [4.7, 3.7],
    [1.35, 3.7],
    [1.35, 0.7],
    [-5.7, 0.7],
  ],
  capacity: { recommended: 10, max: 14 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#2a2420",
    widthCm: 3,
    matteCm: 6,
    matteColor: "#f5f0e8",
  }),
  preview: { imagePath: "/templates/l-wing-atelier/preview.jpg" },
};
