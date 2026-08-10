import { describe, expect, it } from "vitest";

import { mockupsHrefFor, spaceHrefFor } from "./mockup-paths";

describe("mockup paths", () => {
  it("builds published gallery URLs", () => {
    expect(
      mockupsHrefFor({
        kind: "published",
        slug: "quiet-rooms",
        artworkId: "dawn-study",
      }),
    ).toBe("/g/quiet-rooms/a/dawn-study/mockups");
    expect(
      spaceHrefFor({
        kind: "published",
        slug: "quiet-rooms",
        artworkId: "dawn-study",
      }),
    ).toBe("/g/quiet-rooms/a/dawn-study/space");
  });

  it("builds demo URLs with artwork query", () => {
    expect(
      mockupsHrefFor({ kind: "demo", artworkId: "dawn-study" }),
    ).toBe("/demo/mockups?artwork=dawn-study");
    expect(
      spaceHrefFor({ kind: "demo", artworkId: "red-field", variant: "pro" }),
    ).toBe("/demo/pro/space?artwork=red-field");
  });
});
