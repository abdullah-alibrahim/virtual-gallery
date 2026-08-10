import { describe, expect, it } from "vitest";

import { createMoney, formatMoney } from "@/core/value-objects/money";
import { ValidationError } from "@/core/errors";

describe("money", () => {
  it("stores amounts as decimal strings", () => {
    expect(createMoney(4200.5, "EUR")).toEqual({
      amount: "4200.50",
      currency: "EUR",
    });
    expect(createMoney("100", "USD")).toEqual({
      amount: "100",
      currency: "USD",
    });
  });

  it("rejects floats with more than two decimals and bad currencies", () => {
    expect(() => createMoney("10.999", "USD")).toThrow(ValidationError);
    expect(() => createMoney(10, "usd")).toThrow(ValidationError);
    expect(() => createMoney(-1, "USD")).toThrow(ValidationError);
  });

  it("formats for display", () => {
    const formatted = formatMoney(createMoney("1200", "USD"), "en-US");
    expect(formatted).toContain("1,200");
  });
});
