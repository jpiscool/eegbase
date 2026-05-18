"use client";

// Real public clinic-registration form. Distinct from /signup which
// is a marketing-trial waitlist that only stores localStorage. This
// route creates an actual clinic + admin + seeded protocols and
// signs the new admin straight into /dashboard.

import { useState, useTransition } from "react";
import Link from "next/link";
import { registerClinicAction } from "./actions";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await registerClinicAction(formData);
      if (res?.error) setError(res.error);
      // Success path is a redirect thrown by NextAuth — we never reach here.
    });
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0A1320",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: 20,
    }}>
      <div style={{
        maxWidth: 420, width: "100%",
        background: "#0F172A", border: "1px solid #1E293B",
        borderRadius: 16, padding: "32px 28px",
      }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9", margin: "0 0 6px" }}>
            Create your clinic
          </h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
            Spin up a free EEGBase clinic in 30 seconds — comes pre-seeded with 6 starter protocols.
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Clinic name" hint="Shown to your clients on shared reports.">
            <input
              name="clinicName"
              type="text"
              required
              maxLength={120}
              placeholder="Sunrise Neuro"
              style={inputStyle}
              disabled={isPending}
            />
          </Field>

          <Field label="Your name">
            <input
              name="adminName"
              type="text"
              required
              maxLength={120}
              placeholder="Dr Jane Doe"
              style={inputStyle}
              disabled={isPending}
            />
          </Field>

          <Field label="Email">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@clinic.com"
              style={inputStyle}
              disabled={isPending}
            />
          </Field>

          <Field label="Password" hint="At least 8 characters.">
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              style={inputStyle}
              disabled={isPending}
            />
          </Field>

          {error && (
            <div style={{
              background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.30)",
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#FCA5A5",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            style={{
              background: isPending ? "#1E40AF" : "#2563EB",
              color: "white", border: "none",
              padding: "12px 16px", borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {isPending ? "Creating clinic…" : "Create clinic → Dashboard"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#64748B", marginTop: 20, textAlign: "center" }}>
          Already have a clinic? <Link href="/login" style={{ color: "#60A5FA", textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1E293B",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  color: "#F1F5F9",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "#64748B" }}>{hint}</span>}
    </label>
  );
}
