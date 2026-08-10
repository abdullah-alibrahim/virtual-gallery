import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Architecture regression tests.
 *
 * These assert the invariants ESLint also enforces, but as unit tests that
 * run even if someone disables the plugin. Cheap insurance.
 */

const SRC = path.resolve(__dirname, "..");

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

function importsOf(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const matches = source.matchAll(
    /from\s+["']([^"']+)["']/g,
  );
  return [...matches].map((m) => m[1]!);
}

describe("architecture boundaries", () => {
  const coreFiles = walk(path.join(SRC, "core"));
  const threeFiles = walk(path.join(SRC, "three"));

  it("src/core never imports react, next, firebase, three, or zustand", () => {
    const forbidden = [
      "react",
      "react-dom",
      "next",
      "firebase",
      "firebase-admin",
      "three",
      "@react-three",
      "zustand",
      "@tanstack",
    ];

    for (const file of coreFiles) {
      for (const spec of importsOf(file)) {
        for (const bad of forbidden) {
          expect(
            spec === bad || spec.startsWith(`${bad}/`),
            `${path.relative(SRC, file)} imports ${spec}`,
          ).toBe(false);
        }
      }
    }
  });

  it("src/three never imports firebase or next/navigation", () => {
    for (const file of threeFiles) {
      for (const spec of importsOf(file)) {
        expect(
          !(
            spec.startsWith("firebase") ||
            spec === "next/navigation" ||
            spec === "next/router"
          ),
          `${path.relative(SRC, file)} imports ${spec}`,
        ).toBe(true);
      }
    }
  });

  it("no file outside infrastructure imports firebase", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      if (file.includes(`${path.sep}infrastructure${path.sep}`)) continue;
      for (const spec of importsOf(file)) {
        if (spec === "firebase" || spec.startsWith("firebase/") || spec.startsWith("firebase-admin")) {
          offenders.push(`${path.relative(SRC, file)} → ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
