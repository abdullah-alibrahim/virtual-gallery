import type {
  Artwork,
  PlacementProposal,
  SceneTemplate,
  TemplateWall,
} from "@/core/entities";
import { toMetres } from "@/core/value-objects";

/**
 * Strategy for placing artworks on template walls. v1 ships with `balanced`.
 * The roadmap's AI auto-arrange is a second implementation behind this same
 * interface — the editor never changes.
 */
export type ArrangeStrategy = "balanced" | "chronological" | "hero-first";

export interface ArrangeInput {
  readonly artworks: readonly Artwork[];
  readonly template: SceneTemplate;
  readonly strategy?: ArrangeStrategy;
  /**
   * When true, leave artworks whose `placement.autoPlaced` is false alone.
   * Default true — "Auto arrange" must never overwrite a hand-positioned work.
   */
  readonly preserveManual?: boolean;
  /**
   * When true, artworks that already have an `anchorIndex` keep that slot and
   * are not re-placed. Only unassigned works (`anchorIndex === null`) claim
   * free anchors. Used by hang/fill so sequential placement never stacks —
   * hang applies only the new work's proposal, so reshuffling existing
   * auto-placed works would leave two pieces on the same world position.
   */
  readonly preserveAssigned?: boolean;
}

export interface ArrangeResult {
  readonly placements: readonly PlacementProposal[];
  /** Artwork ids that could not be placed because every wall is full. */
  readonly overflow: readonly string[];
}

/**
 * Pure placement engine. No React, no Three.js, no Firebase.
 *
 * Takes aspect ratios and physical dimensions and returns wall / anchor /
 * position / rotation / scale plus a spotlight aim. Layout quality is a unit
 * test rather than a manual click-through.
 *
 * Algorithm (balanced):
 *   1. Sort artworks by area descending so large works claim preferred anchors.
 *   2. Walk walls in declaration order; within a wall, preferred anchors first.
 *   3. Fit the artwork into the anchor envelope, preserving aspect ratio.
 *   4. Aim a spotlight at the canvas centre with template preset intensity.
 */
export function arrangeArtworks(input: ArrangeInput): ArrangeResult {
  const strategy = input.strategy ?? "balanced";
  const preserveManual = input.preserveManual ?? true;
  const preserveAssigned = input.preserveAssigned ?? false;

  const isLocked = (artwork: Artwork): boolean => {
    if (artwork.placement.locked) return true;
    if (preserveAssigned && artwork.placement.anchorIndex !== null) return true;
    if (preserveManual && !artwork.placement.autoPlaced) return true;
    return false;
  };

  const movable = input.artworks.filter((a) => !isLocked(a));
  const ordered = orderForStrategy(movable, strategy);

  const occupied = new Set(
    input.artworks
      .filter(isLocked)
      .map((a) => occupancyKey(a.placement.wallId, a.placement.anchorIndex)),
  );

  const walls = input.template.walls;
  const preset = input.template.lighting.presets[0];
  const placements: PlacementProposal[] = [];
  const overflow: string[] = [];

  for (const artwork of ordered) {
    const slot = findSlot(artwork, walls, occupied);
    if (!slot) {
      overflow.push(artwork.id);
      continue;
    }

    const { wall, anchorIndex, anchor } = slot;
    occupied.add(occupancyKey(wall.id, anchorIndex));

    const metres = toMetres(artwork.dimensions);
    const scale = fitScale(metres.width, metres.height, anchor.maxWidth, anchor.maxHeight);

    // World position on the *inward* face of the wall. Anchor offsets in
    // catalogue data are world-axis deltas from `origin`; the normal-aligned
    // component often has the wrong sign on east/west walls, so we strip it and
    // always push a few centimetres along the wall normal (into the room).
    const position = worldPositionOnWall(wall, anchor.position);
    const yaw = Math.atan2(wall.normal[0], wall.normal[2]);

    placements.push({
      artworkId: artwork.id,
      wallId: wall.id,
      anchorIndex,
      position,
      rotation: [0, yaw, 0],
      scale,
      lighting: {
        intensity: preset?.spotIntensity ?? 1.2,
        angle: Math.PI / 6,
        temperatureK: preset?.temperatureK ?? 4000,
      },
    });
  }

  return { placements, overflow };
}

/**
 * Place an artwork on the room side of a wall.
 * Lateral (along-wall) offset is preserved; depth uses `normal * inset`.
 */
