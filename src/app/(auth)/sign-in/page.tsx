import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
};

/**
 * Sync server page — SSR always paints the form HTML.
 * Import AuthForm directly (not the barrel) so SignOutButton / session-client
 * Firebase graph never loads on this route.
 */
export default function SignInPage() {
  return <AuthForm mode="sign-in" />;
}
