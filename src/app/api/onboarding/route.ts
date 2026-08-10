import { NextResponse } from "next/server";
import { z } from "zod";

import { ConflictError, ValidationError } from "@/core/errors";
import { completeOnboarding } from "@/infrastructure/firebase/complete-onboarding";
import { getSession } from "@/infrastructure/firebase/session";

export const runtime = "nodejs";

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(3).max(48),
  bio: z.string().trim().max(500).optional().default(""),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile details" }, { status: 400 });
  }

  try {
    const result = await completeOnboarding({
      uid: session.uid,
      displayName: parsed.data.displayName,
      slug: parsed.data.slug,
      bio: parsed.data.bio,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[api/onboarding] failed", error);
    return NextResponse.json(
      { error: "Could not save profile" },
      { status: 500 },
    );
  }
}
