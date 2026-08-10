import { describe, expect, it } from "vitest";

import { hourBucket, minuteBucket } from "@/lib/rate-limit";

describe("rate-limit buckets", () => {
  it("formats stable hour and minute windows", () => {
    const d = new Date("2026-08-01T12:34:56.000Z");
    expect(hourBucket(d)).toBe("2026-08-01T12");
    expect(minuteBucket(d)).toBe("2026-08-01T12:34");
  });
});
