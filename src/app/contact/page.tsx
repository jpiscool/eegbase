"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ROUTING: Record<string, { email: string; eyebrow: string }> = {
  clinician: { email: "hello@eegbase.com",   eyebrow: "Clinician inquiries" },
  partner:   { email: "partners@eegbase.com", eyebrow: "Partnership inquiries" },
  press:     { email: "press@eegbase.com",    eyebrow: "Press inquiries" },
  investor:  { email: "investors@eegbase.com", eyebrow: "Investor inquiries" },
  patient:   { email: "hello@eegbase.com",    eyebrow: "Patient + family inquiries" },
  security:  { email: "security@eegbase.com", eyebrow: "Security disclosure" },
  research:  { email: "research@eegbase.com", eyebrow: "Research collaboration" },
  other:     { email: "hello@eegbase.com",    eyebrow: "General inquiries" },
};

function ContactInner() {
  const params = useSearchParams();
  const initialRole = params.get("role") || "";
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routing = ROUTING[role];

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@") || !name.trim() || !role || !message.trim()) {
      setError("Please fill in name, email, role, and a message.");
      return;
    }
    try {
      const list = JSON.parse(localStorage.getItem("eegbase-contact") || "[]");
      list.push({ name, email, org, role, message, ts: new Date().toISOString() });
      localStorage.setItem("eegbase-contact", JSON.stringify(list));
    } catch {}
    setSubmitted(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>{routing?.eyebrow || "Contact"}</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Talk to us</h1>
        <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.7, marginBottom: 28 }}>
          Real humans answer. Most inquiries get a response within 24 hours, security disclosures within 4. Pick the right inbox below — your message gets routed to a person, not a queue.
        </p>

        {submitted ? (
          <section style={{ background: "white", border: "1px solid #A7F3D0", borderRadius: 14, padding: 28, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ECFDF5", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 24, color: "#10B981" }}>✓</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Thanks, {name.split(" ")[0]}.</h2>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7 }}>
              Your message routes to <strong>{routing.email}</strong>. We'll reply within 24 hours.
            </p>
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 12 }}>
              Want to keep going? <Link href="/demo" style={{ color: "#2563EB" }}>Open the live demo</Link>.
            </p>
          </section>
        ) : (
          <form onSubmit={submit} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Your name">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Maya Chen" style={input} />
            </Field>
            <Field label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.com" style={input} />
            </Field>
            <Field label="Organization (optional)">
              <input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Cedar Valley Neurofeedback" style={input} />
            </Field>
            <Field label="I am a…">
              <select required value={role} onChange={(e) => setRole(e.target.value)} style={{ ...input, color: role ? "#111" : "#9CA3AF" }}>
                <option value="">Select your role…</option>
                <option value="clinician">Clinician (BCN / LPC / MD / PsyD)</option>
                <option value="partner">Partnership / hardware vendor</option>
                <option value="press">Press / journalist</option>
                <option value="investor">Investor</option>
                <option value="research">Researcher / IRB / academic</option>
                <option value="patient">Patient / family member</option>
                <option value="security">Security researcher</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Message">
              <textarea required rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What can we help with?" style={{ ...input, resize: "vertical", fontFamily: "inherit" }} />
            </Field>
            {error && <p style={{ fontSize: 12, color: "#DC2626", margin: 0 }}>{error}</p>}
            <button type="submit" style={{ padding: "12px 18px", background: "#2563EB", color: "white", fontSize: 14, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer" }}>
              Send message →
            </button>
            <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", margin: 0 }}>
              Plain text is fine. We don't auto-reply with marketing fluff.
            </p>
          </form>
        )}

        <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 24, lineHeight: 1.7 }}>
          Prefer email? Direct routes:{" "}
          <a href="mailto:hello@eegbase.com" style={{ color: "#2563EB" }}>hello@</a>{" · "}
          <a href="mailto:security@eegbase.com" style={{ color: "#2563EB" }}>security@</a>{" · "}
          <a href="mailto:research@eegbase.com" style={{ color: "#2563EB" }}>research@</a>{" · "}
          <a href="mailto:partners@eegbase.com" style={{ color: "#2563EB" }}>partners@</a>{" · "}
          <a href="mailto:investors@eegbase.com" style={{ color: "#2563EB" }}>investors@</a>
        </p>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase &middot; <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> &middot; <Link href="/demo" style={{ color: "#9CA3AF" }}>Demo</Link> &middot; <Link href="/pricing" style={{ color: "#9CA3AF" }}>Pricing</Link> &middot; <Link href="/privacy" style={{ color: "#9CA3AF" }}>Privacy</Link> &middot; <Link href="/terms" style={{ color: "#9CA3AF" }}>Terms</Link>
      </footer>
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  outline: "none",
  background: "white",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{label}</span>
      {children}
    </label>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#FAFAFA" }} />}>
      <ContactInner />
    </Suspense>
  );
}
