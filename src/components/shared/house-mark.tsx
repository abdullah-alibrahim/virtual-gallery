import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * House mark — a nested lozenge, like a gallery nail / passepartout corner.
 * Brass by default; inherit via `currentColor`.
 */
export function HouseMark({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        d="M12 2.15 21.85 12 12 21.85 2.15 12 12 2.15Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="miter"
      />
      <path
        d="M12 7.4 16.6 12 12 16.6 7.4 12 12 7.4Z"
        fill="currentColor"
        opacity="0.88"
      />
    </svg>
  );
}

export function BrandLockup({
  href = "/",
  className,
  markSize = 16,
  nameClassName,
  markOnly = false,
}: {
  href?: string;
  className?: string;
  markSize?: number;
  nameClassName?: string;
  markOnly?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-80",
        className,
      )}
      title={siteConfig.name}
    >
      <HouseMark
        size={markSize}
        className="text-[color:var(--luxury-brass)]"
      />
      {markOnly ? (
        <span className="sr-only">{siteConfig.name}</span>
      ) : (
        <span
          className={cn(
            "font-serif text-xl tracking-tight sm:text-2xl",
            nameClassName,
          )}
        >
          {siteConfig.name}
        </span>
      )}
    </Link>
  );
}
