"use client";

import type { ReactNode } from "react";

export function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid grid-cols-[88px_1fr] items-center gap-2 text-xs">
      <span className="text-[color:var(--editor-muted)]">{label}</span>
      <div className="min-w-0">{children}</div>
    </label>
  );
}

export function EditorField({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={`h-8 w-full rounded border border-[color:var(--editor-border)] bg-black/30 px-2 text-sm text-[color:var(--editor-foreground)] outline-none focus:border-white/30 ${className ?? ""}`}
      {...props}
    />
  );
}

export function EditorSelect(props: React.ComponentProps<"select">) {
  return (
    <select
      className="h-8 w-full rounded border border-[color:var(--editor-border)] bg-black/30 px-2 text-sm text-[color:var(--editor-foreground)] outline-none focus:border-white/30"
      {...props}
    />
  );
}

export function EditorTextarea(props: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className="min-h-16 w-full rounded border border-[color:var(--editor-border)] bg-black/30 px-2 py-1.5 text-sm text-[color:var(--editor-foreground)] outline-none focus:border-white/30"
      {...props}
    />
  );
}
