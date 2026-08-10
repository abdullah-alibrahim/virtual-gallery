import { describe, expect, it } from "vitest";

import { fourWallRoom, roomWalkBounds } from "@/core/templates/build-room";
import { findEnclosureGaps, rayHitWallDistance } from "@/three/math/wall-enclosure";

describe("wall enclosure", () => {
  it("hits the north wall of a box room when looking north", () => {
    const walls = fourWallRoom({ width: 8, depth: 6, height: 3.2 });
    const dist = rayHitWallDistance([0, 0], [0, -1], walls);
    expect(dist).toBeCloseTo(3, 1);
  });

  it("reports no gaps for a simple four-wall room", () => {
    const walls = fourWallRoom({ width: 8, depth: 6, height: 3.2 });
    const template = {
      id: "box",
      walls,
      walkBounds: roomWalkBounds(3.6, 2.6),
      spawn: { position: [0, 1.5, 1] as const, yaw: Math.PI },
    };
    expect(
      findEnclosureGaps(template as never, { maxDist: 20 }),
    ).toEqual([]);
  });
});
