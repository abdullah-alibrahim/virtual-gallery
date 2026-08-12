import { NextResponse } from "next/server";
import { z } from "zod";

import { ForbiddenError, ValidationError } from "@/core/errors";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { createCheckoutSession } from "@/infrastructure/billing/checkout";

export const runtime = "nodejs";

const bodySchema = z.object({
  plan: z.enum(["pro", "studio"]),
  interval: z.enum(["month", "year"]).optional().default("month"),
});

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
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
    const result = await createCheckoutSession({
      uid: ctx.session.uid,
      workspaceId: ctx.account.defaultWorkspaceId,
      plan: parsed.data.plan,
      interval: parsed.data.interval,
      email: ctx.account.email,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[api/billing/checkout] failed", error);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
