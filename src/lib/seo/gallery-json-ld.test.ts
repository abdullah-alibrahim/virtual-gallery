import { describe, expect, it } from "vitest";

import { buildDemoManifest } from "@/features/viewer/lib/demo-manifest";
import { buildGalleryJsonLd } from "@/lib/seo/gallery-json-ld";

describe("buildGalleryJsonLd", () => {
  it("emits ExhibitionEvent + VisualArtwork graph", () => {
    const manifest = buildDemoManifest("https://example.com");
    const jsonLd = buildGalleryJsonLd(manifest);

    expect(jsonLd["@context"]).toBe("https://schema.org");
    const graph = jsonLd["@graph"] as Array<Record<string, unknown>>;
    expect(graph[0]?.["@type"]).toBe("ExhibitionEvent");
    expect(graph[0]?.name).toBe(manifest.title);
    expect(graph.length).toBe(1 + manifest.artworks.length);
    expect(graph[1]?.["@type"]).toBe("VisualArtwork");
    expect(graph[1]?.name).toBe(manifest.artworks[0]?.title);
  });
});
