import { NextResponse } from "next/server";

import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/errors";
import { getSession } from "@/infrastructure/firebase/session";
import { unpublishGallery } from "@/infrastructure/publish/unpublish-gallery";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ galleryId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { galleryId } = await context.params;

  try {
    await unpublishGallery({ galleryId, uid: session.uid });
    return NextResponse.json({ ok: true });
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
    console.error("[api/galleries/unpublish] failed", error);
    return NextResponse.json(
      { error: "Could not unpublish" },
      { status: 500 },
    );
  }
}
