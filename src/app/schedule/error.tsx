"use client";

import { ErrorBoundaryUI } from "@/components/ErrorBoundary";

export default function ScheduleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryUI error={error} reset={reset} title="Schedule error" />;
}
