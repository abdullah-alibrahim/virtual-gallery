import { ValidationError } from "@/core/errors";

/**
 * Money is stored as a decimal string of the major unit, not as a float. JSON
 * and JavaScript both lose precision on IEEE floats; a price of €4,200.50 must
 * survive a round-trip through Firestore and the CDN manifest unchanged.
 *
 * We deliberately do not use a money library for the MVP — we only store and
 * display amounts. Arithmetic (tax, discounts) is out of scope until
 * marketplace lands.
 */
export interface Money {
  readonly amount: string;
  readonly currency: string;
}

const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export function createMoney(amount: number | string, currency: string): Money {
  const amountString =
    typeof amount === "number" ? formatAmount(amount) : amount.trim();

  if (!AMOUNT_PATTERN.test(amountString)) {
    throw new ValidationError(
      "Price must be a non-negative number with at most two decimal places",
      { amount },
    );
  }
  if (!CURRENCY_PATTERN.test(currency)) {
    throw new ValidationError("Currency must be a three-letter ISO code", {
      currency,
    });
  }

  return { amount: amountString, currency };
}

function formatAmount(n: number): string {
  if (!Number.isFinite(n) || n < 0) {
    throw new ValidationError("Price must be a non-negative finite number", {
      amount: n,
    });
  }
  // Keep trailing zeros out of whole numbers: 100 → "100", 100.5 → "100.50"
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Display helper. Locale formatting is intentionally left to the UI layer —
 * the domain only guarantees a parseable amount and a currency code.
 */
export function formatMoney(
  money: Money,
  locale = "en-US",
): string {
  const value = Number(money.amount);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: money.currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Unknown currency codes fall back rather than crashing the page.
    return `${money.currency} ${money.amount}`;
  }
}
