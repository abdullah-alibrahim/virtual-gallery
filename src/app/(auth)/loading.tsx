/**
 * Instant shell — always shows a Sign in affordance (never a forever “Loading…”).
 */
export default function AuthLoading() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <h1 className="text-3xl font-medium tracking-tight">Sign in</h1>
      <p className="text-sm text-muted-foreground">Loading form…</p>
      <button
        type="button"
        disabled
        className="h-11 w-full rounded-md border border-border bg-foreground text-background opacity-60"
      >
        Sign in
      </button>
    </div>
  );
}
