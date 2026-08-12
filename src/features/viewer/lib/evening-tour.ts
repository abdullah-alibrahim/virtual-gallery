import type { EveningTourSettings } from "@/core/entities";

export type EveningTourAccess =
  | { readonly status: "inactive" }
  | { readonly status: "outside"; readonly startAt: string; readonly endAt: string }
  | {
      readonly status: "open";
      readonly via: "window" | "invite";
      readonly startAt: string;
      readonly endAt: string;
    };

/**
 * Resolve whether the First Evening Tour is available for a visitor.
 * Invite code wins when provided and matches (case-insensitive trim).
 */
export function resolveEveningTourAccess(
  tour: EveningTourSettings | null | undefined,
  now: Date,
  inviteCode?: string | null,
): EveningTourAccess {
  if (!tour?.enabled) return { status: "inactive" };

  const startMs = Date.parse(tour.startAt);
  const endMs = Date.parse(tour.endAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return { status: "inactive" };
  }

  const expected = tour.inviteCode?.trim();
  const provided = inviteCode?.trim();
  if (
    expected &&
    provided &&
    expected.toLowerCase() === provided.toLowerCase()
  ) {
    return {
      status: "open",
      via: "invite",
      startAt: tour.startAt,
      endAt: tour.endAt,
    };
  }

  const t = now.getTime();
  if (t >= startMs && t <= endMs) {
    return {
      status: "open",
      via: "window",
      startAt: tour.startAt,
      endAt: tour.endAt,
    };
  }

  return {
    status: "outside",
    startAt: tour.startAt,
    endAt: tour.endAt,
  };
}

/** Read invite from common query params. */
export function readEveningInviteFromSearch(
  search: string | URLSearchParams,
): string | null {
  const params =
    typeof search === "string"
      ? new URLSearchParams(
          search.startsWith("?") ? search.slice(1) : search,
        )
      : search;
  return (
    params.get("evening") ??
    params.get("invite") ??
    params.get("eveningCode") ??
    null
  );
}

/** Build a shareable evening invite URL. */
export function buildEveningInviteUrl(
  baseUrl: string,
  inviteCode: string,
): string {
  const url = new URL(baseUrl, "http://localhost");
  url.searchParams.set("evening", inviteCode);
  // Prefer relative path + search when base was a path.
  if (!/^https?:\/\//i.test(baseUrl)) {
    return `${url.pathname}${url.search}${url.hash}`;
  }
  return url.toString();
}

/** Format evening open time for museum-tone copy (locale-aware). */
export function formatEveningOpensAt(
  iso: string,
  locale: string,
): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
