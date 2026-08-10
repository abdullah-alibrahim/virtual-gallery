import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Modern White — the default free template.
 *
 * Geometry is declared as walls + walkBounds so the renderer can build a
 * walkable room without a GLB. `shell.glbPath` is optional dressing for later.
 */
export const modernWhiteTemplate: SceneTemplate = {
  id: "modern-white",
  version: 3,
  name: "Modern White",
  tagline: "Clean plaster, soft north light",
  category: "white",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/modern-white/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.02,
    background: "#ebe9e3",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f7f5f0", intensity: 0.48 },
    hemisphere: {
      skyColor: "#f5f7fa",
      groundColor: "#cfcabe",
      intensity: 0.44,
    },
    key: {
      color: "#fff6eb",
      intensity: 1.12,
      position: [-2.5, 5.5, 3.2],
    },
    fill: {
      color: "#dce6f2",
      intensity: 0.36,
      position: [3.5, 3.2, -2],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.18,
      position: [0, 2.8, -4.5],
    },
    presets: [
      { id: "soft", label: "Soft", spotIntensity: 0.98, temperatureK: 4000 },
      { id: "bright", label: "Bright", spotIntensity: 1.2, temperatureK: 4500 },
    ],
  },
  materials: {
    wall: "#f4f2ec",
    floor: "#cfc4b0",
    ceiling: "#faf9f6",
    trim: "#cfc9bc",
    wallRoughness: 0.94,
    floorRoughness: 0.68,
    floorMetalness: 0.035,
    ceilingRoughness: 1,
    floorStyle: "plank",
  },
  architecture: {
    benches: [
      {
        position: [0, 0, 1.4],
        size: [1.8, 0.42, 0.48],
        color: "#c9a878",
        glb: true,
      },
    ],
    glbProps: [
      { model: "plant", position: [4.2, 0, 4.2], scale: 1.2, yaw: 0.4 },
      { model: "plant", position: [-4.2, 0, 4.2], scale: 1.15, yaw: -0.5 },
      { model: "vase", position: [-3.6, 0, -4.2], scale: 1.1 },
      { model: "bust", position: [3.8, 0, -4.0], scale: 1.15 },
    ],
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -5],
      normal: [0, 0, 1],
      width: 10,
      height: 3.4,
      anchors: [
        { position: [-3.2, 1.55, 0.04], maxWidth: 2.2, maxHeight: 2.2, preferred: true },
        { position: [0, 1.55, 0.04], maxWidth: 2.4, maxHeight: 2.4, preferred: true },
        { position: [3.2, 1.55, 0.04], maxWidth: 2.2, maxHeight: 2.2 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [5, 0, 0],
      normal: [-1, 0, 0],
      width: 10,
      height: 3.4,
      anchors: [
        { position: [0.04, 1.55, -2.5], maxWidth: 2, maxHeight: 2 },
        { position: [0.04, 1.55, 2.5], maxWidth: 2, maxHeight: 2 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-5, 0, 0],
      normal: [1, 0, 0],
      width: 10,
      height: 3.4,
      anchors: [
        { position: [-0.04, 1.55, -2.5], maxWidth: 2, maxHeight: 2 },
        { position: [-0.04, 1.55, 2.5], maxWidth: 2, maxHeight: 2 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 5],
      normal: [0, 0, -1],
      width: 10,
      height: 3.4,
      anchors: [
        { position: [-2.5, 1.55, -0.04], maxWidth: 2, maxHeight: 2 },
        { position: [2.5, 1.55, -0.04], maxWidth: 2, maxHeight: 2 },
      ],
    },
  ],
  // Centre-ish of the room, eye height, facing north wall art (−Z).
  spawn: { position: [0, 1.6, 2.4], yaw: 0 },
  walkBounds: [
    [-4.4, -4.4],
    [4.4, -4.4],
    [4.4, 4.4],
    [-4.4, 4.4],
  ],
  capacity: { recommended: 8, max: 12 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#1a1a1a",
    widthCm: 3.2,
    matteCm: 6,
    matteColor: "#f7f4ec",
  }),
  preview: { imagePath: "/templates/modern-white/preview.jpg" },
};
