import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Night Cube — compact, intimate dark room with cool night rim light.
 * Pro tier.
 */
export const nightCubeTemplate: SceneTemplate = {
  id: "night-cube",
  version: 1,
  name: "Night Cube",
  tagline: "Intimate cube, deep indigo, cool rim light",
  category: "night",
  tier: "pro",
  status: "active",
  shell: {
    glbPath: "/templates/night-cube/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 0.9,
    background: "#0a0e14",
    toneMapping: "aces",
    fog: { color: "#0a0e14", near: 5, far: 16 },
  },
  lighting: {
    ambient: { color: "#a8b4c4", intensity: 0.14 },
    hemisphere: {
      skyColor: "#3a4a5c",
      groundColor: "#0c1016",
      intensity: 0.2,
    },
    key: {
      color: "#c8d8f0",
      intensity: 0.7,
      position: [0, 4.2, 1],
    },
    fill: {
      color: "#6a7a90",
      intensity: 0.16,
      position: [-2.5, 2.2, -1.5],
    },
    rim: {
      color: "#8ab0e0",
      intensity: 0.35,
      position: [2.8, 2.8, -3],
    },
    presets: [
      { id: "night", label: "Night", spotIntensity: 1.65, temperatureK: 4800 },
      { id: "moon", label: "Moon", spotIntensity: 1.35, temperatureK: 6500 },
    ],
  },
  materials: {
    wall: "#121820",
    floor: "#0e1218",
    ceiling: "#0a0e12",
    trim: "#1c2430",
    wallRoughness: 0.88,
    floorRoughness: 0.3,
    floorMetalness: 0.16,
    ceilingRoughness: 1,
    floorStyle: "stone",
    floorTextureId: "stone_tile",
    wallTextureId: "plaster_smooth",
  },
  architecture: {
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 4,
      lengthM: 6.4,
      center: [0, 0],
      spacingM: 4.4,
      intensity: 0.52,
      maxLive: 4,
      railColor: "#8ab0e0",
    },
    plinths: [{ position: [2.15, 0, -1.85], size: [0.44, 0.9, 0.44] }],
    benches: [
      {
        position: [0, 0, 0.85],
        size: [1.7, 0.4, 0.46],
        color: "#1c2430",
        glb: true,
      },
    ],
    glbProps: [
      { model: "bust", position: [2.15, 0.9, -1.85], scale: 1.0 },
      { model: "plant", position: [3.15, 0, 3.15], scale: 1.12, yaw: -0.4 },
      { model: "plant", position: [-3.15, 0, 3.15], scale: 1.1, yaw: 0.75 },
      { model: "vase", position: [-2.25, 0, -2.35], scale: 0.82 },
    ],
    signs: [
      {
        text: "NIGHT CUBE",
        subtitle: "Intimate · indigo",
        position: [0, 2.65, -3.92],
        yaw: 0,
        width: 3.6,
        height: 0.62,
        style: "wall",
      },
    ],
  },
  walls: [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -4],
      normal: [0, 0, 1],
      width: 8,
      height: 3.2,
      anchors: [
        { position: [-2.2, 1.5, 0.04], maxWidth: 1.9, maxHeight: 2.0, preferred: true },
        { position: [0, 1.5, 0.04], maxWidth: 2.1, maxHeight: 2.2, preferred: true },
        { position: [2.2, 1.5, 0.04], maxWidth: 1.9, maxHeight: 2.0 },
      ],
    },
    {
      id: "east",
      label: "East wall",
      origin: [4, 0, 0],
      normal: [-1, 0, 0],
      width: 8,
      height: 3.2,
      anchors: [
        { position: [0.04, 1.5, -1.8], maxWidth: 1.8, maxHeight: 1.9 },
        { position: [0.04, 1.5, 1.8], maxWidth: 1.8, maxHeight: 1.9 },
      ],
    },
    {
      id: "west",
      label: "West wall",
      origin: [-4, 0, 0],
      normal: [1, 0, 0],
      width: 8,
      height: 3.2,
      anchors: [
        { position: [-0.04, 1.5, -1.8], maxWidth: 1.8, maxHeight: 1.9 },
        { position: [-0.04, 1.5, 1.8], maxWidth: 1.8, maxHeight: 1.9 },
      ],
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, 4],
      normal: [0, 0, -1],
      width: 8,
      height: 3.2,
      anchors: [
        { position: [0, 1.5, -0.04], maxWidth: 2.0, maxHeight: 2.1, preferred: true },
      ],
    },
  ],
  spawn: { position: [0, 1.55, 2.4], yaw: Math.PI },
  walkBounds: [
    [-3.4, -3.4],
    [3.4, -3.4],
    [3.4, 3.4],
    [-3.4, 3.4],
  ],
  capacity: { recommended: 6, max: 9 },
  frameDefaults: createFrameSpec({
    style: "thin",
    color: "#0c1014",
    widthCm: 1.2,
    matteCm: 0,
    matteColor: "#0c1014",
  }),
  preview: { imagePath: "/templates/night-cube/preview.jpg" },
};
