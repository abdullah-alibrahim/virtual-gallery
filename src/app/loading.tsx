import { Skeleton } from "@/components/ui/skeleton";

/** Neutral root loading — not gallery-shaped, so auth/marketing don’t flash wrong UI. */
export default function RouteLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <Skeleton className="h-px w-12" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
    </main>
  );
}
