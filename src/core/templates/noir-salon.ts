import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Noir Salon — dark elegant evening gallery: charcoal hang walls, warm brass
 * track accents, polished dark stone. Art stays readable (MeshBasic canvas).
 * Pro tier.
 */
export const noirSalonTemplate: SceneTemplate = {
  id: "noir-salon",
  version: 1,
  name: "Noir Salon",
  tagline: "Charcoal evening salon, brass tracks, warm spots",
  category: "black",
  tier: "pro",
  status: "active",
  shell: {
    glbPath: "/templates/noir-salon/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 0.92,
    background: "#0c0c0e",
    toneMapping: "aces",
    fog: { color: "#0c0c0e", near: 9, far: 22 },
  },
  lighting: {
    ambient: { color: "#c8beb0", intensity: 0.14 },
    hemisphere: {
      skyColor: "#4a4038",
      groundColor: "#121014",
      intensity: 0.2,
    },
    // Warm overhead key — evening salon, not wash-out.
    key: {
      color: "#ffd4a0",
      intensity: 0.88,
      position: [0.2, 5.8, 0.8],
    },
    fill: {
      color: "#6a7280",
      intensity: 0.2,
      position: [-4.5, 2.8, -2],
    },
    rim: {
      color: "#ffe0b8",
      intensity: 0.32,
      position: [3.5, 3.4, -4.5],
    },
    presets: [
      { id: "evening", label: "Evening", spotIntensity: 1.55, temperatureK: 3200 },
      { id: "salon", label: "Salon", spotIntensity: 1.35, temperatureK: 3600 },
    ],
  },
  materials: {
    wall: "#1a1b1e",
    wallBand: "#2a2c30",
    wallBandBottomM: 0.85,
    wallBandTopM: 2.35,
    floor: "#161418",
    ceiling: "#101012",
    trim: "#b8956a",
    wallRoughness: 0.86,
    floorRoughness: 0.28,
    floorMetalness: 0.14,
    ceilingRoughness: 0.95,
    floorStyle: "stone",
    floorTextureId: "stone_tile",
    wallTextureId: "plaster_smooth",
  },
  architecture: {
    beams: {
      axis: "x",
      count: 8,
      lengthM: 11.5,
      center: [0, 0],
      spacingM: 1.85,
      color: "#2a241c",
      widthM: 0.18,
      heightM: 0.22,
    },
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 8,
      lengthM: 13,
      center: [0, 0],
      spacingM: 6.4,
      railColor: "#b8956a",
      intensity: 0.55,
      maxLive: 6,
    },
    plinths: [
      { position: [-2.8, 0, 1.6], size: [0.5, 0.95, 0.5] },
      { position: [2.9, 0, -2.2], size: [0.46, 0.85, 0.46] },
    ],
    benches: [
      {
        position: [0, 0, 2.8],
        size: [2.4, 0.42, 0.48],
        color: "#3a3228",
        glb: true,
      },
      {
        position: [-3.4, 0, -3.4],
        size: [1.6, 0.4, 0.46],
        color: "#3a3228",
        yaw: Math.PI / 2,
        glb: true,
      },
    ],
    glbProps: [
      { model: "bust", position: [-2.8, 0.95, 1.6], scale: 1.08 },
      { model: "vase", position: [2.9, 0.85, -2.2], scale: 1.0 },
      { model: "plinth_table", position: [4.2, 0, 4.6], scale: 1.05 },
      { model: "plinth_table", position: [-4.2, 0, 4.5], scale: 1.0, yaw: 0.4 },
      { model: "plant", position: [4.55, 0, 5.35], scale: 1.28, yaw: -0.3 },
      { model: "plant", position: [-4.55, 0, 5.35], scale: 1.25, yaw: 0.8 },
      { model: "plant", position: [4.55, 0, -5.4], scale: 1.22, yaw: 0.4 },
      { model: "plant", position: [-4.5, 0, -5.35], scale: 1.2, yaw: 1.0 },
    ],
    signs: [
      {
        text: "NOIR SALON",
        subtitle: "Evening hang",
        position: [0, 3.55, -6.25],
        yaw: 0,
        width: 4.2,
        height: 0.8,
        style: "wall",
      },
      {
        text: "Noir Salon",
        subtitle: "Private viewing",
        position: [0, 0, 5.55],
        yaw: Math.PI,
        width: 1.05,
        height: 0.38,
        style: "plaque",
      },
    ],
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -6.4],
      normal: [0, 0, 1],
      width: 12,
      height: 4.4,
      anchors: [
        { position: [-3.4, 1.72, 0.04], maxWidth: 2.2, maxHeight: 2.5, preferred: true },
        { position: [0, 1.75, 0.04], maxWidth: 2.4, maxHeight: 2.7, preferred: true },
        { position: [3.4, 1.72, 0.04], maxWidth: 2.2, maxHeight: 2.5 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [6, 0, 0],
      normal: [-1, 0, 0],
      width: 12.8,
      height: 4.4,
      anchors: [
        { position: [0.04, 1.7, -3.5], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [0.04, 1.72, 0], maxWidth: 2.2, maxHeight: 2.5, preferred: true },
        { position: [0.04, 1.7, 3.5], maxWidth: 2.0, maxHeight: 2.3 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-6, 0, 0],
      normal: [1, 0, 0],
      width: 12.8,
      height: 4.4,
      anchors: [
        { position: [-0.04, 1.7, -3.5], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [-0.04, 1.72, 0], maxWidth: 2.2, maxHeight: 2.5 },
        { position: [-0.04, 1.7, 3.5], maxWidth: 2.0, maxHeight: 2.3 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 6.4],
      normal: [0, 0, -1],
      width: 12,
      height: 4.4,
      anchors: [
        { position: [-2.8, 1.7, -0.04], maxWidth: 2.1, maxHeight: 2.4 },
        { position: [2.8, 1.7, -0.04], maxWidth: 2.1, maxHeight: 2.4 },
      ],
    },
  ],
  spawn: { position: [0, 1.6, 3.8], yaw: Math.PI },
  walkBounds: [
    [-5.2, -5.55],
    [5.2, -5.55],
    [5.2, 5.55],
    [-5.2, 5.55],
  ],
  capacity: { recommended: 11, max: 15 },
  frameDefaults: createFrameSpec({
    style: "thin",
    color: "#0e0e10",
    widthCm: 2.2,
    matteCm: 2,
    matteColor: "#141416",
  }),
  preview: { imagePath: "/templates/noir-salon/preview.jpg" },
};
