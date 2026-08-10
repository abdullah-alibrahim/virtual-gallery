import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Twin Suite — pair of similar rooms linked by a wide centred opening.
 * Reads as two volumes, not one long box.
 */
export const twinSuiteTemplate: SceneTemplate = {
  id: "twin-suite",
  version: 1,
  name: "Twin Suite",
  tagline: "Two rooms linked by a wide opening",
  category: "white",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/twin-suite/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.06,
    background: "#ccc6bc",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f2eee8", intensity: 0.36 },
    hemisphere: {
      skyColor: "#f8f5f0",
      groundColor: "#b0a898",
      intensity: 0.44,
    },
    key: {
      color: "#fff8f0",
      intensity: 1.02,
      position: [0, 6.0, 1.5],
    },
    fill: {
      color: "#ddd6cc",
      intensity: 0.34,
      position: [-5, 2.8, -2],
    },
    rim: {
      color: "#f6f2ec",
      intensity: 0.15,
      position: [5, 3.0, -2],
    },
    presets: [
      { id: "day", label: "Day", spotIntensity: 1.02, temperatureK: 4500 },
    ],
  },
  materials: {
    wall: "#f2efe8",
    floor: "#c8b49a",
    ceiling: "#f7f5f0",
    trim: "#d4cdc2",
    wallRoughness: 0.93,
    floorRoughness: 0.58,
    floorMetalness: 0.025,
    ceilingRoughness: 0.99,
    floorStyle: "plank",
  },
  walls: [
    // —— West room ——
    {
      id: "west-north",
      label: "West room north",
      origin: [-4.25, 0, -4.5],
      normal: [0, 0, 1],
      width: 7.5,
      height: 3.4,
      anchors: [
        { position: [-2.0, 1.55, 0.04], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [0.5, 1.58, 0.04], maxWidth: 2.3, maxHeight: 2.4, preferred: true },
        { position: [2.4, 1.55, 0.04], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
    {
      id: "west-south",
      label: "West room south",
      origin: [-4.25, 0, 4.5],
      normal: [0, 0, -1],
      width: 7.5,
      height: 3.4,
      anchors: [
        { position: [-1.8, 1.55, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [1.8, 1.55, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
    {
      id: "west-outer",
      label: "West outer",
      origin: [-8, 0, 0],
      normal: [1, 0, 0],
      width: 9,
      height: 3.4,
      anchors: [
        { position: [-0.04, 1.55, -2.2], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [-0.04, 1.55, 2.2], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    // Partition west-side of opening (gap |z| < 1.6)
    {
      id: "partition-west-north",
      label: "Partition west north",
      origin: [-0.5, 0, -3.05],
      normal: [-1, 0, 0],
      width: 2.9,
      height: 3.4,
      anchors: [
        { position: [0.04, 1.52, 0], maxWidth: 1.6, maxHeight: 1.8 },
      ],
    },
    {
      id: "partition-west-south",
      label: "Partition west south",
      origin: [-0.5, 0, 3.05],
      normal: [-1, 0, 0],
      width: 2.9,
      height: 3.4,
      anchors: [
        { position: [0.04, 1.52, 0], maxWidth: 1.6, maxHeight: 1.8 },
      ],
    },
    // —— East room ——
    {
      id: "east-north",
      label: "East room north",
      origin: [4.25, 0, -4.5],
      normal: [0, 0, 1],
      width: 7.5,
      height: 3.4,
      anchors: [
        { position: [-2.4, 1.55, 0.04], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [-0.5, 1.58, 0.04], maxWidth: 2.3, maxHeight: 2.4, preferred: true },
        { position: [2.0, 1.55, 0.04], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    {
      id: "east-south",
      label: "East room south",
      origin: [4.25, 0, 4.5],
      normal: [0, 0, -1],
      width: 7.5,
      height: 3.4,
      anchors: [
        { position: [-1.8, 1.55, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [1.8, 1.55, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
    {
      id: "east-outer",
      label: "East outer",
      origin: [8, 0, 0],
      normal: [-1, 0, 0],
      width: 9,
      height: 3.4,
      anchors: [
        { position: [0.04, 1.55, -2.2], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [0.04, 1.55, 2.2], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    {
      id: "partition-east-north",
      label: "Partition east north",
      origin: [0.5, 0, -3.05],
      normal: [1, 0, 0],
      width: 2.9,
      height: 3.4,
      anchors: [],
    },
    {
      id: "partition-east-south",
      label: "Partition east south",
      origin: [0.5, 0, 3.05],
      normal: [1, 0, 0],
      width: 2.9,
      height: 3.4,
      anchors: [],
    },
    // Lintel over the centred twin opening
    {
      id: "door-lintel",
      label: "Opening lintel",
      origin: [0, 2.45, 0],
      normal: [-1, 0, 0],
      width: 3.3,
      height: 0.95,
      anchors: [],
    },
    // Close the exterior slot north/south of the opening (between room shells)
    {
      id: "opening-north-cap",
      label: "Opening north cap",
      origin: [0, 0, -4.5],
      normal: [0, 0, 1],
      width: 1.4,
      height: 3.4,
      anchors: [],
    },
    {
      id: "opening-south-cap",
      label: "Opening south cap",
      origin: [0, 0, 4.5],
      normal: [0, 0, -1],
      width: 1.4,
      height: 3.4,
      anchors: [],
    },
  ],
  spawn: { position: [-4.2, 1.58, 2.8], yaw: Math.PI },
  walkBounds: [
    [-7.5, -4.0],
    [-0.65, -4.0],
    [-0.65, -1.55],
    [0.65, -1.55],
    [0.65, -4.0],
    [7.5, -4.0],
    [7.5, 4.0],
    [0.65, 4.0],
    [0.65, 1.55],
    [-0.65, 1.55],
    [-0.65, 4.0],
    [-7.5, 4.0],
  ],
  capacity: { recommended: 12, max: 16 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#2c2824",
    widthCm: 3,
    matteCm: 6,
    matteColor: "#f6f2ea",
  }),
  preview: { imagePath: "/templates/twin-suite/preview.jpg" },
};
