"use client";

// Last-resort error boundary. Per Next.js docs, global-error.tsx
// catches errors thrown by the ROOT layout itself (which the regular
// error.tsx cannot, since error.tsx renders INSIDE that root layout).
//
// Because the layout has crashed we can't rely on its <html>/<body>
// or any shared CSS — global-error MUST supply its own. Keep it minimal
// and accessible.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#0A1320",
          color: "#CBD5E1",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 480, padding: 32, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(248,113,113,0.10)",
              border: "1px solid rgba(248,113,113,0.30)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="#F87171" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9", margin: "0 0 8px" }}>
            EEGBase encountered a critical error
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#94A3B8", margin: "0 0 8px" }}>
            The page layout itself failed to load. Your data is safe. Try refreshing — if the
            problem persists, contact your administrator with the error ID below.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11,
                color: "#64748B",
                marginBottom: 24,
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: "#3B82F6",
              color: "white",
              border: "none",
              padding: "10px 24px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
