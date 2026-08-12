import { describe, expect, it } from "vitest";

import {
  cnameTargetFromSiteUrl,
  isPrimarySiteHost,
  isValidCustomHostname,
  normalizeHostname,
} from "@/core/services/custom-hostname";

describe("custom-hostname", () => {
  it("strips protocol, path, and port", () => {
    expect(normalizeHostname("https://Gallery.Studio.com/show")).toBe(
      "gallery.studio.com",
    );
    expect(normalizeHostname("www.artist.com:443")).toBe("www.artist.com");
  });

  it("rejects invalid or reserved hosts", () => {
    expect(isValidCustomHostname("gallery.studio.com")).toBe(true);
    expect(isValidCustomHostname("not a host")).toBe(false);
    expect(isValidCustomHostname("localhost")).toBe(false);
  });

  it("reads the CNAME target from the site URL", () => {
    expect(cnameTargetFromSiteUrl("https://virtual-gallery-zeta.vercel.app")).toBe(
      "virtual-gallery-zeta.vercel.app",
    );
    expect(
      isPrimarySiteHost(
        "virtual-gallery-zeta.vercel.app",
        "https://virtual-gallery-zeta.vercel.app",
      ),
    ).toBe(true);
  });
});
