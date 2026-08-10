import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Industrial — concrete shell, high ceilings, dense hang capacity.
 * Pro tier. Catalogue data only.
 */
export const industrialTemplate: SceneTemplate = {
  id: "industrial",
  version: 2,
  name: "Industrial",
  tagline: "Raw concrete, high bay, cool daylight",
  category: "industrial",
  tier: "pro",
  status: "active",
  shell: {
    glbPath: "/templates/industrial/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.02,
    background: "#26282a",
    toneMapping: "aces",
    fog: { color: "#26282a", near: 14, far: 34 },
  },
  lighting: {
    ambient: { color: "#c8ccd0", intensity: 0.24 },
    hemisphere: {
      skyColor: "#d8dde2",
      groundColor: "#3a3c3e",
      intensity: 0.36,
    },
    key: {
      color: "#eef2f6",
      intensity: 1.35,
      position: [0, 8, 0],
    },
    fill: {
      color: "#a8b0b8",
      intensity: 0.28,
      position: [-5, 3.5, 4],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.2,
      position: [5, 4, -5],
    },
    presets: [
      { id: "daylight", label: "Daylight", spotIntensity: 1.6, temperatureK: 5600 },
      { id: "warehouse", label: "Warehouse", spotIntensity: 1.35, temperatureK: 4200 },
    ],
  },
  materials: {
    wall: "#6e7276",
    floor: "#4a4e52",
    ceiling: "#3e4246",
    trim: "#585c60",
    wallRoughness: 0.92,
    floorRoughness: 0.7,
    floorMetalness: 0.05,
    ceilingRoughness: 0.95,
    floorStyle: "concrete",
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -7],
      normal: [0, 0, 1],
      width: 14,
      height: 5,
      anchors: [
        { position: [-5, 2.1, 0.04], maxWidth: 2.5, maxHeight: 3.0 },
        { position: [-1.7, 2.1, 0.04], maxWidth: 2.5, maxHeight: 3.0, preferred: true },
        { position: [1.7, 2.1, 0.04], maxWidth: 2.5, maxHeight: 3.0, preferred: true },
        { position: [5, 2.1, 0.04], maxWidth: 2.5, maxHeight: 3.0 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [7, 0, 0],
      normal: [-1, 0, 0],
      width: 14,
      height: 5,
      anchors: [
        { position: [0.04, 2.1, -4], maxWidth: 2.3, maxHeight: 2.8 },
        { position: [0.04, 2.1, 0], maxWidth: 2.3, maxHeight: 2.8 },
        { position: [0.04, 2.1, 4], maxWidth: 2.3, maxHeight: 2.8 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-7, 0, 0],
      normal: [1, 0, 0],
      width: 14,
      height: 5,
      anchors: [
        { position: [-0.04, 2.1, -4], maxWidth: 2.3, maxHeight: 2.8 },
        { position: [-0.04, 2.1, 0], maxWidth: 2.3, maxHeight: 2.8 },
        { position: [-0.04, 2.1, 4], maxWidth: 2.3, maxHeight: 2.8 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 7],
      normal: [0, 0, -1],
      width: 14,
      height: 5,
      anchors: [
        { position: [-3.5, 2.1, -0.04], maxWidth: 2.4, maxHeight: 2.9 },
        { position: [3.5, 2.1, -0.04], maxWidth: 2.4, maxHeight: 2.9 },
      ],
    },
  ],
  spawn: { position: [0, 1.7, 5], yaw: Math.PI },
  walkBounds: [
    [-6.2, -6.2],
    [6.2, -6.2],
    [6.2, 6.2],
    [-6.2, 6.2],
  ],
  capacity: { recommended: 12, max: 18 },
  frameDefaults: createFrameSpec({
    style: "thin",
    color: "#3a3a3a",
    widthCm: 1.2,
    matteCm: 0,
    matteColor: "#2a2a2a",
  }),
  preview: { imagePath: "/templates/industrial/preview.jpg" },
};
