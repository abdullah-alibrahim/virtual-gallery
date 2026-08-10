import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/infrastructure/firebase/auth-constants";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  parseLocaleParam,
  type Locale,
} from "@/i18n/locales";

/**
 * Soft auth gate + locale cookie.
 *
 * Edge middleware cannot run the Firebase Admin SDK, so we only check that the
 * session cookie is present. Server Components call `getSession()` for a real
 * cryptographic verify — a forged cookie never unlocks data.
 *
 * Auth routes (/sign-in, /sign-up, /verify) are NOT redirected away when a
 * cookie is present. Edge cannot verify the cookie; a stale vg_session used
 * to cause /sign-in → /dashboard → /sign-in loops (blank login).
 *
 * Locale: `?lang=ar|en` sets `vg_locale` (and is stripped). Missing cookie
 * defaults to Accept-Language when Arabic is preferred, else `en`.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/galleries",
  "/assets",
  "/inbox",
  "/analytics",
  "/settings",
  "/admin",
];

function resolveLocale(request: NextRequest): {
  locale: Locale;
  fromQuery: boolean;
} {
  const fromQuery = parseLocaleParam(request.nextUrl.searchParams.get("lang"));
  if (fromQuery) return { locale: fromQuery, fromQuery: true };

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return { locale: cookie, fromQuery: false };

  const accept = request.headers.get("accept-language") ?? "";
  if (/(^|,)\s*ar\b/i.test(accept)) {
    return { locale: "ar", fromQuery: false };
  }

  return { locale: DEFAULT_LOCALE, fromQuery: false };
}

function applyLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const { locale, fromQuery } = resolveLocale(request);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("force", "1");
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    applyLocaleCookie(redirect, locale);
    return redirect;
  }

  if (fromQuery) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    const redirect = NextResponse.redirect(url);
    applyLocaleCookie(redirect, locale);
    redirect.headers.set("x-vg-locale", locale);
    return redirect;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-vg-locale", locale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!request.cookies.get(LOCALE_COOKIE)?.value) {
    applyLocaleCookie(response, locale);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * All app pages except static assets / Next internals.
     * Auth soft-gate still only applies to PROTECTED_PREFIXES above.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb|hdr|bin)$).*)",
  ],
};
