"use client";

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
