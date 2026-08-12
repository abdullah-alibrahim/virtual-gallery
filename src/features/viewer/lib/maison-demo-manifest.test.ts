import { describe, expect, it } from "vitest";

import { buildMaisonDemoManifest } from "./maison-demo-manifest";

describe("buildMaisonDemoManifest", () => {
  it("hangs works in the maison salon shell", () => {
    const en = buildMaisonDemoManifest("http://localhost:3000", "en");
    expect(en.template.id).toBe("maison-salon");
    expect(en.artworks.length).toBeGreaterThanOrEqual(8);
    expect(en.title).toBe("Maison Salon");

    const ar = buildMaisonDemoManifest("http://localhost:3000", "ar");
    expect(ar.title).toBe("صالة الميزون");
    expect(ar.template.architecture?.signs?.[0]?.text).toContain("الميزون");
  });
});
