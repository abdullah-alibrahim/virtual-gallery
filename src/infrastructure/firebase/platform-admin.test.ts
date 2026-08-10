import { afterEach, describe, expect, it } from "vitest";

import {
  isEmailPlatformAdmin,
  isPlatformAdmin,
  parseAdminEmails,
} from "./platform-admin";

describe("platform admin helpers", () => {
  const previous = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (previous === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previous;
  });

  it("parses allowlist", () => {
    process.env.ADMIN_EMAILS = " admin@virtualgallery.dev, Ops@Example.com ";
    expect(parseAdminEmails()).toEqual([
      "admin@virtualgallery.dev",
      "ops@example.com",
    ]);
  });

  it("matches allowlisted emails", () => {
    process.env.ADMIN_EMAILS = "admin@virtualgallery.dev";
    expect(isEmailPlatformAdmin("Admin@VirtualGallery.dev")).toBe(true);
    expect(isEmailPlatformAdmin("demo@virtualgallery.dev")).toBe(false);
  });

  it("accepts claim or allowlist", () => {
    process.env.ADMIN_EMAILS = "allow@example.com";
    expect(
      isPlatformAdmin({ email: "x@y.com", platformAdmin: true }),
    ).toBe(true);
    expect(
      isPlatformAdmin({ email: "allow@example.com", platformAdmin: false }),
    ).toBe(true);
    expect(
      isPlatformAdmin({ email: "x@y.com", platformAdmin: false }),
    ).toBe(false);
  });
});
