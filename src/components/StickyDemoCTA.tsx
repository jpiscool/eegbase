"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function StickyDemoCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (dismissed) return;
      setVisible(window.scrollY > 700);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Try the demo"
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        background: "#0F172A",
        borderRadius: 999,
        boxShadow: "0 16px 48px rgba(15,23,42,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset",
        padding: "8px 8px 8px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        animation: "slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`@keyframes slide-up { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px #34D399", flexShrink: 0 }} />
      <span style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em" }}>
        Demo loaded with 5 clients · 20-session arcs
      </span>
      <Link
        href="/demo"
        style={{ background: "#2563EB", color: "white", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none", marginLeft: 4 }}
      >
        Try live →
      </Link>
      <button
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        style={{ background: "transparent", border: "none", color: "#64748B", padding: "8px 10px", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}
