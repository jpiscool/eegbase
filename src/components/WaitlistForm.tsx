"use client";

import { useState } from "react";

export function WaitlistForm({ variant = "default" }: { variant?: "default" | "compact" }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    // Persist locally (real backend wired in Q3 2026)
    try {
      const list = JSON.parse(localStorage.getItem("eegbase-waitlist") || "[]");
      list.push({ email, role, ts: new Date().toISOString() });
      localStorage.setItem("eegbase-waitlist", JSON.stringify(list));
    } catch {}
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ padding: "16px 20px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, color: "#065F46", fontSize: 14, lineHeight: 1.6 }}>
        <strong>You&apos;re on the list.</strong> We&apos;ll email <strong>{email}</strong> as soon as paid plans launch in Q3 2026 — and earlier if private-beta seats open up.
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, maxWidth: 480, margin: "0 auto" }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@clinic-email.com"
          aria-label="Email address"
          style={{ flex: 1, padding: "10px 14px", fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", background: "#FFFFFF" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#2563EB"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
        />
        <button type="submit" style={{ padding: "10px 18px", background: "#2563EB", color: "white", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}>
          Join waitlist →
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 460, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@clinic.com"
          aria-label="Email address"
          style={{ padding: "10px 14px", fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", background: "#FFFFFF" }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Your role"
          style={{ padding: "10px 14px", fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", background: "#FFFFFF", color: role ? "#111" : "#9CA3AF" }}
        >
          <option value="">Your role…</option>
          <option value="clinician">Clinician (BCN/LPC/PsyD/MD)</option>
          <option value="practice-owner">Practice owner</option>
          <option value="researcher">Researcher</option>
          <option value="patient">Patient / family</option>
          <option value="industry">Industry partner</option>
          <option value="other">Other</option>
        </select>
      </div>
      {error && <p style={{ fontSize: 12, color: "#DC2626", margin: 0 }}>{error}</p>}
      <button type="submit" style={{ padding: "12px 18px", background: "#2563EB", color: "white", fontSize: 14, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer" }}>
        Join the waitlist →
      </button>
      <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, textAlign: "center" }}>
        Plain text, ~1 email per month, unsubscribe one-click. Your email is never sold.
      </p>
    </form>
  );
}
