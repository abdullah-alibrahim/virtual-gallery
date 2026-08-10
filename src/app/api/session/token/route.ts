import { NextResponse } from "next/server";

import { getAdminAuth } from "@/infrastructure/firebase/admin";
import { getSession } from "@/infrastructure/firebase/session";

export const runtime = "nodejs";

/**
 * Mints a Firebase custom token so the browser Auth SDK can call Storage /
 * Firestore with the same uid (and refreshed custom claims) as the httpOnly
 * session cookie. Needed after a hard refresh when IndexedDB auth is cold.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const token = await getAdminAuth().createCustomToken(session.uid, {
      workspaces: session.workspaces,
      platformAdmin: session.platformAdmin,
    });
    return NextResponse.json({ token });
  } catch (error) {
    console.error("[api/session/token] failed", error);
    return NextResponse.json(
      { error: "Could not mint client token" },
      { status: 500 },
    );
  }
}
