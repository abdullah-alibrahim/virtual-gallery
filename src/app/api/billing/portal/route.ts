import { NextResponse } from "next/server";

import { ForbiddenError, ValidationError } from "@/core/errors";
import { createBillingPortalSession } from "@/infrastructure/billing/checkout";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";

export const runtime = "nodejs";

export async function POST() {
  const ctx = await getAuthContext();
  if (!ctx?.account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const result = await createBillingPortalSession({
      uid: ctx.session.uid,
      workspaceId: ctx.account.defaultWorkspaceId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[api/billing/portal] failed", error);
    return NextResponse.json({ error: "Could not open portal" }, { status: 500 });
  }
}
