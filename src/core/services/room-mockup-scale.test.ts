import { describe, expect, it } from "vitest";

import { ROOM_MOCKUP_PRESETS } from "@/core/entities/room-mockup";
import { createDimensions } from "@/core/value-objects/dimensions";
import { createFrameSpec } from "@/core/value-objects/frame-spec";
import {
  computeWallPlacement,
  dimensionsToCm,
  evaluateFit,
  framedOuterSizeCm,
  pixelsForWallReference,
  pixelsFromReferenceSegment,
  segmentLengthPx,
  softSnap,
} from "@/core/services/room-mockup-scale";

describe("dimensionsToCm", () => {
  it("passes centimetres through", () => {
    expect(dimensionsToCm(createDimensions(120, 80, "cm"))).toEqual({
      widthCm: 120,
      heightCm: 80,
    });
  });

  it("converts inches", () => {
    const cm = dimensionsToCm(createDimensions(40, 30, "in"));
    expect(cm.widthCm).toBeCloseTo(101.6, 1);
    expect(cm.heightCm).toBeCloseTo(76.2, 1);
  });
});

describe("framedOuterSizeCm", () => {
  it("adds moulding and matte on both sides", () => {
    const frame = createFrameSpec({
      style: "gallery",
      color: "#111111",
      widthCm: 2.5,
      matteCm: 5,
    });
    // 120 + 2*(2.5+5) = 135
    expect(framedOuterSizeCm(createDimensions(120, 80, "cm"), frame)).toEqual({
      widthCm: 135,
      heightCm: 95,
    });
  });

  it("keeps canvas size when frame and matte are zero", () => {
    const frame = createFrameSpec({
      style: "none",
      color: "#111111",
      widthCm: 0,
      matteCm: 0,
    });
    expect(framedOuterSizeCm(createDimensions(100, 100, "cm"), frame)).toEqual({
      widthCm: 100,
      heightCm: 100,
    });
  });
});

describe("computeWallPlacement", () => {
  const living = ROOM_MOCKUP_PRESETS.find((p) => p.id === "living-room")!;

  it("maps painting cm to wall fraction", () => {
    // Living wall is 280 × 260 cm. 120×80 framed outer with no border.
    const placement = computeWallPlacement(
      { widthCm: 120, heightCm: 80 },
      living,
    );
    expect(placement.widthFraction).toBeCloseTo(120 / 280, 5);
    expect(placement.heightFraction).toBeCloseTo(80 / 260, 5);
    expect(placement.offsetX).toBeCloseTo((1 - 120 / 280) / 2, 5);
  });

  it("centres horizontally on the hang plane", () => {
    const placement = computeWallPlacement(
      { widthCm: 140, heightCm: 100 },
      living,
    );
    expect(placement.widthFraction).toBeCloseTo(0.5);
    expect(placement.offsetX).toBeCloseTo(0.25);
  });
});

describe("evaluateFit", () => {
  const hall = ROOM_MOCKUP_PRESETS.find((p) => p.id === "hall")!;

  it("marks a modest work as comfortable", () => {
    const verdict = evaluateFit({ widthCm: 100, heightCm: 80 }, hall);
    expect(verdict.level).toBe("comfortable");
    expect(verdict.occupancy).toBeLessThanOrEqual(0.6);
  });

  it("marks a large work as tight", () => {
    // Hall wall 320 × 280 — 220 cm wide ≈ 69%
    const verdict = evaluateFit({ widthCm: 220, heightCm: 180 }, hall);
    expect(verdict.level).toBe("tight");
  });

  it("marks an oversized work as too_large", () => {
    const verdict = evaluateFit({ widthCm: 320, heightCm: 280 }, hall);
    expect(verdict.level).toBe("too_large");
  });
});

describe("room mockup photo presets", () => {
  it("ships five photo backdrops with calibrated hang planes", () => {
    expect(ROOM_MOCKUP_PRESETS).toHaveLength(5);
    for (const preset of ROOM_MOCKUP_PRESETS) {
      expect(preset.imagePath).toMatch(/^\/mockups\/rooms\/.+\.jpg$/);
      expect(preset.wall.width).toBeGreaterThan(0.2);
      expect(preset.wall.height).toBeGreaterThan(0.25);
      expect(preset.wall.x + preset.wall.width).toBeLessThanOrEqual(1.01);
      expect(preset.wall.y + preset.wall.height).toBeLessThanOrEqual(1.01);
    }
  });
});

describe("pixelsForWallReference", () => {
  it("scales artwork to image pixels from wall width", () => {
    // 3200 px image of a 320 cm wall → 10 px/cm. 100 cm work → 1000 px.
    const px = pixelsForWallReference(
      { widthCm: 100, heightCm: 80 },
      3200,
      320,
    );
    expect(px.widthCm).toBeCloseTo(1000);
    expect(px.heightCm).toBeCloseTo(800);
  });
});

describe("pixelsFromReferenceSegment", () => {
  it("scales from a two-point measured span", () => {
    // 800 px span = 200 cm → 4 px/cm. 100×80 work → 400×320 px.
    const px = pixelsFromReferenceSegment(
      { widthCm: 100, heightCm: 80 },
      800,
      200,
    );
    expect(px.widthCm).toBeCloseTo(400);
    expect(px.heightCm).toBeCloseTo(320);
  });

  it("matches full-width reference when segment spans the image", () => {
    const full = pixelsForWallReference(
      { widthCm: 120, heightCm: 90 },
      2400,
      300,
    );
    const seg = pixelsFromReferenceSegment(
      { widthCm: 120, heightCm: 90 },
      2400,
      300,
    );
    expect(seg.widthCm).toBeCloseTo(full.widthCm);
    expect(seg.heightCm).toBeCloseTo(full.heightCm);
  });
});

describe("segmentLengthPx", () => {
  it("computes pixel distance between normalized points", () => {
    const len = segmentLengthPx(
      { x: 0.25, y: 0.5 },
      { x: 0.75, y: 0.5 },
      2000,
      1500,
    );
    expect(len).toBeCloseTo(1000);
  });
});

describe("softSnap", () => {
  it("snaps when within threshold", () => {
    expect(softSnap(0.98, 1, 0.03)).toBe(1);
    expect(softSnap(-0.5, 0, 0.75)).toBe(0);
  });

  it("leaves values outside threshold unchanged", () => {
    expect(softSnap(1.2, 1, 0.03)).toBe(1.2);
    expect(softSnap(5, 0, 0.75)).toBe(5);
  });
});
