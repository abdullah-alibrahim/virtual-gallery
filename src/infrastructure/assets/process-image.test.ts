import { describe, expect, it } from "vitest";

import { processImage } from "@/infrastructure/assets/process-image";

/** Minimal 64×48 opaque PNG. */
async function tinyPng(): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp({
    create: {
      width: 64,
      height: 48,
      channels: 3,
      background: { r: 180, g: 90, b: 40 },
    },
  })
    .png()
    .toBuffer();
}

describe("processImage", () => {
  it("builds a WebP thumb, three LODs, blurhash, and aspect ratio", async () => {
    const result = await processImage(await tinyPng());

    expect(result.width).toBe(64);
    expect(result.height).toBe(48);
    expect(result.aspectRatio).toBeCloseTo(64 / 48, 5);
    expect(result.blurhash.length).toBeGreaterThan(6);
    expect(result.thumb512.byteLength).toBeGreaterThan(32);
    expect(result.lods).toHaveLength(3);
    expect(result.lods.map((l) => l.size)).toEqual([512, 1024, 2048]);
    // Without BASISU_BIN, LODs are WebP stand-ins in the ktx2 slots.
    expect(result.textureFormat).toBe("webp");
    for (const lod of result.lods) {
      expect(lod.extension).toBe("webp");
      expect(lod.buffer.byteLength).toBeGreaterThan(32);
    }
  });
});
