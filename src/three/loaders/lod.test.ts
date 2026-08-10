import { describe, expect, it } from "vitest";

import {
  pickLodLevel,
  pickLodLevelStable,
  textureUrlForLod,
} from "@/three/loaders/lod";

describe("pickLodLevel", () => {
  it("promotes near artworks on desktop", () => {
    expect(pickLodLevel(1.5, false)).toBe(0);
    expect(pickLodLevel(4, false)).toBe(1);
    expect(pickLodLevel(8, false)).toBe(2);
  });

  it("caps mobile at lod1", () => {
    expect(pickLodLevel(1, true)).toBe(1);
    expect(pickLodLevel(9, true)).toBe(2);
  });
});

describe("pickLodLevelStable", () => {
  it("holds lod across the bare threshold until hysteresis clears", () => {
    expect(pickLodLevelStable(2.5, false, 0)).toBe(0);
    expect(pickLodLevelStable(3.0, false, 0)).toBe(1);
    expect(pickLodLevelStable(2.2, false, 1)).toBe(1);
    expect(pickLodLevelStable(1.9, false, 1)).toBe(0);
  });

  it("avoids mobile lod thrash near the mid threshold", () => {
    expect(pickLodLevelStable(3.4, true, 1)).toBe(1);
    expect(pickLodLevelStable(3.8, true, 1)).toBe(2);
    expect(pickLodLevelStable(3.0, true, 2)).toBe(2);
    expect(pickLodLevelStable(2.6, true, 2)).toBe(1);
  });
});

describe("textureUrlForLod", () => {
  const textures = {
    lod0: "https://cdn/a-0.webp",
    lod1: "https://cdn/a-1.webp",
    lod2: "https://cdn/a-2.webp",
  };

  it("falls back when a rung is missing", () => {
    expect(
      textureUrlForLod({ lod0: "", lod1: textures.lod1, lod2: textures.lod2 }, 0),
    ).toBe(textures.lod1);
  });
});
