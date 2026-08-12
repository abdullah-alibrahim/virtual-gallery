import { describe, expect, it } from "vitest";

import {
  TEMPLATE_CATALOGUE,
  getTemplateById,
  getTemplateSwatches,
  modernWhiteTemplate,
} from "@/core/templates";
import { isInsidePolygon } from "@/three/math/geometry";
import { findEnclosureGaps } from "@/three/math/wall-enclosure";
import { buildDemoManifest } from "@/features/viewer/lib/demo-manifest";
import { buildHarborDemoManifest } from "@/features/viewer/lib/harbor-demo-manifest";
import { buildProDemoManifest } from "@/features/viewer/lib/pro-demo-manifest";

describe("template catalogue", () => {
  it("ships active templates including legacy IDs and new rooms", () => {
    expect(TEMPLATE_CATALOGUE.map((t) => t.id).sort()).toEqual([
      "black-gallery",
      "brutalist-hall",
      "coastal-pavilion",
      "concrete-loft",
      "courtyard-atrium",
      "courtyard-ring",
      "daylight-atrium",
      "daylight-museum",
      "edition-hall",
      "enfilade",
      "grand-nave",
      "hall-antechamber",
      "harbor-pavilion",
      "industrial",
      "l-wing-atelier",
      "long-corridor",
      "luxury",
      "maison-salon",
      "mega-wing",
      "minimal",
      "modern-white",
      "night-cube",
      "noir-salon",
      "plaza-hall",
      "soft-museum",
      "timber-salon",
      "twin-suite",
      "wing-suite",
      "zen-court",
    ]);
    expect(getTemplateById("modern-white")?.tier).toBe("free");
    expect(getTemplateById("soft-museum")?.tier).toBe("free");
    expect(getTemplateById("daylight-museum")?.tier).toBe("free");
    expect(getTemplateById("edition-hall")?.tier).toBe("free");
    expect(getTemplateById("maison-salon")?.tier).toBe("free");
    expect(getTemplateById("harbor-pavilion")?.tier).toBe("free");
    expect(getTemplateById("grand-nave")?.tier).toBe("free");
    expect(getTemplateById("plaza-hall")?.tier).toBe("free");
    expect(getTemplateById("mega-wing")?.tier).toBe("pro");
    expect(getTemplateById("noir-salon")?.tier).toBe("pro");
    expect(getTemplateById("courtyard-atrium")?.tier).toBe("pro");
    expect(getTemplateById("concrete-loft")?.tier).toBe("free");
    expect(getTemplateById("daylight-atrium")?.tier).toBe("free");
    expect(getTemplateById("coastal-pavilion")?.tier).toBe("free");
    expect(getTemplateById("timber-salon")?.tier).toBe("free");
    expect(getTemplateById("l-wing-atelier")?.tier).toBe("free");
    expect(getTemplateById("long-corridor")?.tier).toBe("free");
    expect(getTemplateById("hall-antechamber")?.tier).toBe("free");
    expect(getTemplateById("twin-suite")?.tier).toBe("free");
    expect(getTemplateById("minimal")?.tier).toBe("free");
    expect(getTemplateById("luxury")?.tier).toBe("pro");
    expect(getTemplateById("industrial")?.tier).toBe("pro");
    expect(getTemplateById("night-cube")?.tier).toBe("pro");
    expect(getTemplateById("brutalist-hall")?.tier).toBe("pro");
    expect(getTemplateById("zen-court")?.tier).toBe("pro");
    expect(getTemplateById("courtyard-ring")?.tier).toBe("pro");
    expect(getTemplateById("enfilade")?.tier).toBe("pro");
    expect(getTemplateById("wing-suite")?.tier).toBe("pro");
    expect(getTemplateById("black-gallery")?.status).toBe("active");
    expect(getTemplateById("l-wing-atelier")?.walls.length).toBeGreaterThan(4);
    expect(getTemplateById("courtyard-ring")?.walls.length).toBeGreaterThan(4);
    expect(getTemplateById("courtyard-atrium")?.walls.length).toBeGreaterThan(4);
    expect(getTemplateById("hall-antechamber")?.walls.length).toBeGreaterThan(4);
    expect(getTemplateById("twin-suite")?.walls.length).toBeGreaterThan(4);
    expect(getTemplateById("enfilade")?.walls.length).toBeGreaterThan(4);
    expect(getTemplateById("wing-suite")?.walls.length).toBeGreaterThan(4);
    expect(getTemplateById("grand-nave")?.walls.length).toBeGreaterThan(4);
    expect(getTemplateById("plaza-hall")?.walls.length).toBeGreaterThan(4);
    expect(getTemplateById("mega-wing")?.walls.length).toBeGreaterThan(4);
  });

  it("declares walkBounds, hangable anchors, and surface materials", () => {
    expect(modernWhiteTemplate.walkBounds.length).toBeGreaterThanOrEqual(3);
    const anchors = modernWhiteTemplate.walls.flatMap((w) => w.anchors);
    expect(anchors.length).toBeGreaterThanOrEqual(5);
    expect(anchors.some((a) => a.preferred)).toBe(true);
    for (const template of TEMPLATE_CATALOGUE) {
      expect(template.materials.wall).toMatch(/^#/);
      expect(template.materials.floor).toMatch(/^#/);
      expect(template.materials.floor).not.toBe(template.environment.background);
      const swatches = getTemplateSwatches(template);
      expect(swatches.wall).toBe(template.materials.wall);
      expect(swatches.floor).toBe(template.materials.floor);
    }
    expect(modernWhiteTemplate.materials.floorStyle).toBe("plank");
    expect(getTemplateById("soft-museum")?.materials.floorStyle).toBe("parquet");
    expect(getTemplateById("daylight-museum")?.materials.floorStyle).toBe("stone");
    expect(getTemplateById("daylight-museum")?.materials.wallBand).toBeTruthy();
    expect(getTemplateById("daylight-museum")?.architecture?.skylight).toBeTruthy();
    expect(getTemplateById("concrete-loft")?.materials.floorStyle).toBe("plank");
    expect(getTemplateById("minimal")?.materials.floorStyle).toBe("stone");
    expect(getTemplateById("daylight-atrium")?.materials.floorStyle).toBe("stone");
    expect(getTemplateById("industrial")?.materials.floorStyle).toBe("concrete");
    for (const template of TEMPLATE_CATALOGUE) {
      expect(template.materials.floorStyle).toBeTruthy();
      expect(template.lighting.rim ?? template.lighting.fill).toBeTruthy();
    }
  });

  it("maison salon is a dressed haute hall with west arched light", () => {
    const hall = getTemplateById("maison-salon")!;
    const [sx, , sz] = hall.spawn.position;
    expect(isInsidePolygon([sx, sz], hall.walkBounds)).toBe(true);
    expect(hall.category).toBe("luxury");
    expect(hall.architecture?.window?.wallId).toBe("west");
    expect(hall.architecture?.window?.arched).toBe(true);
    expect(hall.architecture?.skylight).toBeTruthy();
    expect(hall.architecture?.glbProps?.length).toBeGreaterThanOrEqual(8);
    expect(hall.architecture?.benches?.every((b) => b.glb)).toBe(true);
    expect(hall.materials.floorStyle).toBe("stone");
    expect(hall.frameDefaults.style).toBe("ornate");
  });

  it("daylight museum hall keeps spawn inside walkBounds and window on west", () => {
    const hall = getTemplateById("daylight-museum")!;
    const [sx, , sz] = hall.spawn.position;
    expect(isInsidePolygon([sx, sz], hall.walkBounds)).toBe(true);
    expect(hall.architecture?.window?.wallId).toBe("west");
    expect(hall.architecture?.plinths?.length).toBeGreaterThanOrEqual(2);
    expect(hall.walls.every((w) => w.height >= 4.8)).toBe(true);
  });

  it("huge halls declare beams, track lights, benches, and multi-volume walk", () => {
    const nave = getTemplateById("grand-nave")!;
    expect(nave.architecture?.beams?.count).toBeGreaterThanOrEqual(8);
    expect(nave.architecture?.trackLights?.count).toBeGreaterThanOrEqual(2);
    expect(nave.architecture?.benches?.length).toBeGreaterThanOrEqual(2);
    expect(nave.architecture?.benches?.every((b) => b.glb)).toBe(true);
    expect(nave.architecture?.glbProps?.length).toBeGreaterThanOrEqual(4);
    expect(nave.materials.floorStyle).toBe("plank");
    expect(Math.max(...nave.walls.map((w) => w.height))).toBeGreaterThanOrEqual(5.4);
    const [nsx, , nsz] = nave.spawn.position;
    expect(isInsidePolygon([nsx, nsz], nave.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, -14], nave.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, 0], nave.walkBounds)).toBe(true);

    const plaza = getTemplateById("plaza-hall")!;
    expect(plaza.architecture?.beams).toBeTruthy();
    expect(plaza.architecture?.trackLights).toBeTruthy();
    expect(plaza.architecture?.benches?.length).toBeGreaterThanOrEqual(2);
    expect(plaza.architecture?.benches?.every((b) => b.glb)).toBe(true);
    expect(plaza.architecture?.glbProps?.length).toBeGreaterThanOrEqual(4);
    expect(isInsidePolygon([0, 0], plaza.walkBounds)).toBe(true);
    expect(isInsidePolygon([14, 0], plaza.walkBounds)).toBe(true);
    expect(isInsidePolygon([14, 4], plaza.walkBounds)).toBe(false);

    const mega = getTemplateById("mega-wing")!;
    expect(mega.tier).toBe("pro");
    expect(mega.architecture?.skylight).toBeTruthy();
    expect(mega.architecture?.skylight!.width).toBeGreaterThanOrEqual(5);
    expect(mega.architecture?.window?.wallId).toBe("nave-west-north");
    expect(mega.architecture?.window?.arched).toBe(true);
    expect(mega.materials.floorStyle).toBe("stone");
    expect(mega.materials.wallBand).toBeTruthy();
    expect(mega.architecture?.beams?.count).toBeGreaterThanOrEqual(10);
    expect(mega.architecture?.trackLights?.maxLive ?? 8).toBeGreaterThanOrEqual(6);
    expect(mega.architecture?.trackLights?.intensity ?? 1).toBeLessThanOrEqual(0.5);
    expect(mega.architecture?.benches?.length).toBeGreaterThanOrEqual(3);
    expect(mega.architecture?.benches?.every((b) => b.glb)).toBe(true);
    expect(mega.architecture?.glbProps?.length).toBeGreaterThanOrEqual(4);
    const bust = mega.architecture?.glbProps?.find((p) => p.model === "bust");
    expect(bust).toBeTruthy();
    // Bust must sit on a floor plinth, not mid-wall / wall plane.
    expect(bust!.position[1]).toBeGreaterThanOrEqual(0.7);
    expect(Math.abs(bust!.position[2])).toBeLessThan(10.5);
    // Near the west morning window so it catches directional light.
    expect(bust!.position[0]).toBeLessThan(-4);
    expect(
      mega.architecture?.plinths?.some(
        (p) =>
          Math.abs(p.position[0] - bust!.position[0]) < 0.05 &&
          Math.abs(p.position[2] - bust!.position[2]) < 0.05,
      ),
    ).toBe(true);
    expect(isInsidePolygon([0, 0], mega.walkBounds)).toBe(true);
    expect(isInsidePolygon([13, 0], mega.walkBounds)).toBe(true);
    expect(isInsidePolygon([-13, 0], mega.walkBounds)).toBe(true);
    // Wing rooms are walkable so visitors can approach side-wall hangs.
    expect(isInsidePolygon([13, 4], mega.walkBounds)).toBe(true);
    expect(isInsidePolygon([13, 5.2], mega.walkBounds)).toBe(true);
    expect(isInsidePolygon([-13, -4], mega.walkBounds)).toBe(true);
    // Solid nave side walls (outside the opening) stay blocked.
    expect(isInsidePolygon([9.5, 4], mega.walkBounds)).toBe(true);
    expect(isInsidePolygon([8.7, 4], mega.walkBounds)).toBe(false);
    expect(isInsidePolygon([13, 6], mega.walkBounds)).toBe(false);
    expect(mega.architecture?.signs?.length).toBeGreaterThanOrEqual(1);
    expect(mega.architecture?.signs?.[0]?.text.toLowerCase()).toContain("mega");
    const plants = mega.architecture?.glbProps?.filter((p) => p.model === "plant") ?? [];
    expect(plants.length).toBeGreaterThanOrEqual(4);
    expect(plants.every((p) => (p.scale ?? 1) <= 1.6)).toBe(true);
    expect(mega.capacity.max).toBeGreaterThanOrEqual(40);
  });

  it("daylight museum ships CC0 glb props and a gallery bench", () => {
    const hall = getTemplateById("daylight-museum")!;
    expect(hall.architecture?.benches?.some((b) => b.glb)).toBe(true);
    expect(hall.architecture?.glbProps?.some((p) => p.model === "bust")).toBe(
      true,
    );
    expect(hall.architecture?.glbProps?.some((p) => p.model === "plant")).toBe(
      true,
    );
  });

  it("new flagship halls ship museum craft (stone, band, light, props, signs)", () => {
    const harbor = getTemplateById("harbor-pavilion")!;
    expect(harbor.materials.floorStyle).toBe("stone");
    expect(harbor.materials.wallBand).toBeTruthy();
    expect(harbor.architecture?.skylight).toBeTruthy();
    expect(harbor.architecture?.window?.wallId).toBe("west");
    expect(harbor.architecture?.window?.arched).toBe(true);
    expect(harbor.architecture?.signs?.length).toBeGreaterThanOrEqual(1);
    expect(harbor.architecture?.benches?.every((b) => b.glb)).toBe(true);
    const harborPlants =
      harbor.architecture?.glbProps?.filter((p) => p.model === "plant") ?? [];
    expect(harborPlants.every((p) => (p.scale ?? 1) <= 1.55)).toBe(true);
    const [hsx, , hsz] = harbor.spawn.position;
    expect(isInsidePolygon([hsx, hsz], harbor.walkBounds)).toBe(true);

    const noir = getTemplateById("noir-salon")!;
    expect(noir.materials.floorStyle).toBe("stone");
    expect(noir.materials.wallBand).toBeTruthy();
    expect(noir.materials.trim.toLowerCase()).toMatch(/#b8|#c4|#a8|#9/);
    expect(noir.architecture?.trackLights?.railColor).toBeTruthy();
    expect(noir.architecture?.trackLights?.intensity ?? 1).toBeLessThanOrEqual(0.7);
    expect(noir.architecture?.signs?.some((s) => /noir/i.test(s.text))).toBe(
      true,
    );
    expect(noir.environment.background).toMatch(/^#0/);
    const [nsx, , nsz] = noir.spawn.position;
    expect(isInsidePolygon([nsx, nsz], noir.walkBounds)).toBe(true);

    const court = getTemplateById("courtyard-atrium")!;
    expect(court.architecture?.skylight!.width).toBeGreaterThanOrEqual(6);
    expect(court.architecture?.window?.wallId).toBe("court-west");
    expect(court.walls.length).toBeGreaterThan(4);
    expect(isInsidePolygon([0, -4], court.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, 5], court.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, 0.5], court.walkBounds)).toBe(true);
    // Outside the partition opening should be blocked.
    expect(isInsidePolygon([5, 0.5], court.walkBounds)).toBe(false);
    const courtPlants =
      court.architecture?.glbProps?.filter((p) => p.model === "plant") ?? [];
    expect(courtPlants.length).toBeGreaterThanOrEqual(4);
    expect(courtPlants.every((p) => (p.scale ?? 1) <= 1.55)).toBe(true);
    expect(court.architecture?.signs?.length).toBeGreaterThanOrEqual(1);

    const edition = getTemplateById("edition-hall")!;
    expect(edition.materials.floorStyle).toBe("stone");
    expect(edition.materials.wallBand).toBeTruthy();
    // Picture rail sits high on the wall.
    expect(edition.materials.wallBandBottomM ?? 0).toBeGreaterThanOrEqual(2.4);
    expect(edition.architecture?.skylight).toBeTruthy();
    expect(edition.architecture?.trackLights).toBeTruthy();
    const north = edition.walls.find((w) => w.id === "north")!;
    expect(north.anchors.length).toBe(4);
    // Even hang rhythm — equal X spacing between consecutive anchors.
    const xs = north.anchors.map((a) => a.position[0]);
    const gaps = xs.slice(1).map((x, i) => x - xs[i]!);
    expect(gaps.every((g) => Math.abs(g - gaps[0]!) < 0.05)).toBe(true);
    expect(edition.architecture?.signs?.some((s) => /edition/i.test(s.text))).toBe(
      true,
    );
  });

  it("Modern White ships CC0 props for the free walk demo", () => {
    const white = getTemplateById("modern-white");
    expect(white?.architecture?.benches?.some((b) => b.glb)).toBe(true);
    expect(white?.architecture?.glbProps?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps preferred only when true (Firestore-safe anchors)", () => {
    for (const template of TEMPLATE_CATALOGUE) {
      for (const wall of template.walls) {
        for (const anchor of wall.anchors) {
          if ("preferred" in anchor) {
            expect(anchor.preferred).toBe(true);
          }
        }
      }
    }
  });

  it("multi-room suites connect volumes through door openings", () => {
    const suites = [
      "hall-antechamber",
      "twin-suite",
      "enfilade",
      "wing-suite",
    ] as const;

    for (const id of suites) {
      const template = getTemplateById(id);
      expect(template).toBeTruthy();
      expect(template!.walkBounds.length).toBeGreaterThan(4);
      expect(template!.walls.length).toBeGreaterThan(4);

      const [sx, , sz] = template!.spawn.position;
      expect(isInsidePolygon([sx, sz], template!.walkBounds)).toBe(true);

      // Spawn faces into the suite (yaw ≈ π looks toward −Z for these plans).
      expect(Math.abs(template!.spawn.yaw)).toBeGreaterThan(1);
    }

    // Hall antechamber: spawn in ante, can reach hall centre.
    const hall = getTemplateById("hall-antechamber")!;
    expect(isInsidePolygon([0, 5.2], hall.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, -2], hall.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, 2.5], hall.walkBounds)).toBe(true);
    // Outside the door gap along the partition should be blocked.
    expect(isInsidePolygon([3.2, 2.5], hall.walkBounds)).toBe(false);

    // Twin suite: both rooms + opening walkable.
    const twin = getTemplateById("twin-suite")!;
    expect(isInsidePolygon([-4, 0], twin.walkBounds)).toBe(true);
    expect(isInsidePolygon([4, 0], twin.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, 0], twin.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, 3], twin.walkBounds)).toBe(false);

    // Enfilade: three rooms along Z.
    const enf = getTemplateById("enfilade")!;
    expect(isInsidePolygon([0, 6], enf.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, 0], enf.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, -6], enf.walkBounds)).toBe(true);
    expect(isInsidePolygon([0, 3.5], enf.walkBounds)).toBe(true);

    // Wing suite: main + passage + wing.
    const wing = getTemplateById("wing-suite")!;
    expect(isInsidePolygon([0, 0], wing.walkBounds)).toBe(true);
    expect(isInsidePolygon([6, 0], wing.walkBounds)).toBe(true);
    expect(isInsidePolygon([10, 0], wing.walkBounds)).toBe(true);
    expect(isInsidePolygon([6, 2.5], wing.walkBounds)).toBe(false);
  });

  it("keeps every template visually enclosed (no white-void sightlines)", () => {
    for (const template of TEMPLATE_CATALOGUE) {
      const gaps = findEnclosureGaps(template);
      expect(gaps, template.id).toEqual([]);
    }
  });

  it("courtyard ring excludes the open centre from walkBounds", () => {
    const court = getTemplateById("courtyard-ring")!;
    expect(isInsidePolygon([0, 0], court.walkBounds)).toBe(false);
    expect(isInsidePolygon([0, 4.5], court.walkBounds)).toBe(true);
    expect(isInsidePolygon([5, 0], court.walkBounds)).toBe(true);
  });

  it("l-wing atelier is a closed L with hang space in both arms", () => {
    const wing = getTemplateById("l-wing-atelier")!;
    expect(isInsidePolygon([-2, -2], wing.walkBounds)).toBe(true);
    expect(isInsidePolygon([3, 2], wing.walkBounds)).toBe(true);
    expect(isInsidePolygon([-2, 2], wing.walkBounds)).toBe(false);
    const [sx, , sz] = wing.spawn.position;
    expect(isInsidePolygon([sx, sz], wing.walkBounds)).toBe(true);
  });
});

