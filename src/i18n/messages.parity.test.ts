import { describe, expect, it } from "vitest";

import ar from "./messages/ar.json";
import en from "./messages/en.json";

function flattenKeys(
  value: unknown,
  prefix = "",
): string[] {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return prefix ? [prefix] : [];
  return entries.flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string") return [path];
    if (child != null && typeof child === "object" && !Array.isArray(child)) {
      return flattenKeys(child, path);
    }
    return [path];
  });
}

describe("i18n message dictionaries", () => {
  it("keeps en.json and ar.json key paths in parity", () => {
    const enKeys = flattenKeys(en).sort();
    const arKeys = flattenKeys(ar).sort();
    expect(arKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(400);
  });

  it("uses string leaves only (no nested type drift)", () => {
    for (const [locale, tree] of [
      ["en", en],
      ["ar", ar],
    ] as const) {
      const keys = flattenKeys(tree);
      for (const key of keys) {
        const parts = key.split(".");
        let cursor: unknown = tree;
        for (const part of parts) {
          cursor = (cursor as Record<string, unknown>)[part];
        }
        expect(typeof cursor, `${locale}:${key}`).toBe("string");
        expect(String(cursor).length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });
});
