"use client";

import { useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4;

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState({
    clinic: "", role: "", credential: "", email: "", clinicians: 1, devices: [] as string[], baa: false, marketing: false,
  });
  const [submitted, setSubmitted] = useState(false);

  function next() { setStep((s) => Math.min(4, (s + 1)) as Step); }
  function back() { setStep((s) => Math.max(1, (s - 1)) as Step); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const list = JSON.parse(localStorage.getItem("eegbase-trial") || "[]");
      list.push({ ...data, ts: new Date().toISOString() });
      localStorage.setItem("eegbase-trial", JSON.stringify(list));
    } catch {}
    setSubmitted(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
        {!submitted && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Free · no card</p>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 6 }}>Create your account</h1>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginBottom: 24 }}>It&rsquo;s free. No card required · 4 quick steps · about 90 seconds.</p>

            {/* Progress */}
            <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{ flex: 1, height: 4, background: n <= step ? "#2563EB" : "#E5E7EB", borderRadius: 99, transition: "background 0.2s" }} />
              ))}
            </div>
          </>
        )}

        <form onSubmit={submit} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24 }}>
          {submitted ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ECFDF5", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 24, color: "#10B981" }}>✓</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Trial reserved.</h2>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginBottom: 14 }}>
                We'll email <strong>{data.email}</strong> your private demo URL within 4 hours. Until then, the public demo lives at <Link href="/demo" style={{ color: "#2563EB" }}>eegbase.com/demo</Link>.
              </p>
              <Link href="/demo" style={{ display: "inline-block", padding: "10px 18px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Open the public demo →</Link>
            </div>
          ) : step === 1 ? (
            <Step title="Your clinic">
              <Field label="Clinic name">
                <input required value={data.clinic} onChange={(e) => setData({ ...data, clinic: e.target.value })} placeholder="Cedar Valley Neurofeedback" style={input} />
              </Field>
              <Field label="Your role">
                <select required value={data.role} onChange={(e) => setData({ ...data, role: e.target.value })} style={{ ...input, color: data.role ? "#111" : "#9CA3AF" }}>
                  <option value="">Select…</option>
                  <option>Owner / clinical director</option>
                  <option>Clinician (BCN / LPC / PsyD / MD)</option>
                  <option>Office manager</option>
                  <option>Researcher / IRB</option>
                </select>
              </Field>
              <Field label="Number of clinicians">
                <input type="number" min={1} max={500} value={data.clinicians} onChange={(e) => setData({ ...data, clinicians: Number(e.target.value) })} style={input} />
              </Field>
              <Nav onNext={next} canNext={!!data.clinic && !!data.role} />
            </Step>
          ) : step === 2 ? (
            <Step title="Credentials" sub="We verify before activating PHI features.">
              <Field label="Primary credential">
                <select required value={data.credential} onChange={(e) => setData({ ...data, credential: e.target.value })} style={{ ...input, color: data.credential ? "#111" : "#9CA3AF" }}>
                  <option value="">Select…</option>
                  <option>BCN — Board Certified in Neurofeedback (BCIA)</option>
                  <option>BCB — Board Certified in Biofeedback (BCIA)</option>
                  <option>LCSW / LPC / LMFT</option>
                  <option>PsyD / PhD (clinical psychology)</option>
                  <option>MD / DO (psychiatry / neurology)</option>
                  <option>NP / PA</option>
                  <option>Researcher (IRB-affiliated)</option>
                  <option>Other</option>
                </select>
              </Field>
              <p style={{ fontSize: 11, color: "#94A3B8", marginTop: -4 }}>
                You can use the demo and explore reports without verification — verification is required only before storing real Protected Health Information.
              </p>
              <Nav onBack={back} onNext={next} canNext={!!data.credential} />
            </Step>
          ) : step === 3 ? (
            <Step title="Hardware you use" sub="We pre-configure your demo with the right device adapters.">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {["Mendi", "Muse", "OpenBCI", "Polar HRV", "Apple Health / Oura / Whoop", "Other"].map((d) => (
                  <label key={d} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 10, cursor: "pointer", background: data.devices.includes(d) ? "#EFF6FF" : "white" }}>
                    <input
                      type="checkbox"
                      checked={data.devices.includes(d)}
                      onChange={() => setData({ ...data, devices: data.devices.includes(d) ? data.devices.filter((x) => x !== d) : [...data.devices, d] })}
                      style={{ accentColor: "#2563EB" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{d}</span>
                  </label>
                ))}
              </div>
              <Nav onBack={back} onNext={next} />
            </Step>
          ) : (
            <Step title="Email + agreements">
              <Field label="Email">
                <input required type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="you@clinic.com" style={input} />
              </Field>
              <label style={{ display: "flex", gap: 10, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                <input type="checkbox" checked={data.baa} onChange={(e) => setData({ ...data, baa: e.target.checked })} required style={{ marginTop: 4, accentColor: "#2563EB" }} />
                <span>I agree to receive a HIPAA Business Associate Agreement before storing real client data, and to use synthetic data during the trial.</span>
              </label>
              <label style={{ display: "flex", gap: 10, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                <input type="checkbox" checked={data.marketing} onChange={(e) => setData({ ...data, marketing: e.target.checked })} style={{ marginTop: 4, accentColor: "#2563EB" }} />
                <span>Send me product updates (~1 email/month, plain text, unsubscribe one-click).</span>
              </label>
              <Nav onBack={back} submitMode canNext={!!data.email && data.baa} />
            </Step>
          )}
        </form>

        <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 16 }}>
          By starting a trial you agree to our <Link href="/terms" style={{ color: "#2563EB" }}>Terms</Link> and <Link href="/privacy" style={{ color: "#2563EB" }}>Privacy notice</Link>.
        </p>
      </main>
    </div>
  );
}

const input: React.CSSProperties = { width: "100%", padding: "10px 14px", fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 10, outline: "none", background: "white" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{label}</span>
      {children}
    </label>
  );
}

function Step({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: sub ? 4 : 16 }}>{title}</h2>
      {sub && <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>{sub}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </>
  );
}

function Nav({ onBack, onNext, canNext = true, submitMode = false }: { onBack?: () => void; onNext?: () => void; canNext?: boolean; submitMode?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      {onBack && <button type="button" onClick={onBack} style={{ padding: "10px 18px", background: "transparent", color: "#475569", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Back</button>}
      {submitMode ? (
        <button type="submit" disabled={!canNext} style={{ flex: 1, padding: "10px 18px", background: canNext ? "#2563EB" : "#CBD5E1", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: canNext ? "pointer" : "not-allowed" }}>Reserve trial →</button>
      ) : (
        <button type="button" disabled={!canNext} onClick={onNext} style={{ flex: 1, padding: "10px 18px", background: canNext ? "#2563EB" : "#CBD5E1", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: canNext ? "pointer" : "not-allowed" }}>Next →</button>
      )}
    </div>
  );
}
