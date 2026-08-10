import { describe, expect, it } from "vitest";

import {
  makeArtwork,
  makeTemplate,
  makeWall,
} from "@/core/__fixtures__/domain";
import {
  arrangeArtworks,
  recomputeAutoPlacedWorldPositions,
  worldPositionOnWall,
} from "@/core/services/arrange-artworks";
import { createDimensions } from "@/core/value-objects";
import type { Artwork } from "@/core/entities";

describe("arrangeArtworks", () => {
  it("with preserveAssigned, only places unassigned works on free anchors", () => {
    const template = makeTemplate({
      walls: [makeWall("north", [{ preferred: true }, {}, {}])],
    });
    const small: Artwork = makeArtwork("small", {
      order: 0,
      dimensions: createDimensions(40, 40, "cm"),
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });
    const large: Artwork = makeArtwork("large", {
      order: 1,
      dimensions: createDimensions(150, 120, "cm"),
      placement: {
        wallId: "north",
        anchorIndex: null,
        position: [0, 1.6, 0],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });

    const result = arrangeArtworks({
      artworks: [small, large],
      template,
      preserveAssigned: true,
    });

    expect(result.placements.map((p) => p.artworkId)).toEqual(["large"]);
    // Must not steal preferred anchor 0 still held by `small`.
    expect(result.placements[0]?.anchorIndex).toBe(1);
  });

  it("places larger works on preferred anchors first", () => {
    const template = makeTemplate({
      walls: [makeWall("north", [{ preferred: true }, {}, {}])],
    });
    const result = arrangeArtworks({
      artworks: [
        makeArtwork("small", {
          order: 0,
          dimensions: createDimensions(40, 40, "cm"),
        }),
        makeArtwork("large", {
          order: 1,
          dimensions: createDimensions(150, 120, "cm"),
        }),
      ],
      template,
    });

    expect(result.overflow).toEqual([]);
    expect(result.placements).toHaveLength(2);
    const large = result.placements.find((p) => p.artworkId === "large");
    expect(large?.anchorIndex).toBe(0);
  });

  it("never overwrites a hand-positioned artwork", () => {
    const template = makeTemplate({
      walls: [makeWall("north", [{}, {}])],
    });
    const manual: Artwork = makeArtwork("manual", {
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: false,
      },
    });

    const result = arrangeArtworks({
      artworks: [manual, makeArtwork("auto")],
      template,
    });

    expect(result.placements.map((p) => p.artworkId)).toEqual(["auto"]);
    expect(result.placements[0]?.anchorIndex).toBe(1);
  });

  it("reports overflow when every anchor is taken", () => {
    const template = makeTemplate({
      walls: [makeWall("north", [{}])],
    });
    const result = arrangeArtworks({
      artworks: [makeArtwork("a"), makeArtwork("b")],
      template,
    });
    expect(result.placements).toHaveLength(1);
    expect(result.overflow).toEqual(["b"]);
  });

  it("never upscales a small study into a mural", () => {
    const template = makeTemplate({
      walls: [makeWall("north", [{ maxW: 3, maxH: 3 }])],
    });
    const result = arrangeArtworks({
      artworks: [
        makeArtwork("study", {
          dimensions: createDimensions(30, 30, "cm"),
        }),
      ],
      template,
    });
    expect(result.placements[0]?.scale).toBeLessThanOrEqual(1);
  });

  it("places east-wall works on the inward face (not behind the wall)", () => {
    const eastTemplate = makeTemplate({
      walls: [
        makeWall("east", [{ maxW: 2, maxH: 2 }], {
          origin: [5, 0, 0],
          normal: [-1, 0, 0],
          anchors: [
            {
              position: [0.04, 1.55, -2.5],
              maxWidth: 2,
              maxHeight: 2,
            },
          ],
        }),
      ],
    });
    const result = arrangeArtworks({
      artworks: [makeArtwork("side")],
      template: eastTemplate,
    });
    const pos = result.placements[0]?.position;
    expect(pos).toBeTruthy();
    // Must sit inside the room (x < 5), not behind the east wall.
    expect(pos![0]).toBeLessThan(5);
    expect(pos![0]).toBeGreaterThan(4.8);
  });

  it("places west-wall works on the inward face (not behind the wall)", () => {
    const westTemplate = makeTemplate({
      walls: [
        makeWall("west", [{ maxW: 2, maxH: 2 }], {
          origin: [-5, 0, 0],
          normal: [1, 0, 0],
          anchors: [
            {
              position: [-0.04, 1.55, 1.2],
              maxWidth: 2,
              maxHeight: 2,
            },
          ],
        }),
      ],
    });
    const result = arrangeArtworks({
      artworks: [makeArtwork("side")],
      template: westTemplate,
    });
    const pos = result.placements[0]?.position;
    expect(pos).toBeTruthy();
    expect(pos![0]).toBeGreaterThan(-5);
    expect(pos![0]).toBeLessThan(-4.8);
  });

  it("recomputes stored auto-placed world positions on hydrate", () => {
    const wall = makeWall("east", [], {
      origin: [5, 0, 0],
      normal: [-1, 0, 0],
      anchors: [
        {
          position: [0.04, 1.55, -1],
          maxWidth: 2,
          maxHeight: 2,
        },
      ],
    });
    const template = makeTemplate({ walls: [wall] });
    const wrong: Artwork = makeArtwork("wrong", {
      placement: {
        wallId: "east",
        anchorIndex: 0,
        // Legacy bug: origin + raw offset sat behind the wall.
        position: [5.04, 1.55, -1],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });
    const fixed = recomputeAutoPlacedWorldPositions([wrong], template);
    const expected = worldPositionOnWall(wall, wall.anchors[0]!.position);
    expect(fixed[0]!.placement.position[0]).toBeCloseTo(expected[0], 5);
    expect(fixed[0]!.placement.position[0]).toBeLessThan(5);
  });
});
