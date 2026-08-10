/**
 * Client-safe error reporting. Posts digests to `/api/errors` (fire-and-forget).
 */

export function reportClientError(
  error: unknown,
  context?: Record<string, string>,
): void {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  const digest =
    error instanceof Error && "digest" in error
      ? String((error as { digest?: string }).digest ?? "")
      : "";

  if (typeof window === "undefined") {
    console.error("[error]", message, context);
    return;
  }

  console.error(error);
  void fetch("/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message.slice(0, 500),
      digest: digest.slice(0, 120),
      href: window.location.href.slice(0, 500),
      userAgent: navigator.userAgent.slice(0, 300),
      context,
    }),
    keepalive: true,
  }).catch(() => undefined);
}
