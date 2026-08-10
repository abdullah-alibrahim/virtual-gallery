import { describe, expect, it } from "vitest";

import { formatStorageBytes, formatTemplateTiers } from "./format";

describe("formatStorageBytes", () => {
  it("formats MB under 1 GB", () => {
    expect(formatStorageBytes(500 * 1024 * 1024)).toBe("500 MB");
  });

  it("formats whole GB values", () => {
    expect(formatStorageBytes(10 * 1024 * 1024 * 1024)).toBe("10 GB");
  });
});

describe("formatTemplateTiers", () => {
  it("humanizes tier ids", () => {
    expect(formatTemplateTiers(["free", "pro"])).toBe(
      "Free rooms + Pro rooms",
    );
  });
});
