"use client";

import { ErrorBoundaryUI } from "@/components/ErrorBoundary";

export default function ClientDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryUI error={error} reset={reset} title="Could not load client" />;
}
