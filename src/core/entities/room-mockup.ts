/**
 * Preset interior rooms for 2.5D artwork mockups.
 *
 * Each preset defines a wall plane in normalized image space (0–1) plus the
 * real-world wall size in centimetres. The compositor maps framed artwork
 * onto that plane with `paintingCm / wallCm` scale.
 *
 * When `imagePath` is set, RoomBackdrop uses a real room photo instead of SVG.
 */

export type RoomMockupCategory =
  | "living"
  | "office"
  | "hall"
  | "gallery"
  | "restaurant";

/** Axis-aligned hang region inside the room backdrop (normalized 0–1). */
export interface WallPlane {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Optional CSS 3D hint so the hung work reads with the room’s perspective. */
export interface WallPerspective {
  readonly rotateYDeg?: number;
  readonly rotateXDeg?: number;
  readonly skewXDeg?: number;
}

export interface RoomMockupTheme {
  readonly wallColor: string;
  readonly floorColor: string;
  readonly ceilingColor: string;
  readonly trimColor: string;
  readonly accentColor: string;
  readonly furnitureColor: string;
}

export interface LocalizedCopy {
  readonly en: string;
  readonly ar: string;
}

export interface RoomMockupPreset {
  readonly id: string;
  readonly category: RoomMockupCategory;
  readonly label: LocalizedCopy;
  /** Fit question shown beside the verdict, e.g. “Will it fit the salon wall?” */
  readonly fitPrompt: LocalizedCopy;
  readonly wallWidthCm: number;
  readonly wallHeightCm: number;
  readonly wall: WallPlane;
  readonly perspective?: WallPerspective;
  readonly theme: RoomMockupTheme;
  /** Typical hang centre as fraction of wall height from the top (0–1). */
  readonly hangCenterY: number;
  /**
   * Real interior photo under `/public/mockups/rooms`. When set, the backdrop
   * uses the photo and `wall` is calibrated to the empty hangable wall quad.
   */
  readonly imagePath?: string;
}

export const ROOM_MOCKUP_PRESETS: readonly RoomMockupPreset[] = [
  {
    id: "living-room",
    category: "living",
    label: { en: "Living room", ar: "غرفة معيشة" },
    fitPrompt: {
      en: "Will it fit the living-room wall?",
      ar: "هل ستناسب جدار غرفة المعيشة؟",
    },
    wallWidthCm: 280,
    wallHeightCm: 260,
    // Calibrated to blank wall above the armchair (photo 1586023492125).
    wall: { x: 0.28, y: 0.08, width: 0.34, height: 0.38 },
    perspective: { rotateYDeg: -2 },
    hangCenterY: 0.42,
    imagePath: "/mockups/rooms/living-room.jpg",
    theme: {
      wallColor: "#e8e2d8",
      floorColor: "#8a6f52",
      ceilingColor: "#f4f0ea",
      trimColor: "#d4ccc0",
      accentColor: "#3d5a4c",
      furnitureColor: "#2c2a28",
    },
  },
  {
    id: "office",
    category: "office",
    label: { en: "Office", ar: "مكتب" },
    fitPrompt: {
      en: "Will it fit the office wall?",
      ar: "هل ستناسب جدار المكتب؟",
    },
    wallWidthCm: 360,
    wallHeightCm: 300,
    // Dark slate wall on the left of the office corridor photo.
    wall: { x: 0.04, y: 0.06, width: 0.3, height: 0.52 },
    perspective: { rotateYDeg: 6 },
    hangCenterY: 0.38,
    imagePath: "/mockups/rooms/office.jpg",
    theme: {
      wallColor: "#dfe4e8",
      floorColor: "#6b6560",
      ceilingColor: "#f0f2f4",
      trimColor: "#c5ced4",
      accentColor: "#1f3a5f",
      furnitureColor: "#1a1a1a",
    },
  },
  {
    id: "hall",
    category: "hall",
    label: { en: "Hall / salon", ar: "صالة" },
    fitPrompt: {
      en: "Will it fit the salon wall?",
      ar: "هل ستناسب جدار الصالة؟",
    },
    wallWidthCm: 320,
    wallHeightCm: 280,
    // Back-wall photo grid zone in the sunlit salon.
    wall: { x: 0.3, y: 0.1, width: 0.34, height: 0.36 },
    perspective: { rotateYDeg: 0 },
    hangCenterY: 0.4,
    imagePath: "/mockups/rooms/hall.jpg",
    theme: {
      wallColor: "#f0ebe3",
      floorColor: "#9a8b78",
      ceilingColor: "#faf7f2",
      trimColor: "#ddd4c8",
      accentColor: "#8b4518",
      furnitureColor: "#3a342e",
    },
  },
  {
    id: "gallery",
    category: "gallery",
    label: { en: "Gallery", ar: "معرض" },
    fitPrompt: {
      en: "Will it fit the gallery wall?",
      ar: "هل ستناسب جدار المعرض؟",
    },
    wallWidthCm: 520,
    wallHeightCm: 340,
    // Right-side hang line in the long white museum hall (portrait photo).
    wall: { x: 0.42, y: 0.28, width: 0.42, height: 0.4 },
    perspective: { rotateYDeg: -4 },
    hangCenterY: 0.42,
    imagePath: "/mockups/rooms/gallery.jpg",
    theme: {
      wallColor: "#f7f5f1",
      floorColor: "#cfc8bc",
      ceilingColor: "#ffffff",
      trimColor: "#ebe7e0",
      accentColor: "#222222",
      furnitureColor: "#111111",
    },
  },
  {
    id: "restaurant",
    category: "restaurant",
    label: { en: "Restaurant", ar: "مطعم" },
    fitPrompt: {
      en: "Will it fit the restaurant wall?",
      ar: "هل ستناسب جدار المطعم؟",
    },
    wallWidthCm: 380,
    wallHeightCm: 280,
    // Mid wall above booth seating / divider zone.
    wall: { x: 0.28, y: 0.12, width: 0.4, height: 0.36 },
    perspective: { rotateYDeg: 3 },
    hangCenterY: 0.4,
    imagePath: "/mockups/rooms/restaurant.jpg",
    theme: {
      wallColor: "#2a2420",
      floorColor: "#1a1614",
      ceilingColor: "#1f1b18",
      trimColor: "#4a3f36",
      accentColor: "#c4a574",
      furnitureColor: "#0e0c0b",
    },
  },
] as const;

export function getRoomMockupPreset(
  id: string,
): RoomMockupPreset | undefined {
  return ROOM_MOCKUP_PRESETS.find((p) => p.id === id);
}

export function getRoomMockupPresetOrDefault(
  id: string | null | undefined,
): RoomMockupPreset {
  return getRoomMockupPreset(id ?? "") ?? ROOM_MOCKUP_PRESETS[0]!;
}
