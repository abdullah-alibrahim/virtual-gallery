import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

import { fourWallRoom, roomWalkBounds } from "./build-room";

/** Zen Court — paper-white hush, matte plaster, soft north light. Pro. */
export const zenCourtTemplate: SceneTemplate = {
  id: "zen-court",
  version: 1,
  name: "Zen Court",
  tagline: "Paper-white hush, matte plaster, soft north light",
  category: "zen",
  tier: "pro",
  status: "active",
  shell: {
    glbPath: "/templates/zen-court/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.12,
    background: "#f2f0eb",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f8f6f2", intensity: 0.5 },
    hemisphere: {
      skyColor: "#ffffff",
      groundColor: "#d8d4cc",
      intensity: 0.45,
    },
    key: {
      color: "#fffef8",
      intensity: 0.95,
      position: [-2, 5.5, 3],
    },
    fill: {
      color: "#ebe6dc",
      intensity: 0.42,
      position: [3, 2.5, -2],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.12,
      position: [0, 3, -4],
    },
    presets: [
      { id: "north", label: "North", spotIntensity: 0.95, temperatureK: 5000 },
      { id: "paper", label: "Paper", spotIntensity: 0.8, temperatureK: 4500 },
    ],
  },
  materials: {
    wall: "#f5f2ec",
    floor: "#d4cfc4",
    ceiling: "#faf8f4",
    trim: "#e0dbd2",
    wallRoughness: 0.96,
    floorRoughness: 0.68,
    floorMetalness: 0.015,
    ceilingRoughness: 0.99,
    floorStyle: "stone",
  },
  walls: fourWallRoom({
    width: 8.5,
    depth: 11,
    height: 3.0,
    northAnchors: 2,
    sideAnchors: 2,
    southAnchors: 1,
  }),
  spawn: { position: [0, 1.48, 4.0], yaw: Math.PI },
  walkBounds: roomWalkBounds(3.5, 4.6),
  capacity: { recommended: 5, max: 8 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#2c2a26",
    widthCm: 2,
    matteCm: 10,
    matteColor: "#faf8f4",
  }),
  preview: { imagePath: "/templates/zen-court/preview.jpg" },
};
