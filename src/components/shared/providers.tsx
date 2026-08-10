"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { LocaleProvider, useLocaleContext } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/locales";

import { ThemeProvider } from "./theme-provider";

/**
 * Creates the React Query client.
 *
 * `staleTime` is deliberately non-zero: most of our server state (galleries,
 * assets, templates) changes only when the user changes it, and Firestore
 * subscriptions push live updates into the cache directly. Refetching on every
 * focus would cost reads for no benefit.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const code = (error as { code?: string } | null)?.code;
          if (
            code === "FORBIDDEN" ||
            code === "NOT_FOUND" ||
            code === "VALIDATION_FAILED" ||
            code === "PLAN_LIMIT_REACHED"
          ) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });
}

/** One hard reload after Turbopack chunk miss (common after `.next` wipe). */
function ChunkLoadRecovery() {
  useEffect(() => {
    const key = "vg.chunk-reload";
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "";
      if (!/ChunkLoadError|Loading chunk [\w-]+ failed/i.test(message)) return;
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
      event.preventDefault();
      window.location.reload();
    };
    const clear = () => sessionStorage.removeItem(key);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("load", clear);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("load", clear);
    };
  }, []);
  return null;
}

function LocaleAwareToaster() {
  const { dir } = useLocaleContext();
  return (
    <Toaster
      position={dir === "rtl" ? "bottom-left" : "bottom-right"}
      closeButton
      dir={dir}
      toastOptions={{ classNames: { toast: "text-sm" } }}
    />
  );
}

export function Providers({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <ThemeProvider>
      <LocaleProvider initialLocale={initialLocale}>
        <QueryClientProvider client={queryClient}>
          <NuqsAdapter>
            <ChunkLoadRecovery />
            {children}
          </NuqsAdapter>
          <LocaleAwareToaster />
        </QueryClientProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
