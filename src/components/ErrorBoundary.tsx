"use client";
import { useEffect } from "react";

export function ErrorBoundaryUI({
  error,
  reset,
  title = "Something went wrong",
  description,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  // Surface every caught error to the console so the user reporting a
  // crash has something to copy/paste, and fire a beacon to the
  // /api/error-report endpoint so prod errors are visible in the
  // function logs (and optionally fan out to Sentry / a webhook,
  // see the endpoint's env config). The beacon is fire-and-forget; if
  // it fails the console.error path still records the crash locally.
  useEffect(() => {
    if (typeof window === "undefined") return;
    console.error("[EEGBase] Caught route error:", error, { digest: error.digest });
    const payload = JSON.stringify({
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
    try {
      // sendBeacon survives unload; fall back to keepalive fetch.
      const blob = new Blob([payload], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/error-report", blob)) {
        void fetch("/api/error-report", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Reporting the report itself shouldn't break the page.
    }
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        minHeight: "60vh",
        padding: "64px 32px",
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
        style={{ background: "var(--danger-subtle)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="var(--danger)" strokeWidth="2" />
          <path d="M12 8v4M12 16h.01" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      <p className="text-sm mb-1 max-w-md" style={{ color: "var(--text-secondary)" }}>
        {description ?? "An unexpected error occurred. Try refreshing or contact your administrator if the problem persists."}
      </p>
      {error.digest && (
        <p className="text-xs mb-6 font-mono" style={{ color: "var(--text-tertiary)" }}>
          Error ID: {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-6" />}

      <button
        onClick={reset}
        className="px-5 py-2 rounded-lg text-sm font-semibold"
        style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
      >
        Try again
      </button>
    </div>
  );
}
