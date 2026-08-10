import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Concrete Loft — lived-in concrete with warm wood underfoot.
 * Free tier. Distinct from Industrial: lower ceiling, warmer bounce.
 */
export const concreteLoftTemplate: SceneTemplate = {
  id: "concrete-loft",
  version: 1,
  name: "Concrete Loft",
  tagline: "Board-formed concrete, oak floor, late afternoon",
  category: "loft",
  tier: "free",
  status: "active",
  shell: {
    glbPath: "/templates/concrete-loft/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.04,
    background: "#3a3834",
    toneMapping: "aces",
    fog: { color: "#3a3834", near: 11, far: 28 },
  },
  lighting: {
    ambient: { color: "#e8ddd0", intensity: 0.3 },
    hemisphere: {
      skyColor: "#f0e6d8",
      groundColor: "#4a4036",
      intensity: 0.38,
    },
    key: {
      color: "#ffc898",
      intensity: 1.25,
      position: [4.5, 5.2, 2],
    },
    fill: {
      color: "#b8c4d0",
      intensity: 0.32,
      position: [-3.5, 3, -2.5],
    },
    rim: {
      color: "#ffe0c0",
      intensity: 0.2,
      position: [-1, 3.2, -5],
    },
    presets: [
      { id: "afternoon", label: "Afternoon", spotIntensity: 1.35, temperatureK: 3800 },
      { id: "overcast", label: "Overcast", spotIntensity: 1.1, temperatureK: 4800 },
    ],
  },
  materials: {
    wall: "#9a958c",
    floor: "#6b5340",
    ceiling: "#8a8580",
    trim: "#6e6860",
    wallRoughness: 0.96,
    floorRoughness: 0.58,
    floorMetalness: 0.05,
    ceilingRoughness: 0.98,
    floorStyle: "plank",
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -5.5],
      normal: [0, 0, 1],
      width: 11,
      height: 3.7,
      anchors: [
        { position: [-3.4, 1.7, 0.04], maxWidth: 2.3, maxHeight: 2.4, preferred: true },
        { position: [0, 1.7, 0.04], maxWidth: 2.5, maxHeight: 2.6, preferred: true },
        { position: [3.4, 1.7, 0.04], maxWidth: 2.3, maxHeight: 2.4 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [5.5, 0, 0],
      normal: [-1, 0, 0],
      width: 11,
      height: 3.7,
      anchors: [
        { position: [0.04, 1.7, -2.8], maxWidth: 2.1, maxHeight: 2.3 },
        { position: [0.04, 1.7, 2.8], maxWidth: 2.1, maxHeight: 2.3 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-5.5, 0, 0],
      normal: [1, 0, 0],
      width: 11,
      height: 3.7,
      anchors: [
        { position: [-0.04, 1.7, -2.8], maxWidth: 2.1, maxHeight: 2.3 },
        { position: [-0.04, 1.7, 2.8], maxWidth: 2.1, maxHeight: 2.3 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 5.5],
      normal: [0, 0, -1],
      width: 11,
      height: 3.7,
      anchors: [
        { position: [-2.6, 1.7, -0.04], maxWidth: 2.0, maxHeight: 2.2 },
        { position: [2.6, 1.7, -0.04], maxWidth: 2.0, maxHeight: 2.2 },
      ],
    },
  ],
  spawn: { position: [0, 1.62, 3.6], yaw: Math.PI },
  walkBounds: [
    [-4.8, -4.8],
    [4.8, -4.8],
    [4.8, 4.8],
    [-4.8, 4.8],
  ],
  capacity: { recommended: 9, max: 13 },
  frameDefaults: createFrameSpec({
    style: "thin",
    color: "#2c2824",
    widthCm: 1.8,
    matteCm: 2,
    matteColor: "#ebe6dc",
  }),
  preview: { imagePath: "/templates/concrete-loft/preview.jpg" },
};
