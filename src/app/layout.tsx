import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, Noto_Sans_Arabic } from "next/font/google";

import { Providers } from "@/components/shared/providers";
import { siteConfig } from "@/config/site";
import { getDictionary } from "@/i18n/get-dictionary";
import { localeDirection } from "@/i18n/locales";
import { getRequestLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/translate";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#131313" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  const dir = localeDirection(locale);
  const t = createTranslator(getDictionary(locale));

  return (
    <html lang={locale} dir={dir} data-locale={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${notoArabic.variable}`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:start-3 focus:z-[100] focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow"
        >
          {t("common.skipToContent")}
        </a>
        <Providers initialLocale={locale}>
          <div id="main">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
