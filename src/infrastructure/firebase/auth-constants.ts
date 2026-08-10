/** Shared auth constants safe for Edge middleware and Node runtimes. */

export const SESSION_COOKIE_NAME = "vg_session";

/** Canonical sign-in URL — force=1 avoids stale-cookie middleware bounce loops. */
export const SIGN_IN_HREF = "/sign-in?force=1";

/** 14 days — matches the architecture's rolling session. */
export const SESSION_EXPIRES_MS = 60 * 60 * 24 * 14 * 1000;
