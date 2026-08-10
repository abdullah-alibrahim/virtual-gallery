import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ConflictError,
  ForbiddenError,
  PlanLimitError,
  ValidationError,
} from "@/core/errors";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { createGalleryDocument } from "@/infrastructure/galleries/create-gallery";

export const runtime = "nodejs";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  templateId: z.string().min(1),
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
    return NextResponse.json({ error: "Invalid gallery details" }, { status: 400 });
  }

  try {
    const result = await createGalleryDocument({
      uid: ctx.session.uid,
      workspaceId: ctx.account.defaultWorkspaceId,
      title: parsed.data.title,
      templateId: parsed.data.templateId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 402 });
    }
    if (error instanceof ValidationError || error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[api/galleries] create failed", error);
    return NextResponse.json({ error: "Could not create gallery" }, { status: 500 });
  }
}
