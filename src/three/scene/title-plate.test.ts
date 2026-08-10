import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("TitlePlate", () => {
  it("keeps drei Text font suspend inside a local Suspense boundary", () => {
    const src = readFileSync(new URL("./title-plate.tsx", import.meta.url), "utf8");
    // Strip block comments so prose mentioning <Text> cannot fool the guard.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).toMatch(/Suspense/);
    expect(code).toMatch(/fallback=\{null\}/);
    expect(code.indexOf("<Suspense")).toBeLessThan(code.indexOf("<Text"));
    expect(code.indexOf("<Text")).toBeGreaterThan(-1);
  });
});
