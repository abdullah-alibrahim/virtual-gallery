import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Harbor Pavilion — bright coastal flagship: long pale stone hall, coffered
 * skylight, arched morning window on the west light wall. Soft sea daylight.
 * Free tier.
 */
export const harborPavilionTemplate: SceneTemplate = {
  id: "harbor-pavilion",
  version: 1,
  name: "Harbor Pavilion",
  tagline: "Coastal daylight, pale stone, long light wall",
  category: "coastal",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/harbor-pavilion/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.08,
    background: "#d6e0e6",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#eef5f8", intensity: 0.3 },
    hemisphere: {
      skyColor: "#e8f2f8",
      groundColor: "#a8b8c0",
      intensity: 0.48,
    },
    // Soft morning through the west light wall.
    key: {
      color: "#fff0dc",
      intensity: 1.42,
      position: [-9.5, 6.8, -1.5],
    },
    // Cool skylight fill.
    fill: {
      color: "#e4eef6",
      intensity: 0.62,
      position: [0.3, 9.5, 0.2],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.18,
      position: [4, 4.2, -7],
    },
    presets: [
      { id: "morning", label: "Morning", spotIntensity: 0.92, temperatureK: 5000 },
      { id: "harbor", label: "Harbor", spotIntensity: 1.05, temperatureK: 5600 },
    ],
  },
  materials: {
    wall: "#f4f7f8",
    wallBand: "#9aa6ac",
    wallBandBottomM: 0.9,
    wallBandTopM: 2.4,
    floor: "#c8d0d4",
    ceiling: "#f7fafb",
    trim: "#d0dae0",
    wallRoughness: 0.94,
    floorRoughness: 0.34,
    floorMetalness: 0.05,
    ceilingRoughness: 0.9,
    floorStyle: "stone",
  },
  architecture: {
    skylight: {
      width: 4.8,
      depth: 9.5,
      gridX: 2,
      gridZ: 5,
      recessM: 0.26,
    },
    window: {
      wallId: "west",
      width: 1.55,
      height: 3.7,
      sillM: 0.42,
      offsetM: -1.4,
      arched: true,
    },
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 7,
      lengthM: 15,
      center: [0, 0],
      spacingM: 7.2,
      intensity: 0.32,
      maxLive: 5,
      railColor: "#8a9498",
    },
    plinths: [
      { position: [-3.2, 0, 2.4], size: [0.52, 0.9, 0.52] },
      { position: [-2.9, 0, -0.8], size: [0.46, 0.7, 0.46] },
      { position: [3.4, 0, -3.5], size: [0.44, 1.05, 0.44] },
    ],
    benches: [
      {
        position: [0, 0, 4.2],
        size: [2.6, 0.42, 0.48],
        color: "#c4b49a",
        glb: true,
      },
      {
        position: [0, 0, -2.5],
        size: [2.4, 0.42, 0.48],
        color: "#c4b49a",
        glb: true,
      },
    ],
    glbProps: [
      { model: "bust", position: [-3.2, 0.9, 2.4], scale: 1.05 },
      { model: "vase", position: [-2.9, 0.7, -0.8], scale: 0.95 },
      { model: "plant", position: [5.35, 0, 7.4], scale: 1.35 },
      { model: "plant", position: [-5.35, 0, 7.4], scale: 1.3, yaw: 0.7 },
      { model: "plant", position: [5.4, 0, -7.5], scale: 1.28, yaw: -0.4 },
      { model: "plant", position: [-5.4, 0, -7.5], scale: 1.32, yaw: 1.0 },
    ],
    signs: [
      {
        text: "HARBOR PAVILION",
        subtitle: "Exhibition",
        position: [0, 3.85, -8.35],
        yaw: 0,
        width: 4.8,
        height: 0.85,
        style: "wall",
      },
      {
        text: "Harbor Pavilion",
        subtitle: "Morning collection",
        position: [0, 0, 7.55],
        yaw: Math.PI,
        width: 1.1,
        height: 0.4,
        style: "plaque",
      },
    ],
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -8.5],
      normal: [0, 0, 1],
      width: 13,
      height: 5.1,
      anchors: [
        { position: [-4.0, 1.82, 0.04], maxWidth: 2.3, maxHeight: 2.7 },
        { position: [0, 1.88, 0.04], maxWidth: 2.6, maxHeight: 3.0, preferred: true },
        { position: [4.0, 1.82, 0.04], maxWidth: 2.3, maxHeight: 2.7 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [6.5, 0, 0],
      normal: [-1, 0, 0],
      width: 17,
      height: 5.1,
      anchors: [
        { position: [0.04, 1.82, -5.5], maxWidth: 2.2, maxHeight: 2.6 },
        { position: [0.04, 1.85, -2.0], maxWidth: 2.3, maxHeight: 2.7 },
        { position: [0.04, 1.85, 2.0], maxWidth: 2.3, maxHeight: 2.7, preferred: true },
        { position: [0.04, 1.82, 5.5], maxWidth: 2.2, maxHeight: 2.6 },
      ],
    },
    {
      id: "west",
      label: "West light wall",
      origin: [-6.5, 0, 0],
      normal: [1, 0, 0],
      width: 17,
      height: 5.1,
      anchors: [
        // Leave bay clear for the arched morning window (offset −1.4).
        { position: [-0.04, 1.82, -5.8], maxWidth: 2.1, maxHeight: 2.5 },
        { position: [-0.04, 1.82, 4.2], maxWidth: 2.1, maxHeight: 2.5 },
        { position: [-0.04, 1.82, 6.6], maxWidth: 2.0, maxHeight: 2.4 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 8.5],
      normal: [0, 0, -1],
      width: 13,
      height: 5.1,
      anchors: [
        { position: [-3.4, 1.82, -0.04], maxWidth: 2.2, maxHeight: 2.6 },
        { position: [3.4, 1.82, -0.04], maxWidth: 2.2, maxHeight: 2.6 },
      ],
    },
  ],
  spawn: { position: [0, 1.65, 5.8], yaw: Math.PI },
  walkBounds: [
    [-5.7, -7.7],
    [5.7, -7.7],
    [5.7, 7.7],
    [-5.7, 7.7],
  ],
  capacity: { recommended: 14, max: 18 },
  frameDefaults: createFrameSpec({
    style: "thin",
    color: "#2a3438",
    widthCm: 2.2,
    matteCm: 6,
    matteColor: "#f6f9fa",
  }),
  preview: { imagePath: "/templates/harbor-pavilion/preview.jpg" },
};
