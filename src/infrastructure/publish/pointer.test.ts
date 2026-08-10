import { describe, expect, it } from "vitest";

import type { LatestPointer } from "@/core/services/compile-scene-manifest";
import {
  latestPointerPath,
  manifestPath,
} from "@/core/services/compile-scene-manifest";

describe("publish pointer contract", () => {
  it("keeps latest pointer JSON-serialisable for Storage", () => {
    const pointer: LatestPointer = {
      galleryId: "g1",
      slug: "quiet-rooms",
      version: 2,
      manifestPath: manifestPath("quiet-rooms", 2),
      publishedAt: "2026-08-01T12:00:00.000Z",
    };

    const roundTrip = JSON.parse(JSON.stringify(pointer)) as LatestPointer;
    expect(roundTrip).toEqual(pointer);
    expect(latestPointerPath(pointer.slug)).toBe(
      "published/quiet-rooms/latest.json",
    );
  });
});
