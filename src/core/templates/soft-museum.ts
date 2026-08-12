import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Soft Museum — quiet museum grey with oak parquet and soft track accents.
 * Free tier.
 */
export const softMuseumTemplate: SceneTemplate = {
  id: "soft-museum",
  version: 2,
  name: "Soft Museum",
  tagline: "Museum grey, oak parquet, even wash",
  category: "museum",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/soft-museum/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.06,
    background: "#d6d1c8",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f5f2eb", intensity: 0.28 },
    hemisphere: {
      skyColor: "#f8f5ef",
      groundColor: "#c4b8a8",
      intensity: 0.38,
    },
    key: {
      color: "#fff8ee",
      intensity: 1.18,
      position: [-1, 5.8, 2.5],
    },
    fill: {
      color: "#e8e4dc",
      intensity: 0.42,
      position: [3.5, 3, -2],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.18,
      position: [0, 3, -4.8],
    },
    presets: [
      { id: "museum", label: "Museum", spotIntensity: 1.08, temperatureK: 4300 },
      { id: "soft", label: "Soft", spotIntensity: 1.15, temperatureK: 4000 },
    ],
  },
  materials: {
    wall: "#e6e2da",
    wallBand: "#cfc6b8",
    wallBandBottomM: 0.9,
    wallBandTopM: 2.4,
    floor: "#b59a72",
    ceiling: "#f2efe8",
    trim: "#cfc6b8",
    wallRoughness: 0.92,
    floorRoughness: 0.38,
    floorMetalness: 0.055,
    ceilingRoughness: 0.95,
    floorStyle: "parquet",
    floorTextureId: "wood_parquet",
    wallTextureId: "plaster_smooth",
  },
  architecture: {
    skylight: {
      width: 3.8,
      depth: 3.8,
      gridX: 2,
      gridZ: 2,
      recessM: 0.22,
    },
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 5,
      lengthM: 9,
      center: [0, 0],
      spacingM: 5.8,
      intensity: 0.42,
      maxLive: 5,
      railColor: "#a89f92",
    },
    plinths: [
      { position: [-2.3, 0, 0.4], size: [0.44, 0.86, 0.44] },
      { position: [2.3, 0, 0.4], size: [0.44, 0.86, 0.44] },
    ],
    benches: [
      {
        position: [0, 0, 2.2],
        size: [2.1, 0.42, 0.48],
        color: "#a88858",
        glb: true,
      },
    ],
    glbProps: [
      { model: "bust", position: [-2.3, 0.86, 0.4], scale: 1.02 },
      { model: "vase", position: [2.3, 0.86, 0.4], scale: 0.95 },
      { model: "plant", position: [4.35, 0, 4.35], scale: 1.22, yaw: 0.5 },
      { model: "plant", position: [-4.35, 0, 4.35], scale: 1.2, yaw: -0.4 },
      { model: "plant", position: [4.3, 0, -4.3], scale: 1.18, yaw: -0.2 },
      { model: "plinth_table", position: [3.7, 0, 3.5], scale: 1.0 },
    ],
    signs: [
      {
        text: "SOFT MUSEUM",
        subtitle: "Quiet hang",
        position: [0, 3.05, -5.05],
        yaw: 0,
        width: 3.8,
        height: 0.65,
        style: "wall",
      },
    ],
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -5.2],
      normal: [0, 0, 1],
      width: 10.5,
      height: 3.7,
      anchors: [
        { position: [-3.3, 1.65, 0.04], maxWidth: 2.2, maxHeight: 2.3, preferred: true },
        { position: [0, 1.65, 0.04], maxWidth: 2.4, maxHeight: 2.5, preferred: true },
        { position: [3.3, 1.65, 0.04], maxWidth: 2.2, maxHeight: 2.3 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [5.25, 0, 0],
      normal: [-1, 0, 0],
      width: 10.5,
      height: 3.7,
      anchors: [
        { position: [0.04, 1.65, -2.6], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [0.04, 1.65, 2.6], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-5.25, 0, 0],
      normal: [1, 0, 0],
      width: 10.5,
      height: 3.7,
      anchors: [
        { position: [-0.04, 1.65, -2.6], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [-0.04, 1.65, 2.6], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 5.2],
      normal: [0, 0, -1],
      width: 10.5,
      height: 3.7,
      anchors: [
        { position: [-2.4, 1.65, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [2.4, 1.65, -0.04], maxWidth: 1.9, maxHeight: 2.1 },
      ],
    },
  ],
  spawn: { position: [0, 1.58, 3.4], yaw: Math.PI },
  walkBounds: [
    [-4.5, -4.5],
    [4.5, -4.5],
    [4.5, 4.5],
    [-4.5, 4.5],
  ],
  capacity: { recommended: 8, max: 12 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#2a2620",
    widthCm: 3.5,
    matteCm: 7,
    matteColor: "#f5f1e8",
  }),
  preview: { imagePath: "/templates/soft-museum/preview.jpg" },
};
