import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = {
  title: "Verify",
};

/** Email-link landing — AuthForm completes the link client-side. */
export default function VerifyPage() {
  return <AuthForm mode="sign-in" />;
}
