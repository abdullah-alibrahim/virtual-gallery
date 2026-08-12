import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Luxury — warm stone, tall walls, fewer hero anchors.
 * Pro tier. Declared as data so adding it never requires renderer changes.
 */
export const luxuryTemplate: SceneTemplate = {
  id: "luxury",
  version: 2,
  name: "Luxury",
  tagline: "Warm limestone, tall walls, evening glow",
  category: "luxury",
  tier: "pro",
  status: "active",
  shell: {
    glbPath: "/templates/luxury/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.1,
    background: "#1a1612",
    toneMapping: "aces",
    fog: { color: "#1a1612", near: 10, far: 26 },
  },
  lighting: {
    ambient: { color: "#f0e6d4", intensity: 0.28 },
    hemisphere: {
      skyColor: "#e8d4b8",
      groundColor: "#3a2e24",
      intensity: 0.32,
    },
    key: {
      color: "#ffd4a0",
      intensity: 1.2,
      position: [-1.5, 6.5, 2.5],
    },
    fill: {
      color: "#c4a888",
      intensity: 0.3,
      position: [4, 3, -3],
    },
    rim: {
      color: "#ffe0b8",
      intensity: 0.22,
      position: [0, 3.5, -5],
    },
    presets: [
      { id: "warm", label: "Warm", spotIntensity: 1.55, temperatureK: 3000 },
      { id: "evening", label: "Evening", spotIntensity: 1.25, temperatureK: 2700 },
    ],
  },
  materials: {
    wall: "#2a241c",
    wallBand: "#3d3428",
    wallBandBottomM: 0.9,
    wallBandTopM: 2.5,
    floor: "#1e1914",
    ceiling: "#16120e",
    trim: "#b8956a",
    wallRoughness: 0.86,
    floorRoughness: 0.32,
    floorMetalness: 0.1,
    ceilingRoughness: 0.95,
    floorStyle: "stone",
    floorTextureId: "stone_tile",
    wallTextureId: "plaster_smooth",
  },
  architecture: {
    beams: {
      axis: "x",
      count: 7,
      lengthM: 11,
      center: [0, 0],
      spacingM: 1.9,
      color: "#3a2e22",
      widthM: 0.16,
      heightM: 0.2,
    },
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 6,
      lengthM: 11,
      center: [0, 0],
      spacingM: 6.5,
      intensity: 0.5,
      maxLive: 5,
      railColor: "#b8956a",
    },
    plinths: [
      { position: [-2.6, 0, 1.2], size: [0.5, 0.95, 0.5] },
      { position: [2.6, 0, -1.5], size: [0.48, 0.88, 0.48] },
    ],
    benches: [
      {
        position: [0, 0, 2.6],
        size: [2.4, 0.42, 0.5],
        color: "#3a3228",
        glb: true,
      },
    ],
    glbProps: [
      { model: "bust", position: [-2.6, 0.95, 1.2], scale: 1.08 },
      { model: "vase", position: [2.6, 0.88, -1.5], scale: 1.0 },
      { model: "plant", position: [5.0, 0, 4.8], scale: 1.3, yaw: -0.3 },
      { model: "plant", position: [-5.0, 0, 4.8], scale: 1.28, yaw: 0.7 },
      { model: "plant", position: [5.0, 0, -4.8], scale: 1.22, yaw: 0.4 },
      { model: "plinth_table", position: [4.3, 0, 4.2], scale: 1.05 },
    ],
    signs: [
      {
        text: "LUXURY",
        subtitle: "Evening glow",
        position: [0, 3.55, -5.85],
        yaw: 0,
        width: 3.8,
        height: 0.72,
        style: "wall",
      },
    ],
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -6],
      normal: [0, 0, 1],
      width: 12,
      height: 4.2,
      anchors: [
        { position: [-3.8, 1.85, 0.04], maxWidth: 2.4, maxHeight: 2.8, preferred: true },
        { position: [0, 1.9, 0.04], maxWidth: 2.8, maxHeight: 3.0, preferred: true },
        { position: [3.8, 1.85, 0.04], maxWidth: 2.4, maxHeight: 2.8 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [6, 0, 0],
      normal: [-1, 0, 0],
      width: 12,
      height: 4.2,
      anchors: [
        { position: [0.04, 1.85, -3.2], maxWidth: 2.2, maxHeight: 2.6 },
        { position: [0.04, 1.85, 3.2], maxWidth: 2.2, maxHeight: 2.6 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-6, 0, 0],
      normal: [1, 0, 0],
      width: 12,
      height: 4.2,
      anchors: [
        { position: [-0.04, 1.85, -3.2], maxWidth: 2.2, maxHeight: 2.6 },
        { position: [-0.04, 1.85, 3.2], maxWidth: 2.2, maxHeight: 2.6 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 6],
      normal: [0, 0, -1],
      width: 12,
      height: 4.2,
      anchors: [
        { position: [-2.8, 1.85, -0.04], maxWidth: 2.3, maxHeight: 2.7 },
        { position: [2.8, 1.85, -0.04], maxWidth: 2.3, maxHeight: 2.7 },
      ],
    },
  ],
  spawn: { position: [0, 1.7, 4.2], yaw: Math.PI },
  walkBounds: [
    [-5.2, -5.2],
    [5.2, -5.2],
    [5.2, 5.2],
    [-5.2, 5.2],
  ],
  capacity: { recommended: 8, max: 12 },
  frameDefaults: createFrameSpec({
    style: "ornate",
    color: "#2a2218",
    widthCm: 4,
    matteCm: 6,
    matteColor: "#f3eee4",
  }),
  preview: { imagePath: "/templates/luxury/preview.jpg" },
};
