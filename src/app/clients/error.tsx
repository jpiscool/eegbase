"use client";

import { ErrorBoundaryUI } from "@/components/ErrorBoundary";

export default function ClientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryUI error={error} reset={reset} title="Clients error" />;
}
