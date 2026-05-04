"use client";

import { ErrorBoundaryUI } from "@/components/ErrorBoundary";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryUI error={error} reset={reset} title="Settings error" />;
}
