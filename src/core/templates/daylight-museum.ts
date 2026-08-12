import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Daylight Museum — flagship tall hall: coffered skylight, arched window,
 * two-tone walls, polished stone floor. Matches a real high-end museum look.
 * Free tier.
 */
export const daylightMuseumTemplate: SceneTemplate = {
  id: "daylight-museum",
  version: 1,
  name: "Daylight Museum",
  tagline: "Tall skylight hall, stone floor, museum band",
  category: "museum",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/daylight-museum/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.07,
    background: "#d8dde3",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f4f6f8", intensity: 0.24 },
    hemisphere: {
      skyColor: "#eef3f8",
      groundColor: "#b8c0c8",
      intensity: 0.44,
    },
    // Soft overhead skylight key (cool daylight, not wash-out).
    key: {
      color: "#f7f9fc",
      intensity: 1.38,
      position: [0.4, 9.2, 0.2],
    },
    // Window shaft from west wall.
    fill: {
      color: "#dce6f2",
      intensity: 0.55,
      position: [-7.5, 3.4, 1.2],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.2,
      position: [3.2, 4.2, -5],
    },
    presets: [
      { id: "daylight", label: "Daylight", spotIntensity: 1.18, temperatureK: 5200 },
      { id: "museum", label: "Museum", spotIntensity: 1.12, temperatureK: 4600 },
    ],
  },
  materials: {
    wall: "#f3f4f5",
    wallBand: "#8e9296",
    wallBandBottomM: 0.95,
    wallBandTopM: 2.45,
    floor: "#d2c8b8",
    ceiling: "#eef0f2",
    trim: "#d5d8dc",
    wallRoughness: 0.92,
    floorRoughness: 0.3,
    floorMetalness: 0.055,
    ceilingRoughness: 0.88,
    floorStyle: "stone",
    floorTextureId: "stone_tile",
    wallTextureId: "plaster_smooth",
  },
  architecture: {
    skylight: {
      width: 5.6,
      depth: 7.2,
      gridX: 3,
      gridZ: 4,
      recessM: 0.28,
    },
    window: {
      wallId: "west",
      width: 1.35,
      height: 3.55,
      sillM: 0.45,
      offsetM: -1.1,
      arched: true,
    },
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 6,
      lengthM: 10,
      center: [0, 0],
      spacingM: 6.4,
      intensity: 0.4,
      maxLive: 5,
      railColor: "#9aa0a6",
    },
    plinths: [
      { position: [-2.6, 0, 1.8], size: [0.55, 0.95, 0.55] },
      { position: [-2.35, 0, -0.4], size: [0.48, 0.72, 0.48] },
      { position: [2.8, 0, -2.6], size: [0.42, 1.15, 0.42] },
    ],
    benches: [
      {
        position: [0, 0, 3.2],
        size: [2.2, 0.42, 0.48],
        color: "#c9a878",
        glb: true,
      },
    ],
    glbProps: [
      { model: "bust", position: [-2.6, 0.95, 1.8], scale: 1.05 },
      { model: "vase", position: [-2.35, 0.72, -0.4], scale: 0.95 },
      { model: "plant", position: [4.4, 0, 5.2], scale: 1.3 },
      { model: "plant", position: [-4.4, 0, 5.2], scale: 1.25, yaw: 0.6 },
      { model: "plant", position: [4.6, 0, -5.4], scale: 1.22, yaw: -0.4 },
    ],
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -7],
      normal: [0, 0, 1],
      width: 12,
      height: 5,
      anchors: [
        { position: [-3.6, 1.85, 0.04], maxWidth: 2.4, maxHeight: 2.8, preferred: true },
        { position: [0, 1.9, 0.04], maxWidth: 2.6, maxHeight: 3.0, preferred: true },
        { position: [3.6, 1.85, 0.04], maxWidth: 2.4, maxHeight: 2.8 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [6, 0, 0],
      normal: [-1, 0, 0],
      width: 14,
      height: 5,
      anchors: [
        { position: [0.04, 1.85, -4.2], maxWidth: 2.2, maxHeight: 2.6 },
        { position: [0.04, 1.85, 0], maxWidth: 2.3, maxHeight: 2.7 },
        { position: [0.04, 1.85, 4.2], maxWidth: 2.2, maxHeight: 2.6 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-6, 0, 0],
      normal: [1, 0, 0],
      width: 14,
      height: 5,
      anchors: [
        // Leave centre-left clear for the arched window; hang flanking works.
        { position: [-0.04, 1.85, -4.4], maxWidth: 2.1, maxHeight: 2.5 },
        { position: [-0.04, 1.85, 3.8], maxWidth: 2.1, maxHeight: 2.5 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 7],
      normal: [0, 0, -1],
      width: 12,
      height: 5,
      anchors: [
        { position: [-3.0, 1.85, -0.04], maxWidth: 2.2, maxHeight: 2.6 },
        { position: [3.0, 1.85, -0.04], maxWidth: 2.2, maxHeight: 2.6 },
      ],
    },
  ],
  spawn: { position: [0, 1.65, 4.8], yaw: Math.PI },
  walkBounds: [
    [-5.2, -6.2],
    [5.2, -6.2],
    [5.2, 6.2],
    [-5.2, 6.2],
  ],
  capacity: { recommended: 10, max: 14 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#1a1c1e",
    widthCm: 2.5,
    matteCm: 5.5,
    matteColor: "#f5f6f7",
  }),
  preview: { imagePath: "/templates/daylight-museum/preview.jpg" },
};
