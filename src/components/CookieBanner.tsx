"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "eegbase-cookie-consent";
const DEMO_ONBOARDING_KEY = "demo-onboarding-dismissed";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    // On the /demo page the onboarding modal also wants the user's attention.
    // Defer the cookie banner until that modal is dismissed (or skipped) so
    // the two don't fight for visual focus on first visit.
    const onDemo = window.location.pathname.startsWith("/demo");
    if (!onDemo) {
      setVisible(true);
      return;
    }
    if (sessionStorage.getItem(DEMO_ONBOARDING_KEY) === "1") {
      setVisible(true);
      return;
    }
    // Poll for the onboarding flag — set when the user clicks "60-sec tour"
    // or "Explore freely" in the demo's welcome modal.
    const id = window.setInterval(() => {
      if (sessionStorage.getItem(DEMO_ONBOARDING_KEY) === "1") {
        setVisible(true);
        window.clearInterval(id);
      }
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  function decide(choice: "accept" | "essential" | "reject") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, ts: Date.now() }));
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      style={{ position: "fixed", bottom: 16, left: 16, right: 16, maxWidth: 720, margin: "0 auto", zIndex: 1000 }}
    >
      <div style={{ background: "#0F172A", borderRadius: 14, padding: "16px 20px", boxShadow: "0 16px 48px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <p style={{ color: "white", fontSize: 13, fontWeight: 700, margin: 0, marginBottom: 4 }}>We use one cookie-less analytics tool. That's it.</p>
          <p style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
            EEGBase does not use Google Analytics, Facebook tracking, or third-party advertising cookies. We use Plausible (privacy-first, EU-hosted, no cookies, no fingerprinting). You can opt out below — your choice persists across visits.
            {" "}<Link href="/privacy" style={{ color: "#60A5FA", textDecoration: "underline" }}>Privacy notice</Link>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => decide("accept")} style={{ padding: "8px 14px", background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Accept analytics
          </button>
          <button onClick={() => decide("essential")} style={{ padding: "8px 14px", background: "transparent", color: "white", border: "1px solid #334155", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Essential only
          </button>
          <button onClick={() => decide("reject")} style={{ padding: "8px 14px", background: "transparent", color: "#94A3B8", border: "1px solid #334155", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Reject all
          </button>
        </div>
      </div>
    </div>
  );
}
