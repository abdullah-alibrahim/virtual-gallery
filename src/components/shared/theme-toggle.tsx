"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Three-state theme switch. Renders a placeholder until mounted because the
 * resolved theme is unknown during SSR and a mismatch would hydrate wrong.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const t = useT();

  const options = [
    { value: "light", label: t("common.themeLight"), Icon: Sun },
    { value: "system", label: t("common.themeSystem"), Icon: Monitor },
    { value: "dark", label: t("common.themeDark"), Icon: Moon },
  ] as const;

  if (!mounted) {
    return (
      <div
        className={cn("h-8 w-[86px] rounded-md bg-muted", className)}
        aria-hidden
      />
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("common.theme")}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border p-0.5",
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => (
        <Button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          variant={theme === value ? "secondary" : "ghost"}
          size="icon"
          className="size-7 rounded"
          onClick={() => setTheme(value)}
        >
          <Icon aria-hidden />
        </Button>
      ))}
    </div>
  );
}
