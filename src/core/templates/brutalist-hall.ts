import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

import { fourWallRoom, roomWalkBounds } from "./build-room";

/** Brutalist Hall — raw concrete volumes, cool skylight, austere scale. Pro. */
export const brutalistHallTemplate: SceneTemplate = {
  id: "brutalist-hall",
  version: 1,
  name: "Brutalist Hall",
  tagline: "Raw concrete, cool skylight, austere scale",
  category: "brutalist",
  tier: "pro",
  status: "active",
  shell: {
    glbPath: "/templates/brutalist-hall/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 0.98,
    background: "#6a6e72",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#d8dce0", intensity: 0.26 },
    hemisphere: {
      skyColor: "#e8ecef",
      groundColor: "#5a5e62",
      intensity: 0.38,
    },
    key: {
      color: "#ffffff",
      intensity: 1.25,
      position: [0, 7.5, 0.5],
    },
    fill: {
      color: "#a8b0b8",
      intensity: 0.35,
      position: [4, 3, -3],
    },
    rim: {
      color: "#c8d0d8",
      intensity: 0.2,
      position: [-2, 4, -6],
    },
    presets: [
      { id: "day", label: "Day", spotIntensity: 1.25, temperatureK: 5500 },
      { id: "overcast", label: "Overcast", spotIntensity: 0.9, temperatureK: 7000 },
    ],
  },
  materials: {
    wall: "#8a8e92",
    floor: "#5e6266",
    ceiling: "#74787c",
    trim: "#4a4e52",
    wallRoughness: 0.92,
    floorRoughness: 0.4,
    floorMetalness: 0.04,
    ceilingRoughness: 0.95,
    floorStyle: "concrete",
    floorTextureId: "concrete",
    wallTextureId: "concrete",
  },
  architecture: {
    skylight: {
      width: 4.6,
      depth: 7.2,
      gridX: 2,
      gridZ: 4,
      recessM: 0.32,
    },
    window: {
      wallId: "west",
      width: 1.15,
      height: 3.4,
      sillM: 0.7,
      offsetM: -1.2,
    },
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 6,
      lengthM: 11.5,
      center: [0, 0],
      spacingM: 7.4,
      intensity: 0.38,
      maxLive: 5,
      railColor: "#6a7076",
    },
    plinths: [
      { position: [-3.4, 0, 1.8], size: [0.58, 1.05, 0.58] },
      { position: [3.55, 0, -2.4], size: [0.5, 0.38, 0.5] },
    ],
    benches: [
      {
        position: [0, 0, 2.4],
        size: [2.4, 0.42, 0.5],
        color: "#4a4e52",
        glb: true,
      },
      {
        position: [0, 0, -3.1],
        size: [2.1, 0.42, 0.48],
        color: "#4a4e52",
        glb: true,
      },
    ],
    glbProps: [
      { model: "bust", position: [-3.4, 1.05, 1.8], scale: 1.12 },
      { model: "vase", position: [3.55, 0.38, -2.4], scale: 0.95 },
      { model: "plant", position: [5.35, 0, 5.35], scale: 1.32, yaw: -0.3 },
      { model: "plant", position: [-5.35, 0, 5.35], scale: 1.28, yaw: 0.8 },
      { model: "plant", position: [5.4, 0, -5.4], scale: 1.25, yaw: 0.45 },
      { model: "plant", position: [-5.4, 0, -5.4], scale: 1.3, yaw: 1.1 },
    ],
    signs: [
      {
        text: "BRUTALIST HALL",
        subtitle: "Concrete · skylight · scale",
        position: [0, 4.05, -6.92],
        yaw: 0,
        width: 5.2,
        height: 0.85,
        style: "wall",
      },
      {
        text: "Brutalist Hall",
        subtitle: "Austere volume",
        position: [0, 0, 6.55],
        yaw: Math.PI,
        width: 1.15,
        height: 0.4,
        style: "plaque",
      },
    ],
  },
  walls: fourWallRoom({
    width: 12,
    depth: 14,
    height: 4.8,
    northAnchors: 4,
    sideAnchors: 3,
    southAnchors: 2,
  }),
  spawn: { position: [0, 1.7, 5.0], yaw: Math.PI },
  walkBounds: roomWalkBounds(5.2, 6.0),
  capacity: { recommended: 12, max: 18 },
  frameDefaults: createFrameSpec({
    style: "thin",
    color: "#1c1e20",
    widthCm: 2,
    matteCm: 4,
    matteColor: "#e8eaec",
  }),
  preview: { imagePath: "/templates/brutalist-hall/preview.jpg" },
};
