import { describe, expect, it } from "vitest";

import {
  buildEveningInviteUrl,
  formatEveningOpensAt,
  readEveningInviteFromSearch,
  resolveEveningTourAccess,
} from "./evening-tour";

const tour = {
  enabled: true,
  startAt: "2026-08-11T00:00:00.000Z",
  endAt: "2026-08-20T23:59:59.000Z",
  inviteCode: "dusk",
} as const;

describe("resolveEveningTourAccess", () => {
  it("is inactive when disabled", () => {
    expect(
      resolveEveningTourAccess(
        { ...tour, enabled: false },
        new Date("2026-08-12T12:00:00.000Z"),
      ),
    ).toEqual({ status: "inactive" });
  });

  it("opens inside the window", () => {
    const access = resolveEveningTourAccess(
      tour,
      new Date("2026-08-12T12:00:00.000Z"),
    );
    expect(access).toMatchObject({ status: "open", via: "window" });
  });

  it("reports outside before start", () => {
    const access = resolveEveningTourAccess(
      tour,
      new Date("2026-08-01T12:00:00.000Z"),
    );
    expect(access).toMatchObject({ status: "outside" });
  });

  it("opens via invite code outside the window", () => {
    const access = resolveEveningTourAccess(
      tour,
      new Date("2026-08-01T12:00:00.000Z"),
      "DUSK",
    );
    expect(access).toMatchObject({ status: "open", via: "invite" });
  });
});

describe("evening invite helpers", () => {
  it("reads invite from query", () => {
    expect(readEveningInviteFromSearch("?evening=dusk")).toBe("dusk");
    expect(readEveningInviteFromSearch("invite=x&view=list")).toBe("x");
  });

  it("builds invite urls", () => {
    expect(buildEveningInviteUrl("/demo/pro", "dusk")).toBe(
      "/demo/pro?evening=dusk",
    );
  });

  it("formats open time", () => {
    const label = formatEveningOpensAt("2026-08-11T18:00:00.000Z", "en-US");
    expect(label.length).toBeGreaterThan(4);
  });
});
