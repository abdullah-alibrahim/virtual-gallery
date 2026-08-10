import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/errors";
import {
  adminRestoreGallery,
  adminSetGalleryStatus,
  adminSoftDeleteGallery,
  adminUnpublishGallery,
  isGalleryStatus,
} from "@/infrastructure/admin/mutate-gallery";
import { requirePlatformAdmin } from "@/infrastructure/admin/require-platform-admin";

export const runtime = "nodejs";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("unpublish") }),
  z.object({ action: z.literal("softDelete") }),
  z.object({ action: z.literal("restore") }),
  z.object({
    action: z.literal("setStatus"),
    status: z.enum(["draft", "unpublished", "archived"]),
  }),
]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ galleryId: string }> },
) {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json(
      {
        error:
          "action required: unpublish | softDelete | restore | setStatus",
      },
      { status: 400 },
    );
  }

  try {
    const body = parsed.data;
    switch (body.action) {
      case "unpublish":
        await adminUnpublishGallery(galleryId);
        break;
      case "softDelete":
        await adminSoftDeleteGallery(galleryId);
        break;
      case "restore":
        await adminRestoreGallery(galleryId);
        break;
      case "setStatus":
        if (!isGalleryStatus(body.status)) {
          return NextResponse.json(
            { error: "Invalid status" },
            { status: 400 },
          );
        }
        await adminSetGalleryStatus(galleryId, body.status);
        break;
    }
    return NextResponse.json({ ok: true, galleryId, ...body });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[api/admin/galleries] failed", error);
    return NextResponse.json(
      { error: "Could not update gallery" },
      { status: 500 },
    );
  }
}
