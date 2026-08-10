import type { ComponentProps } from "react";

import {
  siteSocialLabels,
  siteSocials,
  type SiteSocialNetwork,
} from "@/config/social";
import type { ResolvedSocialLink, SocialLinkKind } from "@/lib/social-urls";
import { cn } from "@/lib/utils";

type Tone = "muted" | "onDark" | "brass";
type IconKind = SocialLinkKind | "youtube";

const toneClass: Record<Tone, string> = {
  muted:
    "text-muted-foreground hover:text-foreground focus-visible:outline-foreground/40",
  onDark:
    "text-white/50 hover:text-white focus-visible:outline-white/40",
  brass:
    "text-white/45 hover:text-[color:var(--viewer-brass)] focus-visible:outline-white/30",
};

/**
 * Refined monoline social icons — brand marks as stroke paths, not emoji.
 */
export function SocialLinks({
  links,
  tone = "muted",
  className,
  label,
}: {
  links: readonly ResolvedSocialLink[];
  tone?: Tone;
  className?: string;
  label?: string;
}) {
  if (links.length === 0) return null;

  return (
    <nav
      aria-label={label ?? "Social links"}
      className={cn("flex flex-wrap items-center gap-1", className)}
    >
      {links.map((link) => (
        <a
          key={link.kind}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-sm transition-colors",
            "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2",
            toneClass[tone],
          )}
          aria-label={kindLabel(link.kind)}
        >
          <SocialIcon kind={link.kind} className="size-[1.125rem]" />
        </a>
      ))}
    </nav>
  );
}

/** Site marketing strip — shows all networks; `#` stays muted until env is set. */
export function SiteSocialLinks({
  tone = "muted",
  className,
  label,
}: {
  tone?: Tone;
  className?: string;
  label?: string;
}) {
  const networks = Object.keys(siteSocials) as SiteSocialNetwork[];

  return (
    <nav
      aria-label={label ?? "Virtual Gallery on social"}
      className={cn("flex flex-wrap items-center gap-1", className)}
    >
      {networks.map((key) => {
        const href = siteSocials[key];
        const isPlaceholder = !href || href === "#";
        if (isPlaceholder) {
          return (
            <span
              key={key}
              role="link"
              aria-disabled
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-sm opacity-40",
                toneClass[tone],
              )}
              aria-label={siteSocialLabels[key]}
              title="Set NEXT_PUBLIC_SOCIAL_* to enable"
            >
              <SocialIcon kind={key} className="size-[1.125rem]" />
            </span>
          );
        }
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-sm transition-colors",
              "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2",
              toneClass[tone],
            )}
            aria-label={siteSocialLabels[key]}
          >
            <SocialIcon kind={key} className="size-[1.125rem]" />
          </a>
        );
      })}
    </nav>
  );
}

function kindLabel(kind: SocialLinkKind): string {
  switch (kind) {
    case "website":
      return "Website";
    case "instagram":
      return "Instagram";
    case "twitter":
      return "X";
    case "linkedin":
      return "LinkedIn";
    case "behance":
      return "Behance";
  }
}

function SocialIcon({
  kind,
  className,
}: {
  kind: IconKind;
  className?: string;
}) {
  const props: ComponentProps<"svg"> = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  switch (kind) {
    case "website":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18" />
          <path d="M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...props}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
          <circle cx="12" cy="12" r="3.75" />
          <circle
            cx="17.25"
            cy="6.75"
            r="0.75"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case "twitter":
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M14.2 10.3 21.4 2h-1.7l-6.3 7.2L8.4 2H2.6l7.6 10.8L2.6 22h1.7l6.6-7.6L15.6 22h5.8l-7.2-11.7Zm-2.3 2.7-.8-1.1L5 3.3h2.6l5 7.1.8 1.1 6.6 9.3h-2.6l-5.5-7.8Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...props}>
          <path d="M7 10v8M7 7.2v.01" />
          <path d="M11 18v-5.2a2.8 2.8 0 0 1 5.6 0V18" />
          <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...props}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="3" />
          <path
            d="m10.5 9.2 5 2.8-5 2.8V9.2Z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case "behance":
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M8.4 11.2c1.4 0 2.3-.7 2.3-1.8 0-1.2-.8-1.7-2.2-1.7H5.6v3.5h2.8Zm-.1 5.5c1.6 0 2.5-.8 2.5-2.1 0-1.3-1-2-2.7-2H5.6v4.1h2.7ZM3.2 5.8h5.5c2.5 0 4.2 1.2 4.2 3.3 0 1.4-.8 2.5-2.1 3 1.7.4 2.7 1.7 2.7 3.4 0 2.4-1.9 3.7-4.8 3.7H3.2V5.8Zm11.3 6.4c0-2.4 1.5-4 3.9-4 2.3 0 3.8 1.5 3.8 4H14.5Zm5.7-5.2h-3.6V5.8h3.6v1.2Zm-5.8 6.8h7.4c-.2 2.2-1.7 3.5-3.8 3.5-2.3 0-3.8-1.5-3.6-3.5Z" />
        </svg>
      );
  }
}
