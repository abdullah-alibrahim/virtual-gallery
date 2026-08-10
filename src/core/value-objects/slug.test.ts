import { describe, expect, it } from "vitest";

import {
  isReservedSlug,
  isValidSlug,
  slugify,
  toSlug,
} from "@/core/value-objects/slug";
import { ValidationError } from "@/core/errors";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Modern White Gallery")).toBe("modern-white-gallery");
  });

  it("strips accents so Café becomes cafe", () => {
    expect(slugify("Café Noir")).toBe("cafe-noir");
  });

  it("returns null when nothing usable remains", () => {
    expect(slugify("!!!")).toBeNull();
    expect(slugify("あ")).toBeNull();
  });

  it("truncates to 48 characters on a hyphen boundary", () => {
    const long = "a".repeat(60);
    expect(slugify(long)?.length).toBeLessThanOrEqual(48);
  });
});

describe("toSlug", () => {
  it("brands a valid slug", () => {
    const slug = toSlug("atelier-noir");
    expect(slug).toBe("atelier-noir");
  });

  it("rejects reserved paths so /dashboard cannot be claimed", () => {
    expect(isReservedSlug("dashboard")).toBe(true);
    expect(() => toSlug("dashboard")).toThrow(ValidationError);
  });

  it("rejects consecutive hyphens and uppercase", () => {
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("Atelier")).toBe(false);
    expect(() => toSlug("a--b")).toThrow(ValidationError);
  });
});
