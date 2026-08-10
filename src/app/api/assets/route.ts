import { NextResponse } from "next/server";
import { z } from "zod";

import { ForbiddenError, PlanLimitError } from "@/core/errors";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/core/services";
import { createAssetUpload } from "@/infrastructure/assets/create-asset";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";

export const runtime = "nodejs";

const bodySchema = z.object({
  fileName: z.string().min(1).max(180),
  contentType: z.enum(ACCEPTED_IMAGE_TYPES),
  bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

/**
 * Reserves an asset id and Storage path after plan-quota checks.
 * The client then performs a resumable upload to that path.
 */
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
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  try {
    const result = await createAssetUpload({
      uid: ctx.session.uid,
      workspaceId: ctx.account.defaultWorkspaceId,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
      bytes: parsed.data.bytes,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          limit: error.limit,
          current: error.current,
          max: error.max,
        },
        { status: 402 },
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[api/assets] create failed", error);
    return NextResponse.json({ error: "Could not start upload" }, { status: 500 });
  }
}
