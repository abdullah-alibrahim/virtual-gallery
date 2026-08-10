/**
 * Auth session cookie helpers.
 *
 * Flow: client signs in with Firebase Auth → POSTs the ID token here → we mint
 * a Firebase session cookie (httpOnly) so Server Components and middleware can
 * authenticate without trusting the client.
 */

import { cookies } from "next/headers";

import { getAdminAuth } from "./admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRES_MS,
} from "./auth-constants";

export { SESSION_COOKIE_NAME, SESSION_EXPIRES_MS };

export interface SessionUser {
  readonly uid: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly name: string | null;
  readonly picture: string | null;
  readonly workspaces: Readonly<Record<string, string>>;
  /** Platform ops flag from Auth custom claims (not workspace role). */
  readonly platformAdmin: boolean;
}

export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_MS,
  });
}

export async function revokeUserSessions(uid: string): Promise<void> {
  await getAdminAuth().revokeRefreshTokens(uid);
}

/**
 * Verifies the session cookie. Returns null when missing or invalid — never
 * throws for an absent cookie, so layouts can branch cleanly.
 */
export async function verifySessionCookie(
  sessionCookie: string | undefined,
): Promise<SessionUser | null> {
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );
    const workspaces =
      (decoded.workspaces as Record<string, string> | undefined) ?? {};

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      emailVerified: Boolean(decoded.email_verified),
      name: (decoded.name as string | undefined) ?? null,
      picture: (decoded.picture as string | undefined) ?? null,
      workspaces,
      platformAdmin: Boolean(decoded.platformAdmin),
    };
  } catch {
    return null;
  }
}

/** Reads and verifies the session from the incoming request cookies. */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySessionCookie(jar.get(SESSION_COOKIE_NAME)?.value);
}

export function sessionCookieOptions(maxAgeMs = SESSION_EXPIRES_MS) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}
