import type { MarketingNavCta } from "@/components/shared/marketing-nav";
import { SIGN_IN_HREF } from "@/infrastructure/firebase/auth-constants";
import { getSession } from "@/infrastructure/firebase/session";
import { getTranslator } from "@/i18n/server";

/**
 * Auth-aware marketing CTAs — Studio when signed in, Sign in + Create otherwise.
 * Resolved in app pages so shared components stay free of infrastructure.
 */
export async function getMarketingNavAuth(): Promise<{
  cta: MarketingNavCta;
  secondaryCta: MarketingNavCta | null;
}> {
  const [{ t }, session] = await Promise.all([getTranslator(), getSession()]);
  if (session) {
    return {
      cta: { href: "/dashboard", label: t("common.studio") },
      secondaryCta: null,
    };
  }
  return {
    cta: { href: SIGN_IN_HREF, label: t("common.signIn") },
    secondaryCta: { href: "/sign-up", label: t("common.create") },
  };
}

export async function getPublicAuthCta(): Promise<MarketingNavCta> {
  const [{ t }, session] = await Promise.all([getTranslator(), getSession()]);
  return session
    ? { href: "/dashboard", label: t("common.studio") }
    : { href: SIGN_IN_HREF, label: t("common.signIn") };
}
