"use client";

import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Component, Suspense } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  private reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <Alert tone="destructive" title="Something went wrong">
        <p>{error.message}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={this.reset}
        >
          <RotateCcw aria-hidden />
          Try again
        </Button>
      </Alert>
    );
  }
}

/**
 * Suspense and error handling in one wrapper, so every data region fails and
 * loads consistently instead of each feature inventing its own.
 */
export function AsyncBoundary({
  children,
  pending,
  fallback,
}: {
  children: ReactNode;
  pending?: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}) {
  const boundaryProps = fallback ? { fallback } : {};

  return (
    <ErrorBoundary {...boundaryProps}>
      <Suspense fallback={pending ?? <DefaultPending />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function DefaultPending() {
  return (
    <div className="flex w-full flex-col gap-4 py-6" aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-48 max-w-full" />
    </div>
  );
}

export { ErrorBoundary };
