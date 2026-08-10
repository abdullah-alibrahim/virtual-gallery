import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Long Corridor — narrow enfilade with works on both long walls.
 */
export const longCorridorTemplate: SceneTemplate = {
  id: "long-corridor",
  version: 1,
  name: "Long Corridor",
  tagline: "Narrow enfilade, works on both long walls",
  category: "minimal",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/long-corridor/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.04,
    background: "#c4c0b8",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f0ede6", intensity: 0.34 },
    hemisphere: {
      skyColor: "#f7f4ee",
      groundColor: "#b8b4ac",
      intensity: 0.4,
    },
    key: {
      color: "#fffaf4",
      intensity: 0.98,
      position: [0.8, 5.2, 1.5],
    },
    fill: {
      color: "#d8d4cc",
      intensity: 0.36,
      position: [-1.2, 2.4, 4],
    },
    rim: {
      color: "#f4f2ec",
      intensity: 0.18,
      position: [0, 2.8, -8],
    },
    presets: [
      { id: "even", label: "Even", spotIntensity: 1.0, temperatureK: 4400 },
    ],
  },
  materials: {
    wall: "#e8e6e0",
    floor: "#c8c4bc",
    ceiling: "#f0eee8",
    trim: "#c0bcb4",
    wallRoughness: 0.96,
    floorRoughness: 0.68,
    floorMetalness: 0.015,
    ceilingRoughness: 1,
    floorStyle: "stone",
  },
  walls: [
    {
      id: "east-run",
      label: "East run",
      origin: [2.2, 0, 0],
      normal: [-1, 0, 0],
      width: 16,
      height: 3.2,
      anchors: [
        { position: [0.04, 1.55, -6], maxWidth: 1.8, maxHeight: 2.0, preferred: true },
        { position: [0.04, 1.55, -3], maxWidth: 1.8, maxHeight: 2.0 },
        { position: [0.04, 1.55, 0], maxWidth: 1.9, maxHeight: 2.1, preferred: true },
        { position: [0.04, 1.55, 3], maxWidth: 1.8, maxHeight: 2.0 },
        { position: [0.04, 1.55, 6], maxWidth: 1.8, maxHeight: 2.0 },
      ],
    },
    {
      id: "west-run",
      label: "West run",
      origin: [-2.2, 0, 0],
      normal: [1, 0, 0],
      width: 16,
      height: 3.2,
      anchors: [
        { position: [-0.04, 1.55, -6], maxWidth: 1.8, maxHeight: 2.0 },
        { position: [-0.04, 1.55, -3], maxWidth: 1.8, maxHeight: 2.0, preferred: true },
        { position: [-0.04, 1.55, 0], maxWidth: 1.9, maxHeight: 2.1 },
        { position: [-0.04, 1.55, 3], maxWidth: 1.8, maxHeight: 2.0, preferred: true },
        { position: [-0.04, 1.55, 6], maxWidth: 1.8, maxHeight: 2.0 },
      ],
    },
    {
      id: "north-end",
      label: "North end",
      origin: [0, 0, -8.2],
      normal: [0, 0, 1],
      width: 4.4,
      height: 3.2,
      anchors: [
        { position: [0, 1.55, 0.04], maxWidth: 2.2, maxHeight: 2.3, preferred: true },
      ],
    },
    {
      id: "south-end",
      label: "South end",
      origin: [0, 0, 8.2],
      normal: [0, 0, -1],
      width: 4.4,
      height: 3.2,
      anchors: [
        { position: [0, 1.55, -0.04], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
  ],
  spawn: { position: [0, 1.55, 5], yaw: Math.PI },
  walkBounds: [
    [-1.7, -7.6],
    [1.7, -7.6],
    [1.7, 7.6],
    [-1.7, 7.6],
  ],
  capacity: { recommended: 10, max: 14 },
  frameDefaults: createFrameSpec({
    style: "thin",
    color: "#2c2c2a",
    widthCm: 2.2,
    matteCm: 5,
    matteColor: "#f4f2ec",
  }),
  preview: { imagePath: "/templates/long-corridor/preview.jpg" },
};
