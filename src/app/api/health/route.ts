import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function probeAuthEmulator(): Promise<"connected" | "missing" | "skipped"> {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== "true") {
    return "skipped";
  }
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
  const url = host.startsWith("http")
    ? host
    : `http://${host}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    // Auth emulator answers on / with 200 or redirects; any response = up.
    return res.ok || res.status < 500 ? "connected" : "missing";
  } catch {
    return "missing";
  }
}

/**
 * Liveness + (in emulator mode) Auth emulator reachability for the sign-in banner.
 */
export async function GET() {
  const authEmulator = await probeAuthEmulator();
  return NextResponse.json({
    ok: true,
    service: "virtual-gallery",
    time: new Date().toISOString(),
    authEmulator,
    useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true",
  });
}
