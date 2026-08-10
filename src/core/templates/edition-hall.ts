import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Edition Hall — refined white cube with perfect hang rhythm, picture rail
 * band, soft track accents, understated stone floor. Free tier.
 */
export const editionHallTemplate: SceneTemplate = {
  id: "edition-hall",
  version: 1,
  name: "Edition Hall",
  tagline: "White cube, picture rail, measured hang rhythm",
  category: "museum",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/edition-hall/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.05,
    background: "#dce0e4",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f6f7f8", intensity: 0.3 },
    hemisphere: {
      skyColor: "#f0f2f5",
      groundColor: "#b8bcc2",
      intensity: 0.44,
    },
    key: {
      color: "#f8f9fb",
      intensity: 1.32,
      position: [0.3, 8.5, 0.4],
    },
    fill: {
      color: "#e4e8ee",
      intensity: 0.42,
      position: [-6, 3.2, 1],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.16,
      position: [3.5, 3.8, -5],
    },
    presets: [
      { id: "edition", label: "Edition", spotIntensity: 1.0, temperatureK: 4800 },
      { id: "daylight", label: "Daylight", spotIntensity: 1.1, temperatureK: 5200 },
    ],
  },
  materials: {
    wall: "#f7f7f6",
    // Narrow picture-rail band just above hang centreline.
    wallBand: "#d8dadc",
    wallBandBottomM: 2.55,
    wallBandTopM: 2.72,
    floor: "#d4cec4",
    ceiling: "#f2f3f4",
    trim: "#e0e2e4",
    wallRoughness: 0.95,
    floorRoughness: 0.36,
    floorMetalness: 0.035,
    ceilingRoughness: 0.92,
    floorStyle: "stone",
  },
  architecture: {
    skylight: {
      width: 5.2,
      depth: 5.2,
      gridX: 3,
      gridZ: 3,
      recessM: 0.24,
    },
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 6,
      lengthM: 11,
      center: [0, 0],
      spacingM: 7.0,
      intensity: 0.34,
      maxLive: 5,
      railColor: "#9a9ea2",
    },
    plinths: [
      { position: [-2.4, 0, 0], size: [0.48, 0.88, 0.48] },
      { position: [2.4, 0, 0], size: [0.48, 0.88, 0.48] },
    ],
    benches: [
      {
        position: [0, 0, 2.6],
        size: [2.2, 0.42, 0.48],
        color: "#c9b89a",
        glb: true,
      },
    ],
    glbProps: [
      { model: "bust", position: [-2.4, 0.88, 0], scale: 1.02 },
      { model: "vase", position: [2.4, 0.88, 0], scale: 0.92 },
      { model: "plant", position: [4.7, 0, 5.0], scale: 1.28 },
      { model: "plant", position: [-4.7, 0, 5.0], scale: 1.25, yaw: 0.7 },
      { model: "plant", position: [4.7, 0, -5.0], scale: 1.22, yaw: -0.4 },
      { model: "plant", position: [-4.7, 0, -5.0], scale: 1.25, yaw: 1.0 },
    ],
    signs: [
      {
        text: "EDITION HALL",
        subtitle: "Works on paper",
        position: [0, 3.65, -5.85],
        yaw: 0,
        width: 4.0,
        height: 0.75,
        style: "wall",
      },
      {
        text: "Edition Hall",
        subtitle: "Measured hang",
        position: [0, 0, 5.15],
        yaw: Math.PI,
        width: 1.0,
        height: 0.38,
        style: "plaque",
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
      height: 4.6,
      anchors: [
        // Even hang rhythm — equal spacing, matched sizes.
        { position: [-3.6, 1.7, 0.04], maxWidth: 2.0, maxHeight: 2.3, preferred: true },
        { position: [-1.2, 1.7, 0.04], maxWidth: 2.0, maxHeight: 2.3, preferred: true },
        { position: [1.2, 1.7, 0.04], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [3.6, 1.7, 0.04], maxWidth: 2.0, maxHeight: 2.3 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [6, 0, 0],
      normal: [-1, 0, 0],
      width: 12,
      height: 4.6,
      anchors: [
        { position: [0.04, 1.7, -3.6], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [0.04, 1.7, -1.2], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [0.04, 1.7, 1.2], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [0.04, 1.7, 3.6], maxWidth: 2.0, maxHeight: 2.3 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-6, 0, 0],
      normal: [1, 0, 0],
      width: 12,
      height: 4.6,
      anchors: [
        { position: [-0.04, 1.7, -3.6], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [-0.04, 1.7, -1.2], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [-0.04, 1.7, 1.2], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [-0.04, 1.7, 3.6], maxWidth: 2.0, maxHeight: 2.3 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 6],
      normal: [0, 0, -1],
      width: 12,
      height: 4.6,
      anchors: [
        { position: [-2.4, 1.7, -0.04], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [2.4, 1.7, -0.04], maxWidth: 2.0, maxHeight: 2.3 },
      ],
    },
  ],
  spawn: { position: [0, 1.62, 3.6], yaw: Math.PI },
  walkBounds: [
    [-5.2, -5.2],
    [5.2, -5.2],
    [5.2, 5.2],
    [-5.2, 5.2],
  ],
  capacity: { recommended: 12, max: 16 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#1c1e20",
    widthCm: 2.0,
    matteCm: 7,
    matteColor: "#f8f8f7",
  }),
  preview: { imagePath: "/templates/edition-hall/preview.jpg" },
};
