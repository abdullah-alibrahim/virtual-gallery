import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/errors";
import { getSession } from "@/infrastructure/firebase/session";
import { rollbackGallery } from "@/infrastructure/publish/rollback-gallery";

export const runtime = "nodejs";

const bodySchema = z.object({
  version: z.number().int().positive(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ galleryId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { galleryId } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  }

  try {
    const result = await rollbackGallery({
      galleryId,
      uid: session.uid,
      version: parsed.data.version,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[api/galleries/rollback] failed", error);
    return NextResponse.json({ error: "Could not roll back" }, { status: 500 });
  }
}
