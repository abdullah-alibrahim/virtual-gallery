import { describe, expect, it } from "vitest";

import { pickSparseTrackIndices } from "./track-lighting-utils";

describe("pickSparseTrackIndices", () => {
  it("returns empty when no live budget", () => {
    expect(pickSparseTrackIndices(12, 0)).toEqual([]);
    expect(pickSparseTrackIndices(0, 5)).toEqual([]);
  });

  it("returns all indices when under budget", () => {
    expect(pickSparseTrackIndices(3, 5)).toEqual([0, 1, 2]);
  });

  it("spreads live spots across the rail set", () => {
    expect(pickSparseTrackIndices(10, 5)).toEqual([0, 2, 5, 7, 9]);
    expect(pickSparseTrackIndices(18, 5)).toHaveLength(5);
    expect(pickSparseTrackIndices(18, 5)[0]).toBe(0);
    expect(pickSparseTrackIndices(18, 5).at(-1)).toBe(17);
  });

  it("supports an 8-spot desktop budget across long rails", () => {
    const live = pickSparseTrackIndices(18, 8);
    expect(live).toHaveLength(8);
    expect(live[0]).toBe(0);
    expect(live.at(-1)).toBe(17);
  });
});