export function worldPositionOnWall(
  wall: TemplateWall,
  anchorPosition: readonly [number, number, number],
  inset = 0.06,
): readonly [number, number, number] {
  const [nx, ny, nz] = wall.normal;
  const [ax, ay, az] = anchorPosition;
  const alongNormal = ax * nx + ay * ny + az * nz;
  const lateralX = ax - nx * alongNormal;
  const lateralY = ay - ny * alongNormal;
  const lateralZ = az - nz * alongNormal;
  return [
    wall.origin[0] + lateralX + nx * inset,
    wall.origin[1] + lateralY + ny * inset,
    wall.origin[2] + lateralZ + nz * inset,
  ];
}

/**
 * Recompute world position / yaw for auto-placed works from their stored
 * wall + anchor. Fixes galleries that persisted east/west positions behind
 * the wall without reshuffling manual placements or anchor assignments.
 */
export function recomputeAutoPlacedWorldPositions(
  artworks: readonly Artwork[],
  template: SceneTemplate,
): Artwork[] {
  return artworks.map((artwork) => {
    if (!artwork.placement.autoPlaced) return artwork;
    const wall = template.walls.find((w) => w.id === artwork.placement.wallId);
    if (!wall) return artwork;
    const idx = artwork.placement.anchorIndex;
    if (idx == null || idx < 0 || idx >= wall.anchors.length) return artwork;
    const anchor = wall.anchors[idx];
    if (!anchor) return artwork;

    const position = worldPositionOnWall(wall, anchor.position);
    const yaw = Math.atan2(wall.normal[0], wall.normal[2]);
    const rotation: readonly [number, number, number] = [0, yaw, 0];

    if (
      positionsClose(artwork.placement.position, position) &&
      positionsClose(artwork.placement.rotation, rotation)
    ) {
      return artwork;
    }

    return {
      ...artwork,
      placement: {
        ...artwork.placement,
        position,
        rotation,
      },
    };
  });
}

function positionsClose(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  epsilon = 1e-4,
): boolean {
  return (
    Math.abs(a[0] - b[0]) < epsilon &&
    Math.abs(a[1] - b[1]) < epsilon &&
    Math.abs(a[2] - b[2]) < epsilon
  );
}

function orderForStrategy(
  artworks: readonly Artwork[],
  strategy: ArrangeStrategy,
): Artwork[] {
  const copy = [...artworks];
  switch (strategy) {
    case "balanced":
      return copy.sort((a, b) => area(b) - area(a));
    case "chronological":
      return copy.sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.order - b.order);
    case "hero-first":
      return copy.sort((a, b) => a.order - b.order);
  }
}

function area(artwork: Artwork): number {
  return artwork.dimensions.width * artwork.dimensions.height;
}

function findSlot(
  artwork: Artwork,
  walls: readonly TemplateWall[],
  occupied: ReadonlySet<string>,
): { wall: TemplateWall; anchorIndex: number; anchor: TemplateWall["anchors"][number] } | null {
  const metres = toMetres(artwork.dimensions);

  for (const wall of walls) {
    // Preferred anchors first, then the rest in declaration order.
    const ranked = wall.anchors
      .map((anchor, anchorIndex) => ({ anchor, anchorIndex }))
      .sort((a, b) => Number(Boolean(b.anchor.preferred)) - Number(Boolean(a.anchor.preferred)));

    for (const { anchor, anchorIndex } of ranked) {
      if (occupied.has(occupancyKey(wall.id, anchorIndex))) continue;
      if (metres.width > anchor.maxWidth * 1.05) continue;
      if (metres.height > anchor.maxHeight * 1.05) continue;
      return { wall, anchorIndex, anchor };
    }
  }
  return null;
}

/**
 * Uniform scale so the artwork fits inside the anchor envelope with a small
 * margin. Never upscales beyond 1 — a 30cm study must not become a mural.
 */
function fitScale(
  widthM: number,
  heightM: number,
  maxWidth: number,
  maxHeight: number,
): number {
  const margin = 0.92;
  const sx = (maxWidth * margin) / widthM;
  const sy = (maxHeight * margin) / heightM;
  return Math.min(1, sx, sy);
}

function occupancyKey(wallId: string, anchorIndex: number | null): string {
  return `${wallId}:${anchorIndex ?? "free"}`;
}
