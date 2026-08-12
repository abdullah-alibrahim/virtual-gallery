import { describe, expect, it } from "vitest";

import {
  formatMuseumWallMeta,
  hasArabicScript,
  museumLetterSpacing,
  museumWallLabelText,
} from "./museum-wall-label";

describe("museum-wall-label", () => {
  it("formats year and medium like a museum didactic", () => {
    expect(formatMuseumWallMeta(1984, "Oil on canvas")).toBe(
      "1984 · Oil on canvas",
    );
    expect(formatMuseumWallMeta(null, "حبر على ورق")).toBe("حبر على ورق");
    expect(formatMuseumWallMeta(2010, "  ")).toBe("2010");
    expect(formatMuseumWallMeta(undefined, undefined)).toBe("");
  });

  it("detects Arabic for RTL letter-spacing", () => {
    expect(hasArabicScript("مراكب")).toBe(true);
    expect(hasArabicScript("Boats")).toBe(false);
    expect(museumLetterSpacing("مراكب", 0.08)).toBe(0);
    expect(museumLetterSpacing("Boats", 0.08)).toBe(0.08);
  });

  it("returns trimmed title + meta", () => {
    expect(museumWallLabelText("  Roads  ", 1999, "Acrylic")).toEqual({
      title: "Roads",
      meta: "1999 · Acrylic",
    });
  });
});
