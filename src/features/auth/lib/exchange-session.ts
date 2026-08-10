/**
 * Session cookie exchange — fetch only, no Firebase client imports.
 * Kept separate so the sign-in form can load without pulling firebase/*.
 */

export interface SessionExchangeResult {
  readonly uid: string;
  readonly workspaceId: string;
  readonly slug: string;
  readonly created: boolean;
  readonly onboardingComplete: boolean;
}

export async function exchangeSession(
  idToken: string,
): Promise<SessionExchangeResult> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Could not create session");
  }

  return response.json() as Promise<SessionExchangeResult>;
}