describe("demo SceneManifest", () => {
  it("hangs a full Modern White exhibition for the walkthrough demo", () => {
    const manifest = buildDemoManifest("http://localhost:3000");
    expect(manifest.template.id).toBe("modern-white");
    expect(manifest.artworks.length).toBeGreaterThanOrEqual(8);
    expect(manifest.artworks.every((a) => a.textures.lod0.includes("/demo/"))).toBe(
      true,
    );
    expect(
      manifest.artworks.every(
        (a) => a.dimensions.width >= 110 && a.dimensions.height >= 110,
      ),
    ).toBe(true);
    expect(manifest.settings.walkSpeed).toBeGreaterThan(0);
  });
});

describe("pro demo SceneManifest", () => {
  it("hangs a filled Mega Wing exhibition for the public Pro walk", () => {
    const manifest = buildProDemoManifest("http://localhost:3000");
    expect(manifest.template.id).toBe("mega-wing");
    expect(manifest.template.tier).toBe("pro");
    expect(manifest.artworks.length).toBeGreaterThanOrEqual(20);
    expect(manifest.artworks.every((a) => a.textures.lod0.includes("/demo/"))).toBe(
      true,
    );
    expect(manifest.settings.walkSpeed).toBeGreaterThan(0);
    expect(manifest.slug).toBe("mega-wing-pro-demo");
  });
});

describe("harbor demo SceneManifest", () => {
  it("hangs a filled Harbor Pavilion exhibition for the public coastal walk", () => {
    const manifest = buildHarborDemoManifest("http://localhost:3000");
    expect(manifest.template.id).toBe("harbor-pavilion");
    expect(manifest.template.tier).toBe("free");
    expect(manifest.artworks.length).toBeGreaterThanOrEqual(10);
    expect(manifest.artworks.every((a) => a.textures.lod0.includes("/demo/"))).toBe(
      true,
    );
    expect(manifest.settings.walkSpeed).toBeGreaterThan(0);
    expect(manifest.slug).toBe("harbor-pavilion-demo");
  });
});
