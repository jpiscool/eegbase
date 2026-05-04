"use client";

import { ErrorBoundaryUI } from "@/components/ErrorBoundary";

export default function ProtocolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryUI error={error} reset={reset} title="Protocols error" />;
}
