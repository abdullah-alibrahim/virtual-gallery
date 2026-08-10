"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlatformOverview } from "@/infrastructure/admin/list-platform-overview";
import { cn } from "@/lib/utils";

type BusyKey = string | null;

export function AdminOverview({
  overview,
  actorEmail,
  module = "overview",
}: {
  overview: PlatformOverview;
  actorEmail: string;
  /** Which admin module to render — keeps routes thin and admin-only. */
  module?: "overview" | "users" | "workspaces" | "galleries" | "templates";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<BusyKey>(null);
  const [userQuery, setUserQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "admin" | "disabled">(
    "all",
  );

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return overview.users.filter((user) => {
      if (userFilter === "admin" && !user.platformAdmin) return false;
      if (userFilter === "disabled" && !user.disabled) return false;
      if (!q) return true;
      return (
        user.email.toLowerCase().includes(q) ||
        user.displayName.toLowerCase().includes(q) ||
        user.uid.toLowerCase().includes(q)
      );
    });
  }, [overview.users, userFilter, userQuery]);

  async function patchJson(
    url: string,
    body: Record<string, unknown>,
    key: string,
    success: string,
  ) {
    setBusy(key);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }
      toast.success(success);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  function confirmAction(message: string): boolean {
    return window.confirm(message);
  }

  const titles = {
    overview: "Overview",
    users: "Users",
    workspaces: "Workspaces",
    galleries: "Galleries",
    templates: "Templates",
  } as const;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={titles[module]}
        description={
          module === "overview"
            ? `Platform console for ${actorEmail}. Admin modules only — users, plans, galleries, templates.`
            : `Admin · ${titles[module].toLowerCase()} controls`
        }
      />

      {module === "overview" ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-fade stagger-fade-1">
            <StatCard label="Users" value={overview.stats.users} href="/admin/users" />
            <StatCard
              label="Workspaces"
              value={overview.stats.workspaces}
              href="/admin/workspaces"
            />
            <StatCard
              label="Galleries"
              value={overview.stats.galleries}
              href="/admin/galleries"
            />
            <StatCard
              label="Published"
              value={overview.stats.publishedGalleries}
              href="/admin/galleries"
            />
          </section>

          {overview.adminEmails.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Allowlisted via{" "}
              <code className="text-foreground">ADMIN_EMAILS</code>:{" "}
              {overview.adminEmails.join(", ")}
            </p>
          ) : (
            <Alert tone="warning" title="No ADMIN_EMAILS">
              Access is claim-based only. Set{" "}
              <code className="text-foreground">ADMIN_EMAILS</code> for the
              platform admin account.
            </Alert>
          )}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["/admin/users", "Users", "Grant admin, suspend accounts"],
                ["/admin/workspaces", "Workspaces", "Change free / pro / studio"],
                ["/admin/galleries", "Galleries", "Unpublish, delete, restore"],
                ["/admin/templates", "Templates", "Catalogue status"],
              ] as const
            ).map(([href, label, blurb]) => (
              <Link
                key={href}
                href={href}
                className="border border-border bg-background/60 px-5 py-5 transition-colors hover:border-foreground/30"
              >
                <p className="font-serif text-xl tracking-tight">{label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
              </Link>
            ))}
          </section>
        </>
      ) : null}

      {module === "users" ? (
      <AdminTable
        title="Users"
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search email, name, uid…"
              className="h-10 max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["admin", "Admins"],
                  ["disabled", "Suspended"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={userFilter === id ? "primary" : "secondary"}
                  onClick={() => setUserFilter(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        }
      >
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No users match this filter.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.uid} className="border-b border-border/70">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {user.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.displayName || "—"} · {user.uid}
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {user.plan ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.disabled
                      ? "Suspended"
                      : user.onboardingComplete
                        ? "Active"
                        : "Onboarding"}
                  </td>
                  <td className="px-4 py-3">
                    {user.platformAdmin ? (
                      <span className="text-foreground">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busy === `admin:${user.uid}`}
                        onClick={() => {
                          const next = !user.platformAdmin;
                          if (
                            !confirmAction(
                              next
                                ? `Grant platform admin to ${user.email}?`
                                : `Revoke platform admin from ${user.email}?`,
                            )
                          ) {
                            return;
                          }
                          void patchJson(
                            `/api/admin/users/${user.uid}`,
                            { platformAdmin: next },
                            `admin:${user.uid}`,
                            next
                              ? "Marked as platform admin."
                              : "Admin access removed.",
                          );
                        }}
                      >
                        {user.platformAdmin ? "Revoke admin" : "Make admin"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={user.disabled ? "secondary" : "ghost"}
                        disabled={busy === `disable:${user.uid}`}
                        onClick={() => {
                          const next = !user.disabled;
                          if (
                            !confirmAction(
                              next
                                ? `Suspend ${user.email}? They will be signed out.`
                                : `Reinstate ${user.email}?`,
                            )
                          ) {
                            return;
                          }
                          void patchJson(
                            `/api/admin/users/${user.uid}`,
                            { disabled: next },
                            `disable:${user.uid}`,
                            next ? "User suspended." : "User reinstated.",
                          );
                        }}
                      >
                        {user.disabled ? "Reinstate" : "Suspend"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTable>
      ) : null}

      {module === "workspaces" ? (
      <AdminTable title="Workspaces">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {overview.workspaces.map((ws) => (
              <tr key={ws.id} className="border-b border-border/70">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{ws.name}</div>
                  <div className="text-xs text-muted-foreground">{ws.id}</div>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">
                  {ws.plan}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div>
                    {ws.galleries}
                    {ws.galleryLimit > 0 ? ` / ${ws.galleryLimit}` : ""} galleries
                  </div>
                  <div className="text-xs">
                    {ws.seats} seat{ws.seats === 1 ? "" : "s"}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {ws.ownerId}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {(["free", "pro", "studio"] as const).map((plan) => (
                      <Button
                        key={plan}
                        type="button"
                        size="sm"
                        variant={ws.plan === plan ? "primary" : "secondary"}
                        disabled={
                          ws.plan === plan || busy === `plan:${ws.id}:${plan}`
                        }
                        onClick={() => {
                          if (
                            !confirmAction(
                              `Change workspace “${ws.name}” to ${plan}? Limits update immediately.`,
                            )
                          ) {
                            return;
                          }
                          void patchJson(
                            `/api/admin/workspaces/${ws.id}`,
                            { plan },
                            `plan:${ws.id}:${plan}`,
                            `Plan set to ${plan}.`,
                          );
                        }}
                      >
                        {plan}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
      ) : null}

      {module === "galleries" ? (
      <AdminTable title="Galleries">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Workspace</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {overview.galleries.map((gallery) => (
              <tr key={gallery.id} className="border-b border-border/70">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">
                    {gallery.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {gallery.id}
                  </div>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">
                  {gallery.deleted ? "deleted" : gallery.status}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {gallery.slug ? (
                    <Link
                      href={`/g/${gallery.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {gallery.slug}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {gallery.workspaceId}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {gallery.deleted ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busy === `restore:${gallery.id}`}
                        onClick={() => {
                          if (
                            !confirmAction(
                              `Restore “${gallery.title}”? Usage count will increase.`,
                            )
                          ) {
                            return;
                          }
                          void patchJson(
                            `/api/admin/galleries/${gallery.id}`,
                            { action: "restore" },
                            `restore:${gallery.id}`,
                            "Gallery restored.",
                          );
                        }}
                      >
                        Restore
                      </Button>
                    ) : (
                      <>
                        {gallery.status === "published" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busy === `unpub:${gallery.id}`}
                            onClick={() => {
                              if (
                                !confirmAction(
                                  `Unpublish “${gallery.title}”? The public link will go offline.`,
                                )
                              ) {
                                return;
                              }
                              void patchJson(
                                `/api/admin/galleries/${gallery.id}`,
                                { action: "unpublish" },
                                `unpub:${gallery.id}`,
                                "Gallery unpublished.",
                              );
                            }}
                          >
                            Unpublish
                          </Button>
                        ) : null}
                        <select
                          className="h-8 border border-border bg-background px-2 text-xs"
                          defaultValue=""
                          disabled={Boolean(busy?.startsWith(`status:${gallery.id}`))}
                          onChange={(event) => {
                            const status = event.target.value as
                              | "draft"
                              | "unpublished"
                              | "archived"
                              | "";
                            event.target.value = "";
                            if (!status) return;
                            if (
                              !confirmAction(
                                `Set “${gallery.title}” status to ${status}?`,
                              )
                            ) {
                              return;
                            }
                            void patchJson(
                              `/api/admin/galleries/${gallery.id}`,
                              { action: "setStatus", status },
                              `status:${gallery.id}`,
                              `Status set to ${status}.`,
                            );
                          }}
                        >
                          <option value="" disabled>
                            Status…
                          </option>
                          <option value="draft">draft</option>
                          <option value="unpublished">unpublished</option>
                          <option value="archived">archived</option>
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy === `del:${gallery.id}`}
                          onClick={() => {
                            if (
                              !confirmAction(
                                `Soft-delete “${gallery.title}”? It can be restored later.`,
                              )
                            ) {
                              return;
                            }
                            void patchJson(
                              `/api/admin/galleries/${gallery.id}`,
                              { action: "softDelete" },
                              `del:${gallery.id}`,
                              "Gallery soft-deleted.",
                            );
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
      ) : null}

      {module === "templates" ? (
      <AdminTable title="Templates">
        {overview.templates.length === 0 ? (
          <div className="px-4 py-8 text-sm text-muted-foreground">
            No templates in Firestore. Run{" "}
            <code className="text-foreground">npm run seed:templates</code>.
          </div>
        ) : (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
              <tr className="border-b border-border">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {overview.templates.map((template) => (
                <tr key={template.id} className="border-b border-border/70">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {template.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {template.id}
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {template.tier}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {template.status}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {template.category || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminTable>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 font-serif text-4xl tracking-tight">{value}</p>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="border border-border bg-background/60 px-5 py-5 transition-colors hover:border-foreground/30"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="border border-border bg-background/60 px-5 py-5">
      {inner}
    </div>
  );
}

function AdminTable({
  title,
  toolbar,
  children,
}: {
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 stagger-fade stagger-fade-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
        {toolbar}
      </div>
      <div
        className={cn(
          "overflow-x-auto border border-border bg-background/50",
        )}
      >
        {children}
      </div>
    </section>
  );
}
