import { NextResponse } from "next/server";
import { z } from "zod";

import { ForbiddenError, ValidationError } from "@/core/errors";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import {
  applyMockPlanUpgrade,
  isBillingMockEnabled,
} from "@/infrastructure/billing/mock-upgrade";

export const runtime = "nodejs";

const bodySchema = z.object({
  plan: z.enum(["free", "pro", "studio"]),
});

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (!isBillingMockEnabled()) {
    return NextResponse.json(
      {
        error:
          "Mock billing unavailable. Configure Stripe for production upgrades.",
      },
      { status: 400 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const result = await applyMockPlanUpgrade({
      uid: ctx.session.uid,
      workspaceId: ctx.account.defaultWorkspaceId,
      plan: parsed.data.plan,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[api/billing/mock-upgrade] failed", error);
    return NextResponse.json(
      { error: "Could not apply mock upgrade" },
      { status: 500 },
    );
  }
}
