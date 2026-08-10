"use client";

import { useT } from "@/i18n";

export function StorageUsage({
  usedBytes,
  limitBytes,
}: {
  usedBytes: number;
  limitBytes: number;
}) {
  const t = useT();
  const ratio =
    limitBytes > 0 ? Math.min(1, Math.max(0, usedBytes / limitBytes)) : 0;
  const pct = Math.round(ratio * 100);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <p className="font-medium">{t("assets.storage")}</p>
        <p className="text-muted-foreground">
          {formatGb(usedBytes)} of {formatGb(limitBytes)} · {pct}%
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatGb(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}
