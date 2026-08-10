import { describe, expect, it } from "vitest";

import { makeArtwork, makeWall } from "@/core/__fixtures__/domain";
import { worldPositionOnWall } from "@/core/services/arrange-artworks";
import {
  ANCHOR_SNAP_M,
  alignPlacementToEyeLine,
  buildPlacementOnWall,
  distributePlacementsOnWall,
  EYE_LINE_M,
  intersectRayWithWall,
  nearestAnchor,
  nudgePlacement,
  pickWallFromRay,
  placementFromWorldPoint,
  positionOnWall,
  wallCoords,
} from "@/core/services/wall-placement";

describe("wall-placement", () => {
  const wall = makeWall(
    "north",
    [
      { preferred: true },
      {},
      {},
    ],
    {
      origin: [0, 0, -4],
      normal: [0, 0, 1],
      width: 8,
      height: 3.5,
    },
  );

  it("places free positions on the inward face with inset", () => {
    const pos = positionOnWall(wall, 1.5, EYE_LINE_M);
    const expected = worldPositionOnWall(wall, [1.5, EYE_LINE_M, 0], 0.06);
    expect(pos[0]).toBeCloseTo(expected[0], 5);
    expect(pos[1]).toBeCloseTo(expected[1], 5);
    expect(pos[2]).toBeCloseTo(expected[2], 5);
    expect(pos[2]).toBeGreaterThan(wall.origin[2]);
  });

  it("round-trips wallCoords for along/height", () => {
    const world = positionOnWall(wall, -2.25, 1.2);
    const coords = wallCoords(wall, world);
    expect(coords.along).toBeCloseTo(-2.25, 4);
    expect(coords.height).toBeCloseTo(1.2, 4);
  });

  it("buildPlacementOnWall marks autoPlaced false and sets yaw", () => {
    const placement = buildPlacementOnWall({
      wall,
      along: 0.5,
      height: 1.4,
      scale: 1.1,
      snapToAnchors: false,
    });
    expect(placement.autoPlaced).toBe(false);
    expect(placement.anchorIndex).toBeNull();
    expect(placement.wallId).toBe("north");
    expect(placement.scale).toBe(1.1);
    expect(placement.rotation[1]).toBeCloseTo(Math.atan2(0, 1), 5);
  });

  it("snaps to a nearby anchor when enabled", () => {
    const anchorWorld = worldPositionOnWall(wall, wall.anchors[0]!.position);
    const { along, height } = wallCoords(wall, anchorWorld);
    const placement = buildPlacementOnWall({
      wall,
      along: along + ANCHOR_SNAP_M * 0.4,
      height: height + 0.05,
      scale: 1,
      snapToAnchors: true,
    });
    expect(placement.anchorIndex).toBe(0);
    expect(placement.position[0]).toBeCloseTo(anchorWorld[0], 3);
    expect(placement.position[1]).toBeCloseTo(anchorWorld[1], 3);
  });

  it("nearestAnchor returns null outside snap radius", () => {
    expect(nearestAnchor(wall, 3.5, 0.5, 0.1)).toBeNull();
  });

  it("placementFromWorldPoint projects onto the wall plane", () => {
    const hit = placementFromWorldPoint({
      wall,
      worldPoint: [0.8, 1.7, -3],
      scale: 1,
      snapToAnchors: false,
    });
    expect(hit.autoPlaced).toBe(false);
    expect(hit.position[1]).toBeCloseTo(1.7, 3);
    const coords = wallCoords(wall, hit.position);
    expect(coords.along).toBeCloseTo(0.8, 3);
  });

  it("nudgePlacement shifts along the wall", () => {
    const start = buildPlacementOnWall({
      wall,
      along: 0,
      height: EYE_LINE_M,
      scale: 1,
    });
    const nudged = nudgePlacement({
      wall,
      placement: start,
      dAlong: 0.4,
      dHeight: -0.1,
      snapToAnchors: false,
    });
    const coords = wallCoords(wall, nudged.position);
    expect(coords.along).toBeCloseTo(0.4, 4);
    expect(coords.height).toBeCloseTo(EYE_LINE_M - 0.1, 4);
  });

  it("nudgePlacement respects lock", () => {
    const start = {
      ...buildPlacementOnWall({
        wall,
        along: 0,
        height: EYE_LINE_M,
        scale: 1,
      }),
      locked: true,
    };
    const nudged = nudgePlacement({
      wall,
      placement: start,
      dAlong: 1,
      dHeight: 1,
    });
    expect(nudged).toEqual(start);
  });

  it("alignPlacementToEyeLine keeps along and sets height", () => {
    const start = buildPlacementOnWall({
      wall,
      along: -1.2,
      height: 2.4,
      scale: 1,
    });
    const aligned = alignPlacementToEyeLine(wall, start);
    const coords = wallCoords(wall, aligned.position);
    expect(coords.along).toBeCloseTo(-1.2, 4);
    expect(coords.height).toBeCloseTo(EYE_LINE_M, 4);
    expect(aligned.autoPlaced).toBe(false);
  });

  it("distributePlacementsOnWall spaces unlocked works evenly", () => {
    const a = makeArtwork("a", {
      placement: {
        ...buildPlacementOnWall({ wall, along: -1, height: 1.5, scale: 1 }),
        wallId: wall.id,
      },
    });
    const b = makeArtwork("b", {
      placement: {
        ...buildPlacementOnWall({ wall, along: 0.2, height: 1.8, scale: 1 }),
        wallId: wall.id,
      },
    });
    const c = makeArtwork("c", {
      placement: {
        ...buildPlacementOnWall({ wall, along: 2, height: 1.2, scale: 1 }),
        wallId: wall.id,
      },
    });
    const next = distributePlacementsOnWall({
      wall,
      artworks: [a, b, c],
      margin: 0.5,
    });
    expect(next.size).toBe(3);
    const alongs = [a, b, c]
      .map((art) => wallCoords(wall, next.get(art.id)!.position).along)
      .sort((x, y) => x - y);
    expect(alongs[0]).toBeCloseTo(-3.5, 3);
    expect(alongs[1]).toBeCloseTo(0, 3);
    expect(alongs[2]).toBeCloseTo(3.5, 3);
    expect(wallCoords(wall, next.get("b")!.position).height).toBeCloseTo(1.8, 3);
  });

  it("distribute skips locked artworks", () => {
    const locked = makeArtwork("locked", {
      placement: {
        ...buildPlacementOnWall({ wall, along: -2, height: 1.5, scale: 1 }),
        wallId: wall.id,
        locked: true,
      },
    });
    const free = makeArtwork("free", {
      placement: {
        ...buildPlacementOnWall({ wall, along: 2, height: 1.5, scale: 1 }),
        wallId: wall.id,
      },
    });
    const next = distributePlacementsOnWall({
      wall,
      artworks: [locked, free],
    });
    expect(next.has("locked")).toBe(false);
    expect(next.has("free")).toBe(true);
    expect(wallCoords(wall, next.get("free")!.position).along).toBeCloseTo(0, 3);
  });

  it("pickWallFromRay chooses the nearest hit wall", () => {
    const east = makeWall("east", [{}], {
      origin: [4, 0, 0],
      normal: [-1, 0, 0],
      width: 8,
      height: 3.5,
    });
    const hit = pickWallFromRay(
      [wall, east],
      [0, 1.6, 0],
      [0, 0, -1],
    );
    expect(hit?.wall.id).toBe("north");
    expect(hit!.point[2]).toBeCloseTo(wall.origin[2], 2);
  });

  it("intersectRayWithWall rejects rays that miss extents", () => {
    const miss = intersectRayWithWall([0, 1.6, 0], [1, 0, 0], wall);
    expect(miss).toBeNull();
  });
});
