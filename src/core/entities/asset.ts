import type { AspectRatio } from "@/core/value-objects/aspect-ratio";
import type { FrameSpec } from "@/core/value-objects/frame-spec";

export type AssetKind = "image" | "audio" | "video";
export type AssetStatus = "uploading" | "processing" | "ready" | "failed";

/**
 * A reusable media object owned by a workspace. Galleries reference assets by
 * id so the same painting can hang in multiple shows without being re-uploaded,
 * and so a processing pipeline can stamp variants without rewriting every
 * artwork that points at it.
 *
 * The original is PRIVATE forever. Visitors only ever receive capped-resolution
 * derived textures — artists' single biggest objection to publishing online.
 */
export interface Asset {
  readonly id: string;
  readonly workspaceId: string;
  readonly kind: AssetKind;
  readonly status: AssetStatus;
  readonly original: AssetOriginal;
  readonly variants: AssetVariants;
  readonly meta: AssetMeta;
  readonly error: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AssetOriginal {
  /** Private Storage path. Never handed to a visitor. */
  readonly path: string;
  readonly bytes: number;
  readonly mime: string;
  readonly width: number | null;
  readonly height: number | null;
}

/**
 * Absolute public CDN URLs for derived variants. Absent until the pipeline
 * finishes; the editor shows a processing state until every required variant
 * is present.
 */
export interface AssetVariants {
  readonly ktx2_512: string | null;
  readonly ktx2_1024: string | null;
  readonly ktx2_2048: string | null;
  readonly thumb_512: string | null;
  readonly audio_m4a: string | null;
}

export interface AssetMeta {
  readonly aspectRatio: AspectRatio | null;
  readonly dominantColor: string | null;
  readonly blurhash: string | null;
  readonly exif: Readonly<Record<string, string | number>> | null;
  /** Derived hang LODs were clarity-boosted; original remains private/unedited. */
  readonly hangClarityEnhanced?: boolean;
}

/**
 * Template catalogue entry. Templates are DATA — adding a gallery style is
 * uploading a GLB plus writing one Firestore document. No template-specific
 * code exists anywhere in the application.
 *
 * Published galleries pin `version` so improving a template never breaks a
 * live show. `tier` gates Luxury and Industrial behind the paid plan for free.
 */
export interface Template {
  readonly id: string;
  readonly version: number;
  readonly name: string;
  readonly tagline: string;
  readonly category: TemplateCategory;
  readonly tier: "free" | "pro";
  readonly status: "active" | "beta" | "deprecated";
  readonly shell: TemplateShell;
  readonly environment: TemplateEnvironment;
  readonly lighting: TemplateLighting;
  /** Surface colours / roughness for the procedural shell renderer. */
  readonly materials: TemplateMaterials;
  /**
   * Optional built architecture (skylight, window, plinths, beams, tracks,
   * benches). Pure data — TemplateShell renders these procedurally when present.
   */
  readonly architecture?: TemplateArchitecture;
  readonly walls: readonly TemplateWall[];
  readonly spawn: {
    readonly position: readonly [number, number, number];
    readonly yaw: number;
  };
  /** Polygon defining the walkable floor, metres relative to the shell origin. */
  readonly walkBounds: readonly (readonly [number, number])[];
  readonly capacity: { readonly recommended: number; readonly max: number };
  readonly frameDefaults: FrameSpec;
  readonly preview: { readonly imagePath: string; readonly videoPath?: string };
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type TemplateCategory =
  | "white"
  | "luxury"
  | "black"
  | "minimal"
  | "industrial"
  | "loft"
  | "atrium"
  | "museum"
  | "night"
  | "coastal"
  | "timber"
  | "brutalist"
  | "zen";

export interface TemplateShell {
  readonly glbPath: string;
  readonly scale: number;
  readonly lightmapPath?: string;
}

export interface TemplateEnvironment {
  readonly hdriPath?: string;
  readonly exposure: number;
  readonly background: string;
  readonly toneMapping: "aces" | "neutral" | "linear";
  readonly fog?: {
    readonly color: string;
    readonly near: number;
    readonly far: number;
  };
}

/**
 * Procedural room materials. Wall/floor swatches in marketing UI read from here
 * so floor never silently falls back to the environment background colour.
 */
/** Procedural floor pattern used by TemplateShell (CanvasTexture). */
export type FloorStyle = "plank" | "parquet" | "concrete" | "stone";

export interface TemplateMaterials {
  readonly wall: string;
  readonly floor: string;
  readonly ceiling: string;
  readonly trim: string;
  readonly wallRoughness?: number;
  readonly floorRoughness?: number;
  readonly floorMetalness?: number;
  readonly ceilingRoughness?: number;
  /** Visible floor pattern; defaults from template category when omitted. */
  readonly floorStyle?: FloorStyle;
  /**
   * Optional CC0 photo albedo from the surface-texture catalogue.
   * When set (and not `"none"`), overrides style-mapped floor albedo.
   */
  readonly floorTextureId?: string;
  /** Optional CC0 wall albedo; procedural plaster when omitted / `"none"`. */
  readonly wallTextureId?: string;
  /** Optional CC0 ceiling albedo; procedural when omitted / `"none"`. */
  readonly ceilingTextureId?: string;
  /**
   * Mid-wall museum band (dado). When set, TemplateShell paints a horizontal
   * strip between `wallBandBottomM` and `wallBandTopM` (metres from floor).
   */
  readonly wallBand?: string;
  readonly wallBandBottomM?: number;
  readonly wallBandTopM?: number;
}

/**
 * Procedural hall architecture beyond walls/floor/ceiling slabs.
 * Omitted on simple rooms — flagship halls opt in.
 */
export interface TemplateArchitecture {
  /** Recessed coffered skylight cut into the ceiling. */
  readonly skylight?: {
    readonly width: number;
    readonly depth: number;
    readonly gridX?: number;
    readonly gridZ?: number;
    /** How far the well drops below the ceiling slab (metres). */
    readonly recessM?: number;
  };
  /** Tall window on a named wall (soft daylight / light-shaft cue). */
  readonly window?: {
    readonly wallId: string;
    readonly width: number;
    readonly height: number;
    /** Height of sill above floor. */
    readonly sillM?: number;
    /** Offset along the wall from centre (metres). */
    readonly offsetM?: number;
    readonly arched?: boolean;
  };
  /** Optional white display plinths (sculptures optional / empty OK). */
  readonly plinths?: readonly {
    readonly position: readonly [number, number, number];
    readonly size: readonly [number, number, number];
  }[];
  /**
   * Exposed wooden ceiling beams. `axis` is the beam length direction
   * (`"x"` = east–west beams spaced along Z).
   */
  readonly beams?: {
    readonly axis: "x" | "z";
    readonly count: number;
    /** Beam length in metres; defaults from walkBounds AABB. */
    readonly lengthM?: number;
    /** Field centre in XZ (defaults to origin). */
    readonly center?: readonly [number, number];
    /** Spacing along the perpendicular axis; auto-fit when omitted. */
    readonly spacingM?: number;
    readonly color?: string;
    /** Cross-section width (metres). */
    readonly widthM?: number;
    /** Vertical depth hanging below the ceiling (metres). */
    readonly heightM?: number;
  };
  /**
   * Black track rails with spot fixtures. Sparse real SpotLights on desktop;
   * mobile keeps fixture geometry only.
   */
  readonly trackLights?: {
    readonly axis: "x" | "z";
    readonly count: number;
    readonly spotsPerRail?: number;
    readonly lengthM?: number;
    readonly center?: readonly [number, number];
    readonly spacingM?: number;
    readonly railColor?: string;
    /** Soft key intensity for up to a few live SpotLights. */
    readonly intensity?: number;
    /**
     * Max live SpotLights on desktop (default 8). Mobile always uses 0 —
     * fixtures stay emissive geometry only.
     */
    readonly maxLive?: number;
  };
  /** Minimalist gallery benches (light wood, block legs). */
  readonly benches?: readonly {
    readonly position: readonly [number, number, number];
    /** Seat slab size: width, height, depth (metres). */
    readonly size: readonly [number, number, number];
    readonly yaw?: number;
    readonly color?: string;
    /**
     * When true (default for flagship halls), render the CC0 Poly Haven bench
     * GLTF fitted to `size`. Procedural box bench when false / unavailable.
     */
    readonly glb?: boolean;
  }[];
  /**
   * Real CC0 GLTF dressing (plants, busts, vases, side tables). Rendered via
   * drei `useGLTF` from `/public/assets/props`.
   */
  readonly glbProps?: readonly ArchitectureGlbProp[];
  /**
   * In-room exhibition title — wall lettering or freestanding plaque.
   * Carries the gallery name in architecture (not only the HUD).
   */
  readonly signs?: readonly ArchitectureSign[];
}

export interface ArchitectureSign {
  readonly text: string;
  readonly subtitle?: string;
  readonly position: readonly [number, number, number];
  readonly yaw?: number;
  /** Board width in metres. */
  readonly width?: number;
  /** Board height in metres. */
  readonly height?: number;
  /** `wall` = mounted panel; `plaque` = freestanding pedestal sign. */
  readonly style?: "wall" | "plaque";
}

export type ArchitectureGlbModel =
  | "bench"
  | "plant"
  | "bust"
  | "vase"
  | "plinth_table";

export interface ArchitectureGlbProp {
  readonly model: ArchitectureGlbModel;
  readonly position: readonly [number, number, number];
  readonly yaw?: number;
  /** Uniform scale (default 1). Ignored when `fitSize` is set. */
  readonly scale?: number;
  /** Fit to this width/height/depth in metres. */
  readonly fitSize?: readonly [number, number, number];
}

export interface TemplateLighting {
  readonly ambient: { readonly color: string; readonly intensity: number };
  /** Soft hemisphere sky / ground bounce. */
  readonly hemisphere?: {
    readonly skyColor: string;
    readonly groundColor: string;
    readonly intensity: number;
  };
  /** Key directional (sun / skylight). */
  readonly key?: {
    readonly color: string;
    readonly intensity: number;
    readonly position: readonly [number, number, number];
  };
  /** Cooler fill opposite the key. */
  readonly fill?: {
    readonly color: string;
    readonly intensity: number;
    readonly position: readonly [number, number, number];
  };
  /** Rim / back light for silhouette separation. */
  readonly rim?: {
    readonly color: string;
    readonly intensity: number;
    readonly position: readonly [number, number, number];
  };
  readonly presets: readonly TemplateLightingPreset[];
}

export interface TemplateLightingPreset {
  readonly id: string;
  readonly label: string;
  readonly spotIntensity: number;
  readonly temperatureK: number;
}

/**
 * A wall is a plane with a set of hanging anchors. Anchors are the only places
 * artwork may land — that constraint is what makes the editor usable by someone
 * who has never opened a 3D tool.
 */
export interface TemplateWall {
  readonly id: string;
  readonly label: string;
  readonly origin: readonly [number, number, number];
  readonly normal: readonly [number, number, number];
  readonly width: number;
  readonly height: number;
  readonly anchors: readonly TemplateAnchor[];
}

export interface TemplateAnchor {
  readonly position: readonly [number, number, number];
  readonly maxWidth: number;
  readonly maxHeight: number;
  /** Hero slots are preferred by auto-arrange for the first few uploads. */
  readonly preferred?: boolean;
}

export type LeadStatus = "new" | "read" | "replied" | "archived";

export interface Lead {
  readonly id: string;
  readonly galleryId: string;
  readonly workspaceId: string;
  readonly artworkId: string | null;
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly status: LeadStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
