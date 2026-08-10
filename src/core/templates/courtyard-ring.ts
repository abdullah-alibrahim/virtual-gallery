import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Courtyard Ring — ring corridor around an open centre court.
 * Outer walls span full corners; walkBounds is a ring strip (centre excluded).
 * Soft court ground is intentional exterior, not clearColor white.
 */
export const courtyardRingTemplate: SceneTemplate = {
  id: "courtyard-ring",
  version: 1,
  name: "Courtyard Ring",
  tagline: "Open centre court, hang walls around a ring path",
  category: "atrium",
  tier: "pro",
  status: "active",
  shell: {
    glbPath: "/templates/courtyard-ring/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.1,
    background: "#b8c0b6",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f0f4f0", intensity: 0.38 },
    hemisphere: {
      skyColor: "#eef2f8",
      groundColor: "#98a898",
      intensity: 0.48,
    },
    key: {
      color: "#fffef8",
      intensity: 1.15,
      position: [0.5, 8.5, 0.5],
    },
    fill: {
      color: "#c8d0c8",
      intensity: 0.4,
      position: [4.5, 3.2, 4],
    },
    rim: {
      color: "#f4f8f4",
      intensity: 0.16,
      position: [-3.5, 4.2, -3],
    },
    presets: [
      { id: "sky", label: "Sky", spotIntensity: 1.1, temperatureK: 5400 },
    ],
  },
  materials: {
    wall: "#eef0ec",
    floor: "#c0c8bc",
    ceiling: "#f2f4f0",
    trim: "#c8d0c8",
    wallRoughness: 0.95,
    floorRoughness: 0.62,
    floorMetalness: 0.02,
    ceilingRoughness: 0.99,
    floorStyle: "stone",
  },
  walls: [
    // Outer shell — width spans full perimeter so corners meet
    {
      id: "outer-north",
      label: "Outer north",
      origin: [0, 0, -7],
      normal: [0, 0, 1],
      width: 14,
      height: 3.6,
      anchors: [
        { position: [-3, 1.65, 0.04], maxWidth: 2.1, maxHeight: 2.3 },
        { position: [0, 1.65, 0.04], maxWidth: 2.3, maxHeight: 2.4, preferred: true },
        { position: [3, 1.65, 0.04], maxWidth: 2.1, maxHeight: 2.3 },
      ],
    },
    {
      id: "outer-east",
      label: "Outer east",
      origin: [7, 0, 0],
      normal: [-1, 0, 0],
      width: 14,
      height: 3.6,
      anchors: [
        { position: [0.04, 1.65, -3], maxWidth: 2.1, maxHeight: 2.3 },
        { position: [0.04, 1.65, 0], maxWidth: 2.3, maxHeight: 2.4, preferred: true },
        { position: [0.04, 1.65, 3], maxWidth: 2.1, maxHeight: 2.3 },
      ],
    },
    {
      id: "outer-south",
      label: "Outer south",
      origin: [0, 0, 7],
      normal: [0, 0, -1],
      width: 14,
      height: 3.6,
      anchors: [
        { position: [-3, 1.65, -0.04], maxWidth: 2.1, maxHeight: 2.3 },
        { position: [0, 1.65, -0.04], maxWidth: 2.3, maxHeight: 2.4, preferred: true },
        { position: [3, 1.65, -0.04], maxWidth: 2.1, maxHeight: 2.3 },
      ],
    },
    {
      id: "outer-west",
      label: "Outer west",
      origin: [-7, 0, 0],
      normal: [1, 0, 0],
      width: 14,
      height: 3.6,
      anchors: [
        { position: [-0.04, 1.65, -3], maxWidth: 2.1, maxHeight: 2.3 },
        { position: [-0.04, 1.65, 0], maxWidth: 2.3, maxHeight: 2.4, preferred: true },
        { position: [-0.04, 1.65, 3], maxWidth: 2.1, maxHeight: 2.3 },
      ],
    },
    // Inner court — solid panels with centred openings on N/S for soft court views
    {
      id: "inner-north-west",
      label: "Court north west",
      origin: [-1.85, 0, -2.5],
      normal: [0, 0, -1],
      width: 2.3,
      height: 3.0,
      anchors: [
        { position: [0, 1.55, -0.04], maxWidth: 1.6, maxHeight: 1.8 },
      ],
    },
    {
      id: "inner-north-east",
      label: "Court north east",
      origin: [1.85, 0, -2.5],
      normal: [0, 0, -1],
      width: 2.3,
      height: 3.0,
      anchors: [
        { position: [0, 1.55, -0.04], maxWidth: 1.6, maxHeight: 1.8 },
      ],
    },
    {
      id: "inner-south-west",
      label: "Court south west",
      origin: [-1.85, 0, 2.5],
      normal: [0, 0, 1],
      width: 2.3,
      height: 3.0,
      anchors: [
        { position: [0, 1.55, 0.04], maxWidth: 1.6, maxHeight: 1.8 },
      ],
    },
    {
      id: "inner-south-east",
      label: "Court south east",
      origin: [1.85, 0, 2.5],
      normal: [0, 0, 1],
      width: 2.3,
      height: 3.0,
      anchors: [
        { position: [0, 1.55, 0.04], maxWidth: 1.6, maxHeight: 1.8 },
      ],
    },
    {
      id: "inner-east",
      label: "Court east",
      origin: [2.5, 0, 0],
      normal: [1, 0, 0],
      width: 5,
      height: 3.0,
      anchors: [
        { position: [-0.04, 1.55, 0], maxWidth: 2.0, maxHeight: 2.1 },
      ],
    },
    {
      id: "inner-west",
      label: "Court west",
      origin: [-2.5, 0, 0],
      normal: [-1, 0, 0],
      width: 5,
      height: 3.0,
      anchors: [
        { position: [0.04, 1.55, 0], maxWidth: 2.0, maxHeight: 2.1 },
      ],
    },
    // Soft exterior beyond court openings (dimmer “garden” walls)
    {
      id: "court-filler-north",
      label: "Court garden north",
      origin: [0, 0, -1.2],
      normal: [0, 0, 1],
      width: 2.6,
      height: 2.6,
      anchors: [],
    },
    {
      id: "court-filler-south",
      label: "Court garden south",
      origin: [0, 0, 1.2],
      normal: [0, 0, -1],
      width: 2.6,
      height: 2.6,
      anchors: [],
    },
  ],
  spawn: { position: [0, 1.58, 4.5], yaw: Math.PI },
  // Ring strip: outer CW then slit into inner CCW so centre is outside the polygon
  walkBounds: [
    [-6.2, -6.2],
    [6.2, -6.2],
    [6.2, 6.2],
    [-6.2, 6.2],
    [-6.2, -2.95],
    [-2.95, -2.95],
    [2.95, -2.95],
    [2.95, 2.95],
    [-2.95, 2.95],
    [-2.95, -2.95],
    [-6.2, -2.95],
  ],
  capacity: { recommended: 14, max: 18 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#1e2420",
    widthCm: 2.8,
    matteCm: 7,
    matteColor: "#f4f6f2",
  }),
  preview: { imagePath: "/templates/courtyard-ring/preview.jpg" },
};
