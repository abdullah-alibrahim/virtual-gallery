import { NextResponse } from "next/server";

import { sendWeeklyVisitDigests } from "@/infrastructure/analytics/weekly-digest";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendWeeklyVisitDigests();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/weekly-digest] failed", error);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
