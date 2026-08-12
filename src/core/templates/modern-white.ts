import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Modern White — the default free template.
 * Quiet white cube with museum polish: plaster walls, oak floor, soft tracks.
 */
export const modernWhiteTemplate: SceneTemplate = {
  id: "modern-white",
  version: 4,
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
    exposure: 1.06,
    background: "#e8e4dc",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f7f5f0", intensity: 0.28 },
    hemisphere: {
      skyColor: "#f5f7fa",
      groundColor: "#cfcabe",
      intensity: 0.4,
    },
    key: {
      color: "#fff6eb",
      intensity: 1.22,
      position: [-2.5, 5.5, 3.2],
    },
    fill: {
      color: "#dce6f2",
      intensity: 0.4,
      position: [3.5, 3.2, -2],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.2,
      position: [0, 2.8, -4.5],
    },
    presets: [
      { id: "soft", label: "Soft", spotIntensity: 1.05, temperatureK: 4200 },
      { id: "bright", label: "Bright", spotIntensity: 1.18, temperatureK: 4800 },
    ],
  },
  materials: {
    wall: "#f4f2ec",
    wallBand: "#ddd8ce",
    wallBandBottomM: 0.88,
    wallBandTopM: 2.35,
    floor: "#cfc4b0",
    ceiling: "#faf9f6",
    trim: "#cfc9bc",
    wallRoughness: 0.92,
    floorRoughness: 0.42,
    floorMetalness: 0.05,
    ceilingRoughness: 0.96,
    floorStyle: "plank",
    floorTextureId: "wood_plank",
    wallTextureId: "plaster_smooth",
  },
  architecture: {
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 5,
      lengthM: 8.5,
      center: [0, 0],
      spacingM: 5.6,
      intensity: 0.4,
      maxLive: 5,
      railColor: "#9a9590",
    },
    plinths: [
      { position: [-2.2, 0, -1.2], size: [0.42, 0.82, 0.42] },
      { position: [2.2, 0, -1.2], size: [0.42, 0.82, 0.42] },
    ],
    benches: [
      {
        position: [0, 0, 1.6],
        size: [2.0, 0.42, 0.48],
        color: "#c9a878",
        glb: true,
      },
      {
        position: [-3.2, 0, -2.8],
        size: [1.4, 0.4, 0.44],
        color: "#c9a878",
        yaw: Math.PI / 2,
        glb: true,
      },
    ],
    glbProps: [
      { model: "bust", position: [-2.2, 0.82, -1.2], scale: 1.0 },
      { model: "vase", position: [2.2, 0.82, -1.2], scale: 0.95 },
      { model: "plant", position: [4.2, 0, 4.2], scale: 1.25, yaw: 0.4 },
      { model: "plant", position: [-4.2, 0, 4.2], scale: 1.2, yaw: -0.5 },
      { model: "plant", position: [4.15, 0, -4.15], scale: 1.18, yaw: -0.3 },
      { model: "plant", position: [-4.15, 0, -4.15], scale: 1.22, yaw: 0.9 },
      { model: "plinth_table", position: [3.6, 0, 3.4], scale: 1.0 },
    ],
    signs: [
      {
        text: "MODERN WHITE",
        subtitle: "Quiet Rooms",
        position: [0, 2.95, -4.85],
        yaw: 0,
        width: 3.6,
        height: 0.62,
        style: "wall",
      },
    ],
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -5],
      normal: [0, 0, 1],
      width: 10,
      height: 3.6,
      anchors: [
        { position: [-3.2, 1.6, 0.04], maxWidth: 2.2, maxHeight: 2.2, preferred: true },
        { position: [0, 1.6, 0.04], maxWidth: 2.4, maxHeight: 2.4, preferred: true },
        { position: [3.2, 1.6, 0.04], maxWidth: 2.2, maxHeight: 2.2 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [5, 0, 0],
      normal: [-1, 0, 0],
      width: 10,
      height: 3.6,
      anchors: [
        { position: [0.04, 1.6, -2.5], maxWidth: 2, maxHeight: 2 },
        { position: [0.04, 1.6, 2.5], maxWidth: 2, maxHeight: 2 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-5, 0, 0],
      normal: [1, 0, 0],
      width: 10,
      height: 3.6,
      anchors: [
        { position: [-0.04, 1.6, -2.5], maxWidth: 2, maxHeight: 2 },
        { position: [-0.04, 1.6, 2.5], maxWidth: 2, maxHeight: 2 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 5],
      normal: [0, 0, -1],
      width: 10,
      height: 3.6,
      anchors: [
        { position: [-2.5, 1.6, -0.04], maxWidth: 2, maxHeight: 2 },
        { position: [2.5, 1.6, -0.04], maxWidth: 2, maxHeight: 2 },
      ],
    },
  ],
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
    matteCm: 7,
    matteColor: "#f7f4ec",
  }),
  preview: { imagePath: "/templates/modern-white/preview.jpg" },
};
