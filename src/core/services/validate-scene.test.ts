import { describe, expect, it } from "vitest";

import {
  makeArtwork,
  makeSettings,
  makeTemplate,
  makeWall,
} from "@/core/__fixtures__/domain";
import { assertAssetReady, validateScene } from "@/core/services/validate-scene";
import { AssetNotReadyError } from "@/core/errors";

describe("validateScene", () => {
  it("returns no issues for a ready, titled, placed artwork", () => {
    const artwork = makeArtwork("ok", {
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });
    const issues = validateScene({
      artworks: [artwork],
      template: makeTemplate(),
      settings: makeSettings(),
      assetReady: new Map([[artwork.assetId, true]]),
    });
    expect(issues).toEqual([]);
  });

  it("flags an empty gallery", () => {
    const issues = validateScene({
      artworks: [],
      template: makeTemplate(),
      settings: makeSettings(),
      assetReady: new Map(),
    });
    expect(issues.some((i) => i.kind === "missing-placement")).toBe(true);
  });

  it("flags missing titles and unready assets", () => {
    const artwork = makeArtwork("blank", {
      title: "   ",
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });
    const issues = validateScene({
      artworks: [artwork],
      template: makeTemplate(),
      settings: makeSettings(),
      assetReady: new Map([[artwork.assetId, false]]),
    });
    expect(issues.map((i) => i.kind).sort()).toEqual([
      "asset-not-ready",
      "missing-title",
    ]);
  });

  it("flags overlapping anchors", () => {
    const a = makeArtwork("a", {
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });
    const b = makeArtwork("b", {
      order: 1,
      placement: {
        wallId: "north",
        anchorIndex: 0,
        position: [0, 1.6, 0.05],
        rotation: [0, 0, 0],
        scale: 1,
        autoPlaced: true,
      },
    });
    const issues = validateScene({
      artworks: [a, b],
      template: makeTemplate({ walls: [makeWall("north", [{}, {}])] }),
      settings: makeSettings(),
      assetReady: new Map([
        [a.assetId, true],
        [b.assetId, true],
      ]),
    });
    expect(issues.some((i) => i.kind === "overlapping-artwork")).toBe(true);
  });

  it("assertAssetReady throws a typed error", () => {
    expect(() => assertAssetReady("a1", false, "processing")).toThrow(
      AssetNotReadyError,
    );
    expect(() => assertAssetReady("a1", true, "ready")).not.toThrow();
  });
});
