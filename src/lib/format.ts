/** Human-readable byte sizes for plan limits and usage meters. */
export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 MB";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    const rounded = gb >= 10 ? Math.round(gb) : Math.round(gb * 10) / 10;
    return `${rounded} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${Math.round(mb)} MB`;
}

const TIER_LABELS: Record<"free" | "pro", string> = {
  free: "Free rooms",
  pro: "Pro rooms",
};

/** Marketing labels for template tier access on a plan. */
export function formatTemplateTiers(
  tiers: readonly ("free" | "pro")[],
): string {
  return tiers.map((tier) => TIER_LABELS[tier] ?? tier).join(" + ");
}
