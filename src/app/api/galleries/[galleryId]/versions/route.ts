import { NextResponse } from "next/server";

import { ForbiddenError, NotFoundError } from "@/core/errors";
import { getSession } from "@/infrastructure/firebase/session";
import { listGalleryVersions } from "@/infrastructure/publish/list-versions";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ galleryId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { galleryId } = await context.params;

  try {
    const versions = await listGalleryVersions({
      galleryId,
      uid: session.uid,
    });
    return NextResponse.json({ versions });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[api/galleries/versions] failed", error);
    return NextResponse.json(
      { error: "Could not load versions" },
      { status: 500 },
    );
  }
}
