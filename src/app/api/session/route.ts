import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminAuth, getAdminDb } from "@/infrastructure/firebase/admin";
import { bootstrapUserAccount } from "@/infrastructure/firebase/bootstrap-user";
import {
  SESSION_COOKIE_NAME,
  createSessionCookie,
  sessionCookieOptions,
} from "@/infrastructure/firebase/session";
import { acceptPendingInvitesForEmail } from "@/infrastructure/workspaces/team";

export const runtime = "nodejs";

const bodySchema = z.object({
  idToken: z.string().min(1),
});

/**
 * POST /api/session
 *
 * Exchanges a Firebase ID token for an httpOnly session cookie and ensures the
 * user has been bootstrapped (user + workspace + profile + slug + claims).
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(parsed.data.idToken);

    const bootstrap = await bootstrapUserAccount(getAdminDb(), auth, {
      uid: decoded.uid,
      email: decoded.email ?? "",
      displayName: (decoded.name as string | undefined) ?? null,
      photoURL: (decoded.picture as string | undefined) ?? null,
    });

    if (decoded.email) {
      await acceptPendingInvitesForEmail({
        uid: decoded.uid,
        email: decoded.email,
        displayName:
          (decoded.name as string | undefined) ??
          decoded.email.split("@")[0] ??
          "Member",
      }).catch((err) => {
        console.warn("[api/session] invite accept skipped", err);
      });
    }

    // Claims may have just been written — mint the session from a fresh token
    // if the client refreshed; otherwise the cookie still authenticates by uid.
    const sessionCookie = await createSessionCookie(parsed.data.idToken);

    const response = NextResponse.json({
      uid: decoded.uid,
      workspaceId: bootstrap.workspaceId,
      slug: bootstrap.slug,
      created: bootstrap.created,
      onboardingComplete: bootstrap.onboardingComplete,
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionCookie,
      sessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error("[api/session] exchange failed", error);
    return NextResponse.json(
      { error: "Could not create session" },
      { status: 401 },
    );
  }
}

/**
 * DELETE /api/session — clears the cookie. Token revocation is best-effort.
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
