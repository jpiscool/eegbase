"use client";

// Root error boundary — catches any error that bubbles past the
// route-specific boundaries (e.g. /clients/error.tsx, /sessions/error.tsx).
// Renders the same shared shell so the user always lands on a recoverable
// "Try again" page instead of Next.js's default crashed-server message.

import { ErrorBoundaryUI } from "@/components/ErrorBoundary";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Page error"
      description="Something went wrong rendering this page. Click 'Try again' or reload — the data is safe."
    />
  );
}
