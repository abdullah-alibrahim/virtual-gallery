import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Wing Suite — main hang hall connected to a side gallery wing by a short
 * passage. Distinct volumes (unlike the continuous L-Wing Atelier).
 */
export const wingSuiteTemplate: SceneTemplate = {
  id: "wing-suite",
  version: 1,
  name: "Wing Suite",
  tagline: "Main hall, short passage, side gallery wing",
  category: "loft",
  tier: "pro",
  status: "active",
  shell: {
    glbPath: "/templates/wing-suite/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.05,
    background: "#c6beb2",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f0ebe4", intensity: 0.35 },
    hemisphere: {
      skyColor: "#f6f0e8",
      groundColor: "#a09078",
      intensity: 0.42,
    },
    key: {
      color: "#fff2e4",
      intensity: 1.04,
      position: [-1.5, 6.4, 0.5],
    },
    fill: {
      color: "#d8d0c4",
      intensity: 0.34,
      position: [8, 3.0, 2],
    },
    rim: {
      color: "#f4f0ea",
      intensity: 0.14,
      position: [10, 3.2, -3],
    },
    presets: [
      { id: "day", label: "Day", spotIntensity: 1.04, temperatureK: 4600 },
    ],
  },
  materials: {
    wall: "#ebe6dc",
    floor: "#b8a080",
    ceiling: "#f2ede6",
    trim: "#ccc4b6",
    wallRoughness: 0.94,
    floorRoughness: 0.56,
    floorMetalness: 0.028,
    ceilingRoughness: 0.99,
    floorStyle: "plank",
  },
  walls: [
    // —— Main hall ——
    {
      id: "main-north",
      label: "Main north",
      origin: [0, 0, -5.5],
      normal: [0, 0, 1],
      width: 10,
      height: 3.6,
      anchors: [
        { position: [-3.0, 1.58, 0.04], maxWidth: 2.1, maxHeight: 2.3 },
        { position: [0, 1.6, 0.04], maxWidth: 2.5, maxHeight: 2.6, preferred: true },
        { position: [3.0, 1.58, 0.04], maxWidth: 2.1, maxHeight: 2.3 },
      ],
    },
    {
      id: "main-south",
      label: "Main south",
      origin: [0, 0, 4.5],
      normal: [0, 0, -1],
      width: 10,
      height: 3.6,
      anchors: [
        { position: [-2.5, 1.55, -0.04], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [2.5, 1.55, -0.04], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    {
      id: "main-west",
      label: "Main west",
      origin: [-5, 0, -0.5],
      normal: [1, 0, 0],
      width: 10,
      height: 3.6,
      anchors: [
        { position: [-0.04, 1.58, -2.5], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [-0.04, 1.58, 2.0], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    // East wall of main — gap for passage at z ∈ [-1.1, 1.1]
    {
      id: "main-east-north",
      label: "Main east north",
      origin: [5, 0, -3.3],
      normal: [-1, 0, 0],
      width: 4.4,
      height: 3.6,
      anchors: [
        { position: [0.04, 1.55, 0], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
    {
      id: "main-east-south",
      label: "Main east south",
      origin: [5, 0, 2.8],
      normal: [-1, 0, 0],
      width: 3.4,
      height: 3.6,
      anchors: [
        { position: [0.04, 1.55, 0], maxWidth: 1.8, maxHeight: 2.0 },
      ],
    },
    // —— Passage (short connector) ——
    {
      id: "passage-north",
      label: "Passage north",
      origin: [6.25, 0, -1.15],
      normal: [0, 0, 1],
      width: 2.5,
      height: 3.2,
      anchors: [],
    },
    {
      id: "passage-south",
      label: "Passage south",
      origin: [6.25, 0, 1.15],
      normal: [0, 0, -1],
      width: 2.5,
      height: 3.2,
      anchors: [],
    },
    // —— Side wing ——
    {
      id: "wing-east",
      label: "Wing east",
      origin: [12.5, 0, 0],
      normal: [-1, 0, 0],
      width: 8,
      height: 3.5,
      anchors: [
        { position: [0.04, 1.58, -2.2], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [0.04, 1.58, 0], maxWidth: 2.2, maxHeight: 2.4, preferred: true },
        { position: [0.04, 1.58, 2.2], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    {
      id: "wing-north",
      label: "Wing north",
      origin: [9.75, 0, -4],
      normal: [0, 0, 1],
      width: 5.5,
      height: 3.5,
      anchors: [
        { position: [-1.2, 1.55, 0.04], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [1.2, 1.55, 0.04], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
    {
      id: "wing-south",
      label: "Wing south",
      origin: [9.75, 0, 4],
      normal: [0, 0, -1],
      width: 5.5,
      height: 3.5,
      anchors: [
        { position: [-1.2, 1.55, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [1.2, 1.55, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
    // Wing west — gap for passage
    {
      id: "wing-west-north",
      label: "Wing west north",
      origin: [7.5, 0, -2.55],
      normal: [1, 0, 0],
      width: 2.9,
      height: 3.5,
      anchors: [
        { position: [-0.04, 1.52, 0], maxWidth: 1.5, maxHeight: 1.7 },
      ],
    },
    {
      id: "wing-west-south",
      label: "Wing west south",
      origin: [7.5, 0, 2.55],
      normal: [1, 0, 0],
      width: 2.9,
      height: 3.5,
      anchors: [
        { position: [-0.04, 1.52, 0], maxWidth: 1.5, maxHeight: 1.7 },
      ],
    },
    {
      id: "passage-lintel-main",
      label: "Passage lintel (main)",
      origin: [5, 2.4, 0],
      normal: [-1, 0, 0],
      width: 2.4,
      height: 1.2,
      anchors: [],
    },
    {
      id: "passage-lintel-wing",
      label: "Passage lintel (wing)",
      origin: [7.5, 2.4, 0],
      normal: [1, 0, 0],
      width: 2.4,
      height: 1.1,
      anchors: [],
    },
  ],
  spawn: { position: [0, 1.58, 3.2], yaw: Math.PI },
  walkBounds: [
    [-4.5, -5.0],
    [4.7, -5.0],
    [4.7, -1.05],
    [7.3, -1.05],
    [7.3, -3.5],
    [12.0, -3.5],
    [12.0, 3.5],
    [7.3, 3.5],
    [7.3, 1.05],
    [4.7, 1.05],
    [4.7, 4.0],
    [-4.5, 4.0],
  ],
  capacity: { recommended: 13, max: 18 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#2a2420",
    widthCm: 3,
    matteCm: 6,
    matteColor: "#f5f0e8",
  }),
  preview: { imagePath: "/templates/wing-suite/preview.jpg" },
};
