import { describe, expect, it } from "vitest";

import {
  CEILING_TEXTURE_PRESETS,
  FLOOR_TEXTURE_PRESETS,
  WALL_TEXTURE_PRESETS,
  ceilingTextureAlbedoPath,
  floorTextureAlbedoPath,
  isFloorTextureId,
  wallTextureAlbedoPath,
} from "@/core/entities/surface-textures";

describe("surface texture catalogue", () => {
  it("exposes unique floor / wall / ceiling ids", () => {
    const floorIds = FLOOR_TEXTURE_PRESETS.map((p) => p.id);
    const wallIds = WALL_TEXTURE_PRESETS.map((p) => p.id);
    const ceilingIds = CEILING_TEXTURE_PRESETS.map((p) => p.id);
    expect(new Set(floorIds).size).toBe(floorIds.length);
    expect(new Set(wallIds).size).toBe(wallIds.length);
    expect(new Set(ceilingIds).size).toBe(ceilingIds.length);
    expect(floorIds.length).toBeGreaterThanOrEqual(6);
    expect(wallIds.length).toBeGreaterThanOrEqual(3);
  });

  it("resolves albedo paths under /assets/textures", () => {
    expect(floorTextureAlbedoPath("wood_plank")).toMatch(
      /^\/assets\/textures\//,
    );
    expect(wallTextureAlbedoPath("plaster_paint")).toMatch(
      /^\/assets\/textures\//,
    );
    expect(ceilingTextureAlbedoPath("plaster")).toMatch(
      /^\/assets\/textures\//,
    );
    expect(floorTextureAlbedoPath("none")).toBeUndefined();
    expect(floorTextureAlbedoPath(undefined)).toBeUndefined();
    expect(isFloorTextureId("cobblestone")).toBe(true);
    expect(isFloorTextureId("nope")).toBe(false);
  });
});
