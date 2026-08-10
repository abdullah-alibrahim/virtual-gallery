"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useT } from "@/i18n";
import { getOrCreateVisitorId } from "@/lib/analytics/visitor-id";

/**
 * Shared enquiry form used by the public profile and the in-viewer detail sheet.
 * Lives in components/ so features do not import each other.
 */
export function EnquiryForm({
  galleryId,
  artworkId = null,
  disabled = false,
  compact = false,
}: {
  galleryId: string | null;
  artworkId?: string | null;
  disabled?: boolean;
  compact?: boolean;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!galleryId || disabled) return;
    setBusy(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId,
          artworkId,
          name,
          email,
          message,
          visitorId: getOrCreateVisitorId(),
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(body?.error ?? t("enquiry.failed"));
      }
      toast.success(t("enquiry.sent"));
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("enquiry.failed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lead-name">{t("enquiry.name")}</Label>
          <Input
            id="lead-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={busy || disabled}
            className="border-white/20 bg-white/5 text-inherit"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lead-email">{t("enquiry.email")}</Label>
          <Input
            id="lead-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={busy || disabled}
            className="border-white/20 bg-white/5 text-inherit"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-message">{t("enquiry.message")}</Label>
        <Textarea
          id="lead-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={compact ? 3 : 5}
          disabled={busy || disabled}
          className="border-white/20 bg-white/5 text-inherit"
        />
      </div>
      <Button type="submit" disabled={busy || disabled || !galleryId}>
        {busy ? t("common.loading") : t("enquiry.send")}
      </Button>
    </form>
  );
}
