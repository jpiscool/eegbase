"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "eegbase-exit-intent";

export function ExitIntentModal() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (seen) return;
    let armed = false;
    const armTimer = setTimeout(() => { armed = true; }, 8000); // wait 8s before arming
    const handler = (e: MouseEvent) => {
      if (!armed) return;
      // Mouse leaving via top of viewport = likely closing tab
      if (e.clientY <= 0 && e.relatedTarget == null) {
        setVisible(true);
        sessionStorage.setItem(STORAGE_KEY, "1");
        document.removeEventListener("mouseleave", handler);
      }
    };
    document.addEventListener("mouseleave", handler);
    return () => {
      document.removeEventListener("mouseleave", handler);
      clearTimeout(armTimer);
    };
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes("@")) return;
    try {
      const list = JSON.parse(localStorage.getItem("eegbase-waitlist") || "[]");
      list.push({ email, source: "exit-intent", ts: new Date().toISOString() });
      localStorage.setItem("eegbase-waitlist", JSON.stringify(list));
    } catch {}
    setSubmitted(true);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stay in touch"
      onClick={() => setVisible(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "white", borderRadius: 20, maxWidth: 480, width: "100%", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}
      >
        <div style={{ height: 4, background: "linear-gradient(90deg, #2563EB, #7C3AED, #06B6D4)" }} />
        <div style={{ padding: "28px 32px 32px" }}>
          <button
            aria-label="Close"
            onClick={() => setVisible(false)}
            style={{ position: "absolute", top: 12, right: 12, background: "transparent", border: "none", color: "#94A3B8", fontSize: 22, cursor: "pointer", padding: "4px 10px", lineHeight: 1 }}
          >
            ×
          </button>
          {!submitted ? (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.15em", marginBottom: 10, textTransform: "uppercase" }}>Before you go</p>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 8 }}>
                Want a one-line update when paid plans launch?
              </h2>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 18 }}>
                One email, plain text, no marketing fluff. Unsubscribe in one click.
              </p>
              <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                  aria-label="Email address"
                  style={{ flex: 1, padding: "10px 14px", fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 10, outline: "none" }}
                />
                <button type="submit" style={{ padding: "10px 18px", background: "#2563EB", color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Notify me →
                </button>
              </form>
              <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 12, lineHeight: 1.5 }}>
                Or skip this and{" "}
                <Link href="/demo" onClick={() => setVisible(false)} style={{ color: "#2563EB" }}>open the live demo</Link>.
              </p>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ECFDF5", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 24, color: "#10B981" }}>✓</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>You're on the list.</h2>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
                We'll email <strong>{email}</strong> as soon as paid plans go live.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
