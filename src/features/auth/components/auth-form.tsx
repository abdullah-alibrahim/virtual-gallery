"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import { useT } from "@/i18n/locale-provider";
import type { Translator } from "@/i18n/translate";

import { exchangeSession } from "../lib/exchange-session";

const EMAIL_STORAGE_KEY = "vg.emailForSignIn";
const MIN_PASSWORD_LENGTH = 8;

/** Emulator-only demo hint — never shown against production Auth. */
const SHOW_DEMO_HINT =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

export const DEMO_CREDENTIALS = {
  email: "demo@virtualgallery.dev",
  password: "Demo1234!",
} as const;

export const PRO_DEMO_CREDENTIALS = {
  email: "pro@virtualgallery.dev",
  password: "ProDemo1234!",
} as const;

export const ADMIN_CREDENTIALS = {
  email: "admin@virtualgallery.dev",
  password: "Admin1234!",
} as const;

type Mode = "sign-in" | "sign-up";
type AuthMethod = "password" | "link";
type EmulatorStatus = "checking" | "connected" | "missing" | "skipped";

/** Lazy — never import firebase/* at module top (throws break first paint). */
async function loadAuthClient() {
  return import("@/infrastructure/firebase/auth-client");
}

function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

function isLanIpHost(hostname: string): boolean {
  return (
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) && hostname !== "127.0.0.1"
  );
}

