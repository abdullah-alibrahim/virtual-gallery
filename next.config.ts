import os from "node:os";

import type { NextConfig } from "next";

/**
 * LAN / loopback hosts that may open `next dev` in a browser.
 *
 * Next 16 blocks cross-origin access to `/_next/*` / HMR unless the page
 * origin is allowlisted. Opening the printed Network URL (e.g. 192.168.x.x)
 * without this leaves React unhydrated — form never mounts.
 *
 * Prefer `http://localhost:3000` for local work. Bind with
 * `next dev --hostname 0.0.0.0` so LAN still works when needed.
 */
function resolveAllowedDevOrigins(): string[] {
  const hosts = new Set<string>(["127.0.0.1", "localhost", "[::1]"]);
  try {
    for (const nets of Object.values(os.networkInterfaces())) {
      for (const net of nets ?? []) {
        const family = String(net.family);
        if ((family === "IPv4" || family === "4") && !net.internal) {
          hosts.add(net.address);
        }
      }
    }
  } catch {
    // Sandboxed / restricted envs may deny os.networkInterfaces().
  }
  const fromEnv = process.env.ALLOWED_DEV_ORIGINS?.split(",") ?? [];
  for (const host of fromEnv) {
    const trimmed = host.trim();
    if (trimmed) hosts.add(trimmed);
  }
  return [...hosts];
}

/**
 * Security headers applied to every response.
 *
 * The public viewer runs WebGL and loads textures from Firebase Storage, so the
 * CSP permits blob/data workers and cross-origin images while denying framing
 * and unexpected script sources.
 */
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), xr-spatial-tracking=(self)",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://storage.googleapis.com https://lh3.googleusercontent.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*",
      "worker-src 'self' blob:",
      "media-src 'self' blob: https://firebasestorage.googleapis.com https://storage.googleapis.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: resolveAllowedDevOrigins(),

  serverExternalPackages: ["firebase-admin", "stripe"],

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
