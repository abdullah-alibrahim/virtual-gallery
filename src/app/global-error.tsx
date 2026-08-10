"use client";

import Link from "next/link";
import { useEffect } from "react";

import { reportClientError } from "@/lib/errors/report";

/**
 * Root error boundary — replaces the entire document when the root layout fails.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { boundary: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
          display: "grid",
          placeItems: "center",
          minHeight: "100dvh",
          background: "#0f0f0e",
          color: "#f5f2ea",
        }}
      >
        <main style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <h1
            style={{
              fontFamily: "Georgia, 'Instrument Serif', serif",
              fontWeight: 400,
              fontSize: 28,
              letterSpacing: "-0.02em",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ opacity: 0.7, fontSize: 14, lineHeight: 1.5 }}>
            Please refresh. If it keeps happening, visit{" "}
            <Link href="/support" style={{ color: "#f5f2ea" }}>
              support
            </Link>
            .
          </p>
          {error.digest ? (
            <p
              style={{
                opacity: 0.45,
                fontSize: 12,
                fontFamily: "ui-monospace, Menlo, monospace",
              }}
            >
              {error.digest}
            </p>
          ) : null}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 16px",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "#f5f2ea",
                color: "#111",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                padding: "10px 16px",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#f5f2ea",
                textDecoration: "none",
              }}
            >
              Go home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
