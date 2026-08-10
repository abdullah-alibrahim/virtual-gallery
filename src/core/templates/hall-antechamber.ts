import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Hall + Antechamber — smaller entry room opening into a larger hang hall.
 * Partition walls leave a centred doorway; walkBounds threads both volumes.
 */
export const hallAntechamberTemplate: SceneTemplate = {
  id: "hall-antechamber",
  version: 1,
  name: "Hall + Antechamber",
  tagline: "Entry antechamber opening into a larger hang hall",
  category: "museum",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/hall-antechamber/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.08,
    background: "#c4bbb0",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f4f0e8", intensity: 0.38 },
    hemisphere: {
      skyColor: "#f8f4ee",
      groundColor: "#b8a890",
      intensity: 0.42,
    },
    key: {
      color: "#fff6ea",
      intensity: 1.05,
      position: [-1.2, 6.2, -1.5],
    },
    fill: {
      color: "#e4ddd2",
      intensity: 0.36,
      position: [3.5, 3.0, 4],
    },
    rim: {
      color: "#faf6f0",
      intensity: 0.14,
      position: [0.5, 3.2, -6],
    },
    presets: [
      { id: "museum", label: "Museum", spotIntensity: 1.05, temperatureK: 4300 },
    ],
  },
  materials: {
    wall: "#e8e4dc",
    floor: "#b29a74",
    ceiling: "#f3efe8",
    trim: "#cfc6b8",
    wallRoughness: 0.94,
    floorRoughness: 0.55,
    floorMetalness: 0.03,
    ceilingRoughness: 0.99,
    floorStyle: "parquet",
  },
  walls: [
    // —— Main hall (north volume) ——
    {
      id: "hall-north",
      label: "Hall north",
      origin: [0, 0, -6.5],
      normal: [0, 0, 1],
      width: 10,
      height: 3.6,
      anchors: [
        { position: [-3.2, 1.58, 0.04], maxWidth: 2.2, maxHeight: 2.3 },
        { position: [0, 1.6, 0.04], maxWidth: 2.5, maxHeight: 2.6, preferred: true },
        { position: [3.2, 1.58, 0.04], maxWidth: 2.2, maxHeight: 2.3 },
      ],
    },
    {
      id: "hall-east",
      label: "Hall east",
      origin: [5, 0, -2],
      normal: [-1, 0, 0],
      width: 9,
      height: 3.6,
      anchors: [
        { position: [0.04, 1.58, -2.4], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [0.04, 1.58, 1.8], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    {
      id: "hall-west",
      label: "Hall west",
      origin: [-5, 0, -2],
      normal: [1, 0, 0],
      width: 9,
      height: 3.6,
      anchors: [
        { position: [-0.04, 1.58, -2.4], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [-0.04, 1.58, 1.8], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    // Partition facing hall — gap |x| < 1.35 for doorway
    {
      id: "partition-hall-west",
      label: "Partition (hall west)",
      origin: [-3.15, 0, 2.5],
      normal: [0, 0, -1],
      width: 3.7,
      height: 3.6,
      anchors: [
        { position: [-0.8, 1.55, -0.04], maxWidth: 1.7, maxHeight: 1.9 },
      ],
    },
    {
      id: "partition-hall-east",
      label: "Partition (hall east)",
      origin: [3.15, 0, 2.5],
      normal: [0, 0, -1],
      width: 3.7,
      height: 3.6,
      anchors: [
        { position: [0.8, 1.55, -0.04], maxWidth: 1.7, maxHeight: 1.9 },
      ],
    },
    // —— Antechamber (south entry) ——
    {
      id: "ante-south",
      label: "Antechamber south",
      origin: [0, 0, 6.5],
      normal: [0, 0, -1],
      width: 6,
      height: 3.3,
      anchors: [
        { position: [0, 1.52, -0.04], maxWidth: 1.8, maxHeight: 2.0 },
      ],
    },
    {
      id: "ante-east",
      label: "Antechamber east",
      origin: [3, 0, 4.5],
      normal: [-1, 0, 0],
      width: 4,
      height: 3.3,
      anchors: [
        { position: [0.04, 1.52, 0], maxWidth: 1.7, maxHeight: 1.9 },
      ],
    },
    {
      id: "ante-west",
      label: "Antechamber west",
      origin: [-3, 0, 4.5],
      normal: [1, 0, 0],
      width: 4,
      height: 3.3,
      anchors: [
        { position: [-0.04, 1.52, 0], maxWidth: 1.7, maxHeight: 1.9 },
      ],
    },
    // Partition facing ante — same gap
    {
      id: "partition-ante-west",
      label: "Partition (ante west)",
      origin: [-2.15, 0, 2.5],
      normal: [0, 0, 1],
      width: 1.7,
      height: 3.3,
      anchors: [],
    },
    {
      id: "partition-ante-east",
      label: "Partition (ante east)",
      origin: [2.15, 0, 2.5],
      normal: [0, 0, 1],
      width: 1.7,
      height: 3.3,
      anchors: [],
    },
    // Lintel over the centred doorway
    {
      id: "door-lintel",
      label: "Door lintel",
      origin: [0, 2.55, 2.5],
      normal: [0, 0, -1],
      width: 2.8,
      height: 1.05,
      anchors: [],
    },
    // Seal exterior pockets where hall is wider than ante
    {
      id: "shoulder-east",
      label: "Hall–ante shoulder east",
      origin: [4, 0, 2.55],
      normal: [0, 0, 1],
      width: 2.1,
      height: 3.6,
      anchors: [],
    },
    {
      id: "shoulder-west",
      label: "Hall–ante shoulder west",
      origin: [-4, 0, 2.55],
      normal: [0, 0, 1],
      width: 2.1,
      height: 3.6,
      anchors: [],
    },
    {
      id: "shoulder-east-return",
      label: "Shoulder return east",
      origin: [3.05, 0, 4.5],
      normal: [1, 0, 0],
      width: 4,
      height: 3.5,
      anchors: [],
    },
    {
      id: "shoulder-west-return",
      label: "Shoulder return west",
      origin: [-3.05, 0, 4.5],
      normal: [-1, 0, 0],
      width: 4,
      height: 3.5,
      anchors: [],
    },
  ],
  spawn: { position: [0, 1.58, 5.2], yaw: Math.PI },
  walkBounds: [
    [-4.5, -6.0],
    [4.5, -6.0],
    [4.5, 2.2],
    [1.25, 2.2],
    [1.25, 2.8],
    [2.5, 2.8],
    [2.5, 6.0],
    [-2.5, 6.0],
    [-2.5, 2.8],
    [-1.25, 2.8],
    [-1.25, 2.2],
    [-4.5, 2.2],
  ],
  capacity: { recommended: 11, max: 15 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#2a2620",
    widthCm: 3.2,
    matteCm: 7,
    matteColor: "#f5f1e8",
  }),
  preview: { imagePath: "/templates/hall-antechamber/preview.jpg" },
};
