import { describe, expect, it } from "vitest";

import {
  ACCEPTED_IMAGE_TYPES,
  isAcceptedImageType,
  MAX_UPLOAD_BYTES,
  originalStoragePath,
  variantStoragePath,
} from "@/core/services/asset-upload";

describe("asset-upload helpers", () => {
  it("accepts the image MIME allow-list", () => {
    expect(isAcceptedImageType("image/tiff")).toBe(true);
    expect(isAcceptedImageType("application/pdf")).toBe(false);
    expect(ACCEPTED_IMAGE_TYPES).toContain("image/jpeg");
  });

  it("builds private original and public variant paths", () => {
    expect(originalStoragePath("w1", "a1", "study.tif")).toBe(
      "workspaces/w1/originals/a1/study.tif",
    );
    expect(variantStoragePath("w1", "a1", "thumb_512.webp")).toBe(
      "workspaces/w1/assets/a1/thumb_512.webp",
    );
  });

  it("caps uploads at 80 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(80 * 1024 * 1024);
  });
});
