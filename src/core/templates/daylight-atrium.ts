import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Daylight Atrium — tall, bright volume with cool skylight bounce.
 * Free tier.
 */
export const daylightAtriumTemplate: SceneTemplate = {
  id: "daylight-atrium",
  version: 1,
  name: "Daylight Atrium",
  tagline: "Tall white volume, cool skylight, open floor",
  category: "atrium",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/daylight-atrium/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.18,
    background: "#e4e8ec",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#ffffff", intensity: 0.42 },
    hemisphere: {
      skyColor: "#f4f8fc",
      groundColor: "#c8d0d8",
      intensity: 0.55,
    },
    key: {
      color: "#ffffff",
      intensity: 1.55,
      position: [0, 9, 0.5],
    },
    fill: {
      color: "#d8e4f0",
      intensity: 0.45,
      position: [-4, 3.5, 3],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.25,
      position: [3, 4, -4],
    },
    presets: [
      { id: "skylight", label: "Skylight", spotIntensity: 1.2, temperatureK: 5600 },
      { id: "bright", label: "Bright", spotIntensity: 1.5, temperatureK: 5200 },
    ],
  },
  materials: {
    wall: "#f6f7f8",
    floor: "#cfd6dc",
    ceiling: "#eef1f4",
    trim: "#d4dae0",
    wallRoughness: 0.93,
    floorRoughness: 0.68,
    floorMetalness: 0.06,
    ceilingRoughness: 0.85,
    floorStyle: "stone",
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -6.5],
      normal: [0, 0, 1],
      width: 13,
      height: 4.8,
      anchors: [
        { position: [-4.2, 2.1, 0.04], maxWidth: 2.6, maxHeight: 3.0, preferred: true },
        { position: [0, 2.15, 0.04], maxWidth: 2.8, maxHeight: 3.2, preferred: true },
        { position: [4.2, 2.1, 0.04], maxWidth: 2.6, maxHeight: 3.0 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [6.5, 0, 0],
      normal: [-1, 0, 0],
      width: 13,
      height: 4.8,
      anchors: [
        { position: [0.04, 2.1, -3.5], maxWidth: 2.3, maxHeight: 2.8 },
        { position: [0.04, 2.1, 3.5], maxWidth: 2.3, maxHeight: 2.8 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-6.5, 0, 0],
      normal: [1, 0, 0],
      width: 13,
      height: 4.8,
      anchors: [
        { position: [-0.04, 2.1, -3.5], maxWidth: 2.3, maxHeight: 2.8 },
        { position: [-0.04, 2.1, 3.5], maxWidth: 2.3, maxHeight: 2.8 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 6.5],
      normal: [0, 0, -1],
      width: 13,
      height: 4.8,
      anchors: [
        { position: [-3.2, 2.1, -0.04], maxWidth: 2.4, maxHeight: 2.9 },
        { position: [3.2, 2.1, -0.04], maxWidth: 2.4, maxHeight: 2.9 },
      ],
    },
  ],
  spawn: { position: [0, 1.65, 4.4], yaw: Math.PI },
  walkBounds: [
    [-5.6, -5.6],
    [5.6, -5.6],
    [5.6, 5.6],
    [-5.6, 5.6],
  ],
  capacity: { recommended: 9, max: 14 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#1c1e20",
    widthCm: 2,
    matteCm: 5,
    matteColor: "#f4f5f6",
  }),
  preview: { imagePath: "/templates/daylight-atrium/preview.jpg" },
};
