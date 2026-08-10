import { NextResponse } from "next/server";
import { z } from "zod";

import { ValidationError } from "@/core/errors";
import { assertRateLimit } from "@/infrastructure/security/rate-limit";
import { minuteBucket } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().max(500),
  digest: z.string().max(120).optional(),
  href: z.string().max(500).optional(),
  userAgent: z.string().max(300).optional(),
  context: z.record(z.string(), z.string()).optional(),
});

/**
 * Ingests client error reports. Persists nothing sensitive — logs for ops.
 * Rate-limited per IP to avoid abuse.
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anon";

  try {
    await assertRateLimit({
      key: `errors:${ip}`,
      limit: 30,
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
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  console.error("[client-error]", {
    ...parsed.data,
    ip,
    at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
