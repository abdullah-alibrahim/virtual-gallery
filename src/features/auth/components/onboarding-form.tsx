"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { isReservedSlug, isValidSlug, slugify } from "@/core/value-objects/slug";
import { useT } from "@/i18n";

export function OnboardingForm({
  initialName,
  initialSlug,
}: {
  initialName: string;
  initialSlug: string;
}) {
  const router = useRouter();
  const t = useT();
  const [displayName, setDisplayName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const nextSlug = slug.trim().toLowerCase();
    if (!isValidSlug(nextSlug) || isReservedSlug(nextSlug)) {
      setError(t("onboarding.slugInvalid"));
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          slug: nextSlug,
          bio: bio.trim(),
        }),
      });

      const body = (await response.json().catch(() => null)) as {
        error?: string;
        galleryId?: string | null;
      } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? t("onboarding.couldNotSave"));
      }

      toast.success(
        body?.galleryId
          ? t("onboarding.welcomeInFirst")
          : t("onboarding.welcomeIn"),
      );
      router.replace(
        body?.galleryId
          ? `/galleries/${body.galleryId}/edit?first=1`
          : "/dashboard",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("onboarding.couldNotSave"));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-lg flex-col gap-8 page-enter"
    >
      <div className="flex flex-col gap-3">
        <div aria-hidden className="rule-grow h-px w-12 bg-foreground/25" />
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          {t("onboarding.step")}
        </p>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          {t("onboarding.howFind")}
        </h1>
        <p className="text-base text-muted-foreground text-pretty">
          {t("onboarding.publicPageHint")}
        </p>
      </div>

      {error ? (
        <Alert tone="destructive" title={t("onboarding.couldNotSave")}>
          {error}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">{t("onboarding.displayName")}</Label>
        <Input
          id="displayName"
          required
          value={displayName}
          onChange={(e) => {
            const value = e.target.value;
            setDisplayName(value);
            if (!slugTouched) {
              setSlug(slugify(value) ?? initialSlug);
            }
          }}
          disabled={busy}
        />
        <p className="text-xs text-muted-foreground">
          {t("onboarding.displayNameHint")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">{t("onboarding.slugLabel")}</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/a/</span>
          <Input
            id="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            disabled={busy}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">{t("onboarding.bioOptional")}</Label>
        <Textarea
          id="bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t("onboarding.bioPlaceholder")}
          disabled={busy}
        />
      </div>

      <Button type="submit" disabled={busy} size="lg">
        {busy ? t("editor.saving") : t("onboarding.enterStudio")}
      </Button>
    </form>
  );
}
