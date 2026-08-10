"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useT } from "@/i18n";

type MemberRow = {
  uid: string;
  role: string;
  displayName: string;
  email: string;
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
};

export function TeamSettingsPanel({
  seatsLimit,
  canManage,
}: {
  seatsLimit: number;
  canManage: boolean;
}) {
  const t = useT();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/workspace/team");
    const body = (await response.json().catch(() => null)) as {
      members?: MemberRow[];
      invites?: InviteRow[];
      error?: string;
    } | null;
    if (!response.ok) {
      throw new Error(body?.error ?? t("settings.couldNotLoadTeam"));
    }
    setMembers(body?.members ?? []);
    setInvites(body?.invites ?? []);
  }, [t]);

  useEffect(() => {
    void refresh()
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : t("settings.couldNotLoadTeam"),
        );
      })
      .finally(() => setLoading(false));
  }, [refresh, t]);

  async function onInvite(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    setBusy(true);
    try {
      const response = await fetch("/api/workspace/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        joined?: boolean;
        upgrade?: string;
      } | null;
      if (!response.ok) {
        throw new Error(
          body?.error ??
            (response.status === 402
              ? t("settings.seatLimitError")
              : t("settings.inviteFailed")),
        );
      }
      toast.success(
        body?.joined ? t("settings.memberAdded") : t("settings.invitePending"),
      );
      setEmail("");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("settings.inviteFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    setBusy(true);
    try {
      const response = await fetch(
        `/api/workspace/team/invite/${inviteId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? t("settings.revokeFailed"));
      }
      toast.success(t("settings.inviteRevoked"));
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("settings.revokeFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(uid: string) {
    if (!confirm(t("settings.removeConfirm"))) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/workspace/team/member/${uid}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? t("settings.removeFailed"));
      }
      toast.success(t("settings.memberRemoved"));
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("settings.removeFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  const occupied = members.length + invites.length;
  const atCap = occupied >= seatsLimit;

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
          {t("settings.teamSeats")}
        </p>
        <p className="mt-1 font-serif text-2xl tracking-tight">
          {t("settings.seatUsage", { used: occupied, limit: seatsLimit })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.seatsHint")}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("settings.loadingTeam")}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border border border-border">
            {members.map((member) => (
              <li
                key={member.uid}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {member.displayName || member.email}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {member.email} · {member.role}
                  </p>
                </div>
                {canManage && member.role !== "owner" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void removeMember(member.uid)}
                  >
                    {t("settings.removeMember")}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>

          {invites.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                {t("settings.pendingInvites")}
              </p>
              <ul className="divide-y divide-border border border-border">
                {invites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate">{invite.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {invite.role} · {t("settings.pending")}
                      </p>
                    </div>
                    {canManage ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void revokeInvite(invite.id)}
                      >
                        {t("settings.revoke")}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      {canManage ? (
        atCap ? (
          <Alert tone="warning" title={t("settings.seatLimitReached")}>
            {t("settings.seatLimitBody")}
          </Alert>
        ) : (
          <form onSubmit={onInvite} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">{t("settings.inviteByEmail")}</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("settings.emailPlaceholder")}
                disabled={busy}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-role">{t("settings.roleLabel")}</Label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "admin" | "editor" | "viewer")
                }
                disabled={busy}
                className="h-10 border border-border bg-background px-3 text-sm"
              >
                <option value="editor">{t("settings.roleEditor")}</option>
                <option value="admin">{t("settings.roleAdmin")}</option>
                <option value="viewer">{t("settings.roleViewer")}</option>
              </select>
            </div>
            <Button type="submit" disabled={busy || !email.trim()}>
              {busy ? t("settings.sending") : t("settings.sendInvite")}
            </Button>
          </form>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("settings.ownersOnlyInvite")}
        </p>
      )}
    </div>
  );
}
