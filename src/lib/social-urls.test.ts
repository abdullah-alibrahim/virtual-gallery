import { describe, expect, it } from "vitest";

import { resolveArtistSocialLinks } from "@/lib/social-urls";

describe("resolveArtistSocialLinks", () => {
  it("prefers artist website over gallery website", () => {
    const links = resolveArtistSocialLinks(
      { website: "https://artist.example", instagram: "studio" },
      { galleryWebsite: "https://gallery.example" },
    );
    expect(links.find((l) => l.kind === "website")?.href).toBe(
      "https://artist.example",
    );
    expect(links.find((l) => l.kind === "instagram")?.href).toBe(
      "https://instagram.com/studio",
    );
  });

  it("falls back to gallery website when artist has none", () => {
    const links = resolveArtistSocialLinks(
      { twitter: "@hall" },
      { galleryWebsite: "https://show.example" },
    );
    expect(links.find((l) => l.kind === "website")?.href).toBe(
      "https://show.example",
    );
    expect(links.find((l) => l.kind === "twitter")?.href).toBe(
      "https://x.com/hall",
    );
  });

  it("maps a Facebook URL to the facebook kind", () => {
    const links = resolveArtistSocialLinks({
      website: "https://www.facebook.com/ismail.rifai.3",
    });
    expect(links.find((l) => l.kind === "facebook")?.href).toBe(
      "https://www.facebook.com/ismail.rifai.3",
    );
    expect(links.find((l) => l.kind === "website")).toBeUndefined();
  });

  it("uses a first-class facebook field without dropping website", () => {
    const links = resolveArtistSocialLinks({
      facebook: "https://www.facebook.com/ismail.rifai.3",
      website: "https://ismailrifai.example",
    });
    expect(links.find((l) => l.kind === "facebook")?.href).toBe(
      "https://www.facebook.com/ismail.rifai.3",
    );
    expect(links.find((l) => l.kind === "website")?.href).toBe(
      "https://ismailrifai.example",
    );
  });
});
