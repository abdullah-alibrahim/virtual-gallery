import { describe, expect, it } from "vitest";

import {
  ISMAIL_BOAT_WORKS,
  ISMAIL_HALL_WORKS,
} from "@/core/samples/ismail-rifai";

import {
  buildIsmailBoatsManifest,
  buildIsmailRifaiManifest,
} from "./ismail-rifai-manifest";

describe("buildIsmailRifaiManifest", () => {
  it("hangs The Hall on Mega Wing with every section", () => {
    const manifest = buildIsmailRifaiManifest();
    expect(manifest.template.id).toBe("mega-wing");
    expect(manifest.title).toBe("The Hall");
    expect(manifest.artworks).toHaveLength(
      ISMAIL_HALL_WORKS.length + ISMAIL_BOAT_WORKS.length,
    );
    expect(manifest.artist.slug).toBe("ismail-rifai");
    expect(manifest.artist.socials?.facebook).toContain("facebook.com/ismail.rifai.3");
    const signBlob = (manifest.template.architecture?.signs ?? [])
      .map((s) => `${s.text} ${s.subtitle ?? ""}`)
      .join("\n");
    expect(signBlob).toMatch(/طرق/);
    expect(signBlob).toMatch(/أشكال/);
    expect(signBlob).toMatch(/مراكب/);
    expect(signBlob).toMatch(/شامسي/);
    expect(signBlob).toMatch(/Roads/i);
    expect(signBlob).toMatch(/Marakeb/i);

    const eastWall = manifest.template.walls.find((w) => w.id === "east-wing-east");
    const westWall = manifest.template.walls.find((w) => w.id === "west-wing-west");
    expect(eastWall).toBeTruthy();
    expect(westWall).toBeTruthy();
    const eastArt = manifest.artworks.filter(
      (a) => a.placement.position[0] > 12 && Math.abs(a.placement.position[2]) < 6,
    );
    const westArt = manifest.artworks.filter(
      (a) => a.placement.position[0] < -12 && Math.abs(a.placement.position[2]) < 6,
    );
    expect(eastArt.length).toBeGreaterThan(0);
    expect(westArt.length).toBeGreaterThan(0);
    expect(
      eastArt.every((a) => a.placement.position[0] < eastWall!.origin[0]),
    ).toBe(true);
    expect(
      westArt.every((a) => a.placement.position[0] > westWall!.origin[0]),
    ).toBe(true);
    expect(
      manifest.artworks.some((a) => /shamsi|tree/i.test(a.title + a.category)),
    ).toBe(true);
    expect(manifest.artworks.every((a) => a.textures.lod0.startsWith("/artists/ismail-rifai/"))).toBe(
      true,
    );
  });
});

describe("buildIsmailBoatsManifest", () => {
  it("hangs the Marakeb series on Noir Salon", () => {
    const manifest = buildIsmailBoatsManifest();
    expect(manifest.template.id).toBe("noir-salon");
    expect(manifest.title).toBe("Marakeb");
    expect(manifest.artworks).toHaveLength(ISMAIL_BOAT_WORKS.length);
    expect(manifest.artworks.every((a) => a.category === "Marakeb")).toBe(true);
    expect(
      manifest.artworks.every(
        (a) => Boolean(a.price) || a.availability === "priceOnRequest",
      ),
    ).toBe(true);
  });
});
