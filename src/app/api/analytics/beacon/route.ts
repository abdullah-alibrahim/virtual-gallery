import { NextResponse } from "next/server";
import { z } from "zod";

import { NotFoundError, ValidationError } from "@/core/errors";
import { recordAnalyticsEvent } from "@/infrastructure/analytics/record-event";
import { assertRateLimit } from "@/infrastructure/security/rate-limit";
import { minuteBucket } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("view"),
    galleryId: z.string().min(1),
    visitorId: z.string().min(8).max(80),
  }),
  z.object({
    type: z.literal("artwork_click"),
    galleryId: z.string().min(1),
    artworkId: z.string().min(1),
    visitorId: z.string().min(8).max(80),
  }),
  z.object({
    type: z.literal("heart"),
    galleryId: z.string().min(1),
    visitorId: z.string().min(8).max(80),
  }),
  z.object({
    type: z.literal("visit"),
    galleryId: z.string().min(1),
    visitorId: z.string().min(8).max(80),
  }),
]);

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anon";

  try {
    await assertRateLimit({
      key: `analytics:${ip}`,
      limit: 120,
      windowId: minuteBucket(),
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  try {
    await recordAnalyticsEvent(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[api/analytics] failed", error);
    return NextResponse.json({ error: "Could not record" }, { status: 500 });
  }
}