export function AuthForm({
  mode,
  nextPath = "/dashboard",
}: {
  mode: Mode;
  nextPath?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<AuthMethod>("password");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [completingLink, setCompletingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lanWarning, setLanWarning] = useState(false);
  const [emulatorStatus, setEmulatorStatus] =
    useState<EmulatorStatus>(SHOW_DEMO_HINT ? "checking" : "skipped");
  const t = useT();

  useEffect(() => {
    (window as Window & { __VG_AUTH_READY__?: boolean }).__VG_AUTH_READY__ =
      true;
    const banner = document.getElementById("vg-auth-hydrate-error");
    if (banner) banner.hidden = true;
    setLanWarning(isLanIpHost(window.location.hostname));
  }, []);

  /** Show recovery banner only if the client never marked itself ready. */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!(window as Window & { __VG_AUTH_READY__?: boolean }).__VG_AUTH_READY__) {
        const el = document.getElementById("vg-auth-hydrate-error");
        if (el) el.hidden = false;
      }
    }, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!SHOW_DEMO_HINT) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const body = (await res.json()) as {
          authEmulator?: "connected" | "missing";
        };
        if (!cancelled) {
          setEmulatorStatus(body.authEmulator ?? "missing");
        }
      } catch {
        if (!cancelled) setEmulatorStatus("missing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("password") || params.has("email")) {
      params.delete("password");
      params.delete("email");
      const next = params.toString();
      const clean = `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", clean);
    }

    let cancelled = false;

    async function maybeCompleteEmailLink() {
      const authClient = await loadAuthClient();
      if (cancelled || !authClient.isEmailSignInLink(window.location.href)) {
        return;
      }

      setBusy(true);
      setCompletingLink(true);
      setError(null);
      try {
        const stored =
          window.localStorage.getItem(EMAIL_STORAGE_KEY) ??
          window.prompt(t("auth.confirmEmail")) ??
          "";
        if (!stored) {
          setError(t("auth.emailRequired"));
          setCompletingLink(false);
          return;
        }

        const idToken = await authClient.completeEmailSignIn(
          stored.trim(),
          window.location.href,
        );
        window.localStorage.removeItem(EMAIL_STORAGE_KEY);
        await finishSignIn(idToken);
      } catch (err) {
        if (!cancelled) {
          setError(messageOf(err, t));
          setCompletingLink(false);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void maybeCompleteEmailLink();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resolveDestination(): string {
    if (typeof window === "undefined") return safeNext(nextPath);
    const fromQuery = new URLSearchParams(window.location.search).get("next");
    return safeNext(fromQuery ?? nextPath);
  }

  async function finishSignIn(idToken: string) {
    const session = await exchangeSession(idToken);
    toast.success(
      session.created ? t("auth.welcomeStudio") : t("auth.welcomeBack"),
    );
    const destination = session.onboardingComplete
      ? resolveDestination()
      : "/onboarding";
    window.location.assign(destination);
  }

  async function onPasswordSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const trimmed = email.trim().toLowerCase();
      const pwd = password;
      if (pwd.length < MIN_PASSWORD_LENGTH) {
        setError(t("auth.errors.weakPassword"));
        setBusy(false);
        return;
      }

      const authClient = await loadAuthClient();
      const idToken =
        mode === "sign-up"
          ? await authClient.signUpWithEmailPassword(trimmed, pwd)
          : await authClient.signInWithEmailPassword(trimmed, pwd);
      await finishSignIn(idToken);
    } catch (err) {
      setError(messageOf(err, t));
      setBusy(false);
    }
  }

  async function onLinkSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const trimmed = email.trim().toLowerCase();
      const authClient = await loadAuthClient();
      await authClient.sendEmailSignInLink(
        trimmed,
        `${siteConfig.url}/verify?next=${encodeURIComponent(resolveDestination())}`,
      );
      window.localStorage.setItem(EMAIL_STORAGE_KEY, trimmed);
      setLinkSent(true);
      toast.success(t("auth.linkSent"));
    } catch (err) {
      setError(messageOf(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const authClient = await loadAuthClient();
      const idToken = await authClient.signInWithGoogle();
      await finishSignIn(idToken);
    } catch (err) {
      setError(messageOf(err, t));
      setBusy(false);
    }
  }

  function fillCredentials(nextEmail: string, nextPassword: string) {
    setEmail(nextEmail);
    setPassword(nextPassword);
    setMethod("password");
    setError(null);
  }

  if (completingLink && !error) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-3xl font-medium tracking-tight">
          {t("auth.signingYouIn")}
        </h1>
        <p className="text-base text-muted-foreground">
          {t("auth.confirmingLink")}
        </p>
      </div>
    );
  }

  if (linkSent) {
    return (
      <div className="w-full max-w-md">
        <Alert tone="success" title={t("auth.linkSentTitle")}>
          <p>{t("auth.linkSentBody", { email })}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => {
              setLinkSent(false);
              setMethod("link");
            }}
          >
            {t("auth.differentEmail")}
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div
        id="vg-auth-hydrate-error"
        hidden
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"
      >
        <p className="font-medium">Sign-in UI didn’t load</p>
        <p className="mt-1 text-muted-foreground">
          Open{" "}
          <a
            className="underline underline-offset-4"
            href="http://localhost:3000/sign-in?force=1"
          >
            http://localhost:3000/sign-in?force=1
          </a>
          , hard-refresh, and ensure emulators +{" "}
          <code>npm run seed:demo</code> are running.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          {siteConfig.name}
        </p>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          {mode === "sign-up" ? t("auth.joinStudio") : t("auth.welcomeBack")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "sign-up"
            ? t("auth.signUpTitle")
            : t("auth.signInTitle")}
        </p>
      </div>

      {SHOW_DEMO_HINT ? (
        <p className="text-xs text-muted-foreground" data-testid="emulator-status">
          Auth emulator:{" "}
          <span className="text-foreground">
            {emulatorStatus === "checking"
              ? "checking…"
              : emulatorStatus === "connected"
                ? "connected"
                : emulatorStatus === "missing"
                  ? "missing — run firebase emulators + npm run seed:demo"
                  : "n/a"}
          </span>
        </p>
      ) : null}

      {lanWarning ? (
        <Alert tone="warning" title="Prefer localhost">
          <p>
            You’re on a LAN IP. Prefer{" "}
            <a
              className="underline underline-offset-4"
              href="http://localhost:3000/sign-in?force=1"
            >
              http://localhost:3000/sign-in?force=1
            </a>
            .
          </p>
        </Alert>
      ) : null}

      {SHOW_DEMO_HINT ? (
        <Alert tone="info" title="Emulator accounts">
          <div className="flex flex-col gap-2 text-sm">
            <p>
              Demo: <code>{DEMO_CREDENTIALS.email}</code> /{" "}
              <code>{DEMO_CREDENTIALS.password}</code>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() =>
                  fillCredentials(
                    DEMO_CREDENTIALS.email,
                    DEMO_CREDENTIALS.password,
                  )
                }
              >
                Fill demo
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() =>
                  fillCredentials(
                    PRO_DEMO_CREDENTIALS.email,
                    PRO_DEMO_CREDENTIALS.password,
                  )
                }
              >
                Fill pro
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    try {
                      await fetch("/api/session", { method: "DELETE" });
                      window.location.assign("/sign-in?force=1");
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                Clear session
              </Button>
            </div>
          </div>
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="destructive" title={t("auth.couldNotSignIn")}>
          {error}
        </Alert>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={method === "password" ? "primary" : "secondary"}
          disabled={busy}
          onClick={() => setMethod("password")}
        >
          {t("auth.emailPassword")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={method === "link" ? "primary" : "secondary"}
          disabled={busy}
          onClick={() => setMethod("link")}
        >
          {t("auth.emailLink")}
        </Button>
      </div>

      {method === "password" ? (
        <form
          method="post"
          action="#"
          noValidate
          onSubmit={onPasswordSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              disabled={busy}
              className="h-11"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "sign-up" ? "new-password" : "current-password"
              }
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === "sign-up"
                  ? t("auth.passwordHint")
                  : t("auth.password")
              }
              disabled={busy}
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            size="lg"
            className="w-full"
            data-testid="sign-in-submit"
          >
            {busy
              ? mode === "sign-up"
                ? t("auth.creating")
                : t("auth.signingIn")
              : mode === "sign-up"
                ? t("common.signUp")
                : t("common.signIn")}
          </Button>
        </form>
      ) : (
        <form
          method="post"
          action="#"
          noValidate
          onSubmit={onLinkSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email-link">{t("auth.email")}</Label>
            <Input
              id="email-link"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              disabled={busy}
              className="h-11"
            />
          </div>
          <Button type="submit" disabled={busy} size="lg" className="w-full">
            {busy ? t("common.loading") : t("auth.emailLink")}
          </Button>
        </form>
      )}

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          {t("common.or")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={() => void onGoogle()}
      >
        {t("auth.continueGoogle")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "sign-up" ? (
          <>
            {t("auth.hasAccount")}{" "}
            <Link
              href="/sign-in?force=1"
              className="text-foreground underline-offset-4 hover:underline"
            >
              {t("common.signIn")}
            </Link>
          </>
        ) : (
          <>
            {t("auth.noAccount")}{" "}
            <Link
              href="/sign-up"
              className="text-foreground underline-offset-4 hover:underline"
            >
              {t("auth.createOne")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function messageOf(error: unknown, t: Translator): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    switch (code) {
      case "auth/popup-closed-by-user":
        return t("auth.errors.cancelled");
      case "auth/invalid-email":
        return t("auth.errors.invalidEmail");
      case "auth/unauthorized-domain":
        return t("auth.errors.unauthorizedDomain");
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return t("auth.errors.wrongPassword");
      case "auth/user-not-found":
        return t("auth.errors.userNotFound");
      case "auth/email-already-in-use":
        return t("auth.errors.emailInUse");
      case "auth/weak-password":
        return t("auth.errors.weakPassword");
      case "auth/too-many-requests":
        return t("auth.errors.tooMany");
      case "auth/network-request-failed":
        return t("auth.errors.network");
      default:
        break;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return t("auth.errors.generic");
}
