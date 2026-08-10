import type { ReactNode } from "react";

/**
 * Full-bleed editor chrome — no app sidebar. Auth is enforced in the page.
 */
export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[color:var(--editor-bg)] text-[color:var(--editor-foreground)]">
      {children}
    </div>
  );
}
