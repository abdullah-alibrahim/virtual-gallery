import { NextResponse } from "next/server";
import { z } from "zod";

import { NotFoundError, ValidationError } from "@/core/errors";
import { createLead } from "@/infrastructure/leads/create-lead";

export const runtime = "nodejs";

const bodySchema = z.object({
  galleryId: z.string().min(1),
  artworkId: z.string().nullable().optional(),
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  message: z.string().min(1).max(2000),
  visitorId: z.string().min(8).max(80).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid enquiry" }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rateKey =
    parsed.data.visitorId ??
    forwarded ??
    request.headers.get("x-real-ip") ??
    "anon";

  try {
    const result = await createLead({
      galleryId: parsed.data.galleryId,
      artworkId: parsed.data.artworkId ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      rateKey,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[api/leads] create failed", error);
    return NextResponse.json({ error: "Could not send enquiry" }, { status: 500 });
  }
}
