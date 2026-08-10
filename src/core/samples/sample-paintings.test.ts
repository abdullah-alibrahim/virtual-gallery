import { describe, expect, it } from "vitest";

import {
  SAMPLE_PAINTINGS,
  isSampleAssetId,
  resolveSampleTextureUrl,
  sampleAssetId,
} from "@/core/samples/sample-paintings";

describe("sample paintings pack", () => {
  it("exposes nine JPG starter works with sample: asset ids", () => {
    expect(SAMPLE_PAINTINGS).toHaveLength(9);
    for (const painting of SAMPLE_PAINTINGS) {
      const id = sampleAssetId(painting.id);
      expect(isSampleAssetId(id)).toBe(true);
      expect(resolveSampleTextureUrl(id)).toBe(`/demo/artworks/${painting.file}`);
      expect(painting.file.endsWith(".jpg")).toBe(true);
    }
  });
});
