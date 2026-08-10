import { describe, expect, it } from "vitest";

import { createFallbackDataTexture } from "./use-artwork-texture";

describe("createFallbackDataTexture", () => {
  it("builds a distinct non-empty texture per seed", () => {
    const a = createFallbackDataTexture("dawn-study");
    const b = createFallbackDataTexture("quiet-orbit");
    const aData = a.image.data;
    const bData = b.image.data;
    expect(a.image.width).toBe(64);
    expect(a.image.height).toBe(64);
    expect(aData).toBeInstanceOf(Uint8Array);
    expect(aData?.length).toBe(64 * 64 * 4);
    expect(aData?.[3]).toBe(255);
    expect(aData && bData && Buffer.from(aData).equals(Buffer.from(bData))).toBe(
      false,
    );
    a.dispose();
    b.dispose();
  });
});
