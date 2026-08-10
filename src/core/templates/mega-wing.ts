import type { SceneTemplate } from "@/core/entities";
import { createFrameSpec } from "@/core/value-objects/frame-spec";

/**
 * Mega Wing — flagship Pro hall: ~18 × 22 m nave with east and west side
 * volumes. Daylight-museum realism at scale: coffered skylight, arched morning
 * window, two-tone hang band, polished stone floor; timber beams + soft track
 * accents remain as Pro hall dressing.
 */
export const megaWingTemplate: SceneTemplate = {
  id: "mega-wing",
  version: 1,
  name: "Mega Wing",
  tagline: "Massive daylight nave, stone floor, twin wings",
  category: "museum",
  tier: "pro",
  status: "active",
  shell: {
    glbPath: "/templates/mega-wing/v1/shell.glb",
    scale: 1,
  },
  environment: {
    exposure: 1.02,
    background: "#d8dde3",
    toneMapping: "aces",
  },
  lighting: {
    ambient: { color: "#f4f6f8", intensity: 0.26 },
    hemisphere: {
      skyColor: "#eef3f8",
      groundColor: "#b8c0c8",
      intensity: 0.44,
    },
    // Warm morning sun through the west arched window — soft real shadows on stone.
    key: {
      color: "#ffdcb0",
      intensity: 1.62,
      position: [-16.2, 7.8, -2.6],
    },
    // Soft cool skylight fill from the coffered well (not the primary key).
    fill: {
      color: "#f0f4f8",
      intensity: 0.62,
      position: [0.4, 12.2, 0.2],
    },
    rim: {
      color: "#ffffff",
      intensity: 0.16,
      position: [11, 4.4, -7],
    },
    presets: [
      { id: "morning", label: "Morning", spotIntensity: 0.88, temperatureK: 4800 },
      { id: "daylight", label: "Daylight", spotIntensity: 0.94, temperatureK: 5200 },
      { id: "evening", label: "Evening", spotIntensity: 0.9, temperatureK: 4100 },
    ],
  },
  materials: {
    wall: "#f3f4f5",
    wallBand: "#8e9296",
    wallBandBottomM: 0.95,
    wallBandTopM: 2.55,
    floor: "#d2c8b8",
    ceiling: "#eef0f2",
    trim: "#d5d8dc",
    wallRoughness: 0.94,
    floorRoughness: 0.36,
    floorMetalness: 0.04,
    ceilingRoughness: 0.88,
    floorStyle: "stone",
  },
  architecture: {
    skylight: {
      width: 6.4,
      depth: 9.2,
      gridX: 3,
      gridZ: 5,
      recessM: 0.32,
    },
    window: {
      wallId: "nave-west-north",
      width: 1.45,
      height: 3.85,
      sillM: 0.48,
      offsetM: 2.35,
      arched: true,
    },
    beams: {
      axis: "x",
      count: 12,
      lengthM: 16.5,
      center: [0, -1],
      spacingM: 2.0,
      color: "#c4b094",
      widthM: 0.24,
      heightM: 0.3,
    },
    trackLights: {
      axis: "z",
      count: 2,
      spotsPerRail: 9,
      lengthM: 20,
      center: [0, -1],
      // Rails near hang walls, clear of the central skylight well.
      spacingM: 12.5,
      // Accent only — natural key/fill carry the room.
      intensity: 0.38,
      maxLive: 6,
    },
    benches: [
      { position: [0, 0, 5], size: [3.0, 0.42, 0.5], color: "#c9a878", glb: true },
      { position: [0, 0, -2], size: [3.2, 0.42, 0.5], color: "#c9a878", glb: true },
      { position: [0, 0, -8], size: [2.8, 0.42, 0.5], color: "#c9a878", glb: true },
      {
        position: [12.5, 0, 0],
        size: [2.2, 0.42, 0.48],
        yaw: Math.PI / 2,
        color: "#c9a878",
        glb: true,
      },
      {
        position: [-12.5, 0, 0],
        size: [2.2, 0.42, 0.48],
        yaw: Math.PI / 2,
        color: "#c9a878",
        glb: true,
      },
    ],
    glbProps: [
      // Corner dressing only — ~1.15 m tall so foliage never masks the hang band.
      { model: "plant", position: [7.85, 0, 9.85], scale: 1.35 },
      { model: "plant", position: [-7.85, 0, 9.85], scale: 1.3, yaw: 0.9 },
      { model: "plant", position: [16.2, 0, 4.85], scale: 1.25, yaw: -0.4 },
      { model: "plant", position: [-16.2, 0, 4.85], scale: 1.22, yaw: 1.0 },
      { model: "plant", position: [16.2, 0, -4.85], scale: 1.2, yaw: 0.3 },
      { model: "plant", position: [-16.2, 0, -4.85], scale: 1.22, yaw: -0.7 },
      // Bust + vase catch morning window light (west nave).
      { model: "bust", position: [-6.15, 0.95, -4.05], scale: 1.1 },
      { model: "vase", position: [-5.35, 0.78, -2.35], scale: 0.98 },
      { model: "plinth_table", position: [6.5, 0, -2], scale: 1.1 },
    ],
    plinths: [
      { position: [-6.15, 0, -4.05], size: [0.55, 0.95, 0.55] },
      { position: [-5.35, 0, -2.35], size: [0.48, 0.78, 0.48] },
      { position: [7.1, 0, -9.15], size: [0.48, 0.9, 0.48] },
    ],
    // North-wall title faces the spawn; freestanding plaque near the south entry.
    signs: [
      {
        text: "MEGA WING",
        subtitle: "Exhibition",
        position: [0, 4.05, -10.9],
        yaw: 0,
        width: 5.4,
        height: 0.95,
        style: "wall",
      },
      {
        text: "Mega Wing",
        subtitle: "Pro Demo Studio",
        position: [0, 0, 10.15],
        yaw: Math.PI,
        width: 1.15,
        height: 0.42,
        style: "plaque",
      },
    ],
  },
  walls: [
    // —— Central nave 18 × 22 ——
    {
      id: "nave-north",
      label: "Nave north",
      origin: [0, 0, -11],
      normal: [0, 0, 1],
      width: 18,
      height: 5.8,
      anchors: [
        { position: [-5.5, 1.72, 0.04], maxWidth: 2.3, maxHeight: 2.6 },
        { position: [-2.2, 1.74, 0.04], maxWidth: 2.4, maxHeight: 2.7 },
        { position: [2.2, 1.74, 0.04], maxWidth: 2.4, maxHeight: 2.7, preferred: true },
        { position: [5.5, 1.72, 0.04], maxWidth: 2.3, maxHeight: 2.6 },
      ],
    },
    {
      id: "nave-south",
      label: "Nave south",
      origin: [0, 0, 11],
      normal: [0, 0, -1],
      width: 18,
      height: 5.8,
      anchors: [
        { position: [-5, 1.7, -0.04], maxWidth: 2.2, maxHeight: 2.5 },
        { position: [0, 1.72, -0.04], maxWidth: 2.4, maxHeight: 2.7 },
        { position: [5, 1.7, -0.04], maxWidth: 2.2, maxHeight: 2.5 },
      ],
    },
    // East wall of nave — opening |z| < 2.6
    {
      id: "nave-east-north",
      label: "Nave east north",
      origin: [9, 0, -6.8],
      normal: [-1, 0, 0],
      width: 8.4,
      height: 5.8,
      anchors: [
        { position: [0.04, 1.7, -2.2], maxWidth: 2.1, maxHeight: 2.4 },
        { position: [0.04, 1.72, 1.5], maxWidth: 2.2, maxHeight: 2.5, preferred: true },
      ],
    },
    {
      id: "nave-east-south",
      label: "Nave east south",
      origin: [9, 0, 6.8],
      normal: [-1, 0, 0],
      width: 8.4,
      height: 5.8,
      anchors: [
        { position: [0.04, 1.7, -1.5], maxWidth: 2.1, maxHeight: 2.4 },
        { position: [0.04, 1.7, 2.2], maxWidth: 2.1, maxHeight: 2.4 },
      ],
    },
    // West wall of nave — opening |z| < 2.6
    {
      id: "nave-west-north",
      label: "Nave west north",
      origin: [-9, 0, -6.8],
      normal: [1, 0, 0],
      width: 8.4,
      height: 5.8,
      anchors: [
        // Leave south of this bay clear for the arched morning window.
        { position: [-0.04, 1.7, -2.4], maxWidth: 2.1, maxHeight: 2.4 },
      ],
    },
    {
      id: "nave-west-south",
      label: "Nave west south",
      origin: [-9, 0, 6.8],
      normal: [1, 0, 0],
      width: 8.4,
      height: 5.8,
      anchors: [
        { position: [-0.04, 1.7, -1.5], maxWidth: 2.1, maxHeight: 2.4 },
        { position: [-0.04, 1.7, 2.2], maxWidth: 2.1, maxHeight: 2.4 },
      ],
    },
    {
      id: "east-opening-lintel",
      label: "East opening lintel",
      origin: [9, 4.4, 0],
      normal: [-1, 0, 0],
      width: 5.4,
      height: 1.4,
      anchors: [],
    },
    {
      id: "west-opening-lintel",
      label: "West opening lintel",
      origin: [-9, 4.4, 0],
      normal: [1, 0, 0],
      width: 5.4,
      height: 1.4,
      anchors: [],
    },
    // —— East wing ——
    {
      id: "east-wing-east",
      label: "East wing east",
      origin: [17.5, 0, 0],
      normal: [-1, 0, 0],
      width: 12,
      height: 5.2,
      anchors: [
        { position: [0.04, 1.68, -3.5], maxWidth: 2.2, maxHeight: 2.5 },
        { position: [0.04, 1.7, 0], maxWidth: 2.4, maxHeight: 2.7, preferred: true },
        { position: [0.04, 1.68, 3.5], maxWidth: 2.2, maxHeight: 2.5 },
      ],
    },
    {
      id: "east-wing-north",
      label: "East wing north",
      origin: [13.25, 0, -6],
      normal: [0, 0, 1],
      width: 8.5,
      height: 5.2,
      anchors: [
        { position: [-2, 1.65, 0.04], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [2, 1.65, 0.04], maxWidth: 2.0, maxHeight: 2.3 },
      ],
    },
    {
      id: "east-wing-south",
      label: "East wing south",
      origin: [13.25, 0, 6],
      normal: [0, 0, -1],
      width: 8.5,
      height: 5.2,
      anchors: [
        { position: [-2, 1.65, -0.04], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [2, 1.65, -0.04], maxWidth: 2.0, maxHeight: 2.3 },
      ],
    },
    {
      id: "east-wing-west-n",
      label: "East wing west north",
      origin: [9, 0, -4.3],
      normal: [1, 0, 0],
      width: 3.4,
      height: 5.2,
      anchors: [],
    },
    {
      id: "east-wing-west-s",
      label: "East wing west south",
      origin: [9, 0, 4.3],
      normal: [1, 0, 0],
      width: 3.4,
      height: 5.2,
      anchors: [],
    },
    // —— West wing ——
    {
      id: "west-wing-west",
      label: "West wing west",
      origin: [-17.5, 0, 0],
      normal: [1, 0, 0],
      width: 12,
      height: 5.2,
      anchors: [
        { position: [-0.04, 1.68, -3.5], maxWidth: 2.2, maxHeight: 2.5 },
        { position: [-0.04, 1.7, 0], maxWidth: 2.4, maxHeight: 2.7, preferred: true },
        { position: [-0.04, 1.68, 3.5], maxWidth: 2.2, maxHeight: 2.5 },
      ],
    },
    {
      id: "west-wing-north",
      label: "West wing north",
      origin: [-13.25, 0, -6],
      normal: [0, 0, 1],
      width: 8.5,
      height: 5.2,
      anchors: [
        { position: [-2, 1.65, 0.04], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [2, 1.65, 0.04], maxWidth: 2.0, maxHeight: 2.3 },
      ],
    },
    {
      id: "west-wing-south",
      label: "West wing south",
      origin: [-13.25, 0, 6],
      normal: [0, 0, -1],
      width: 8.5,
      height: 5.2,
      anchors: [
        { position: [-2, 1.65, -0.04], maxWidth: 2.0, maxHeight: 2.3 },
        { position: [2, 1.65, -0.04], maxWidth: 2.0, maxHeight: 2.3 },
      ],
    },
    {
      id: "west-wing-east-n",
      label: "West wing east north",
      origin: [-9, 0, -4.3],
      normal: [-1, 0, 0],
      width: 3.4,
      height: 5.2,
      anchors: [],
    },
    {
      id: "west-wing-east-s",
      label: "West wing east south",
      origin: [-9, 0, 4.3],
      normal: [-1, 0, 0],
      width: 3.4,
      height: 5.2,
      anchors: [],
    },
  ],
  // Centre nave, clear of corner plants and the entry plaque — faces north title.
  spawn: { position: [0, 1.68, 6.2], yaw: Math.PI },
  // Cross plan: full nave + wing rooms, narrow necks through east/west openings
  // so visitors can approach hang walls without walking through solid partitions.
  walkBounds: [
    [-8.55, -10.55],
    [8.55, -10.55],
    [8.55, -2.55],
    [9.05, -2.55],
    [9.05, -5.55],
    [16.95, -5.55],
    [16.95, 5.55],
    [9.05, 5.55],
    [9.05, 2.55],
    [8.55, 2.55],
    [8.55, 10.55],
    [-8.55, 10.55],
    [-8.55, 2.55],
    [-9.05, 2.55],
    [-9.05, 5.55],
    [-16.95, 5.55],
    [-16.95, -5.55],
    [-9.05, -5.55],
    [-9.05, -2.55],
    [-8.55, -2.55],
  ],
  capacity: { recommended: 32, max: 42 },
  frameDefaults: createFrameSpec({
    style: "gallery",
    color: "#1a1c1e",
    widthCm: 2.5,
    matteCm: 5.5,
    matteColor: "#f6f6f5",
  }),
  preview: { imagePath: "/templates/mega-wing/preview.jpg" },
};
