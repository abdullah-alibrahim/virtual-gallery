"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { ArtistProfile } from "@/core/entities";
import {
  pickBestCover,
  type CoverCandidate,
} from "@/core/services/artwork-ai-assist";
import { siteConfig } from "@/config/site";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function ProfileSettingsForm({
  profile,
  coverCandidates = [],
}: {
  profile: ArtistProfile;
  coverCandidates?: readonly CoverCandidate[];
}) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [statement, setStatement] = useState(profile.statement);
  const [location, setLocation] = useState(profile.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(profile.coverUrl ?? "");
  const [website, setWebsite] = useState(profile.socials.website ?? "");
  const [facebook, setFacebook] = useState(profile.socials.facebook ?? "");
  const [instagram, setInstagram] = useState(profile.socials.instagram ?? "");
  const [twitter, setTwitter] = useState(profile.socials.twitter ?? "");
  const [linkedin, setLinkedin] = useState(profile.socials.linkedin ?? "");
  const [behance, setBehance] = useState(profile.socials.behance ?? "");
  const [allowInquiries, setAllowInquiries] = useState(
    profile.contact.allowInquiries,
  );

  const bestCover = useMemo(
    () => pickBestCover(coverCandidates),
    [coverCandidates],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          statement,
          location: location.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
          coverUrl: coverUrl.trim() || null,
          socials: {
            ...(website.trim() ? { website: website.trim() } : {}),
            ...(facebook.trim() ? { facebook: facebook.trim() } : {}),
            ...(instagram.trim() ? { instagram: instagram.trim() } : {}),
            ...(twitter.trim() ? { twitter: twitter.trim() } : {}),
            ...(linkedin.trim() ? { linkedin: linkedin.trim() } : {}),
            ...(behance.trim() ? { behance: behance.trim() } : {}),
          },
          contact: {
            allowInquiries,
            showEmail: profile.contact.showEmail,
          },
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(body?.error ?? t("settings.couldNotSave"));
      }
      toast.success(t("settings.profileSaved"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.couldNotSave"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-6">
      {error ? (
        <Alert tone="destructive" title={t("settings.couldNotSave")}>
          {error}
        </Alert>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {t("settings.publicUrl")}{" "}
        <a
          href={`/a/${profile.slug}`}
          className="underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          {siteConfig.url}/a/{profile.slug}
        </a>
      </p>

      <Field label={t("onboarding.displayName")} htmlFor="displayName">
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          disabled={busy}
        />
      </Field>
      <Field label={t("settings.bio")} htmlFor="bio">
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          disabled={busy}
        />
      </Field>
      <Field label={t("settings.statement")} htmlFor="statement">
        <Textarea
          id="statement"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={6}
          disabled={busy}
        />
      </Field>
      <Field label={t("settings.location")} htmlFor="location">
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={busy}
        />
      </Field>
      <Field label={t("settings.avatarUrl")} htmlFor="avatarUrl">
        <Input
          id="avatarUrl"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="/artists/… or https://"
          disabled={busy}
        />
      </Field>
      <Field label={t("settings.coverUrl")} htmlFor="coverUrl">
        <Input
          id="coverUrl"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="/artists/… or https://"
          disabled={busy}
        />
      </Field>

      {coverCandidates.length > 0 ? (
        <div className="flex flex-col gap-3 border border-border p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t("settings.coverPick")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("settings.coverPickHint")}
              </p>
            </div>
            {bestCover ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setCoverUrl(bestCover.url);
                  toast.message(t("settings.coverApplied"));
                }}
              >
                {t("settings.coverBest")}
              </Button>
            ) : null}
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {coverCandidates.map((candidate) => {
              const selected = coverUrl === candidate.url;
              return (
                <li key={candidate.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setCoverUrl(candidate.url)}
                    className={cn(
                      "relative aspect-[4/3] w-full overflow-hidden border transition-colors",
                      selected
                        ? "border-foreground"
                        : "border-border hover:border-foreground/40",
                    )}
                    aria-label={candidate.label ?? candidate.id}
                    aria-pressed={selected}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={candidate.url}
                      alt=""
                      className="size-full object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="space-y-4 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">{t("settings.socialsHint")}</p>
        <Field label={t("settings.facebook")} htmlFor="facebook">
          <Input
            id="facebook"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/…"
            disabled={busy}
          />
        </Field>
        <Field label={t("settings.website")} htmlFor="website">
          <Input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            disabled={busy}
          />
        </Field>
        <Field label={t("settings.instagram")} htmlFor="instagram">
          <Input
            id="instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="handle"
            disabled={busy}
          />
        </Field>
        <Field label={t("settings.twitter")} htmlFor="twitter">
          <Input
            id="twitter"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder="handle"
            disabled={busy}
          />
        </Field>
        <Field label={t("settings.linkedin")} htmlFor="linkedin">
          <Input
            id="linkedin"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/…"
            disabled={busy}
          />
        </Field>
        <Field label={t("settings.behance")} htmlFor="behance">
          <Input
            id="behance"
            value={behance}
            onChange={(e) => setBehance(e.target.value)}
            placeholder="https://behance.net/…"
            disabled={busy}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={allowInquiries}
          onChange={(e) => setAllowInquiries(e.target.checked)}
          disabled={busy}
        />
        {t("settings.allowEnquiries")}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? t("editor.saving") : t("settings.saveProfile")}
        </Button>
        <a
          href={`/a/${profile.slug}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {t("settings.viewPublicProfile")}
        </a>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
