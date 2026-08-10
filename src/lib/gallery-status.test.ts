import { describe, expect, it } from "vitest";

import { galleryStatusPresentation } from "@/lib/gallery-status";
import { queryKeys } from "@/lib/query-keys";

describe("galleryStatusPresentation", () => {
  it("maps every status to a stable label and variant", () => {
    expect(galleryStatusPresentation("draft")).toEqual({
      variant: "neutral",
      label: "Draft",
      labelKey: "dashboard.draft",
    });
    expect(galleryStatusPresentation("published").variant).toBe("success");
    expect(galleryStatusPresentation("unpublished").variant).toBe("warning");
    expect(galleryStatusPresentation("archived").variant).toBe("outline");
  });
});

describe("queryKeys", () => {
  it("builds stable, hierarchical keys", () => {
    expect(queryKeys.galleries.detail("g1")).toEqual(["galleries", "g1"]);
    expect(queryKeys.artworks.byGallery("g1")).toEqual([
      "artworks",
      "gallery",
      "g1",
    ]);
    expect(queryKeys.session).toEqual(["session"]);
  });
});
