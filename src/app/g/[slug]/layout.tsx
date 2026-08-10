import type { ReactNode } from "react";

/**
 * Full-bleed public viewer — no app shell. Dark by design so walls read true.
 */
export default function PublicGalleryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-dvh bg-[#0c0b0a]">{children}</div>;
}
