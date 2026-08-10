import { NextResponse } from "next/server";

import { ForbiddenError, NotFoundError } from "@/core/errors";
import { processAsset } from "@/infrastructure/assets/process-asset";
import { getSession } from "@/infrastructure/firebase/session";

export const runtime = "nodejs";
/** Processing a 40 MB TIFF can take a while on a laptop CPU. */
export const maxDuration = 60;

export async function POST(
  _request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { assetId } = await context.params;

  try {
    const result = await processAsset({ assetId, uid: session.uid });
    if (result.status === "failed") {
      return NextResponse.json(
        { error: result.error ?? "Processing failed", status: "failed" },
        { status: 422 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[api/assets/process] failed", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
