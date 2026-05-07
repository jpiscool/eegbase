"use client";

import Link from "next/link";

// Static "operational" indicator linking to /status. In production this would
// poll the actual status API; for now it reflects the canonical demo state.

export function LiveStatusPill() {
  return (
    <Link
      href="/status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        background: "rgba(16,185,129,0.1)",
        border: "1px solid rgba(16,185,129,0.25)",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        color: "#047857",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
      title="View status page"
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#10B981",
          boxShadow: "0 0 0 3px rgba(16,185,129,0.18)",
          animation: "pulse-status 2.4s ease-in-out infinite",
        }}
      />
      <style>{`@keyframes pulse-status { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.15); } }`}</style>
      <span>All systems operational</span>
    </Link>
  );
}
