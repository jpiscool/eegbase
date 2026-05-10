"use client";

import { useState } from "react";
import Link from "next/link";

const CPT_CODES = [
  { code: "90901", name: "Biofeedback training",                          medicare: "$45 (excluded · 2024)", commercial: "$60–95", note: "Most common · biofeedback alone, no psychotherapy" },
  { code: "90875", name: "Psychophys + psychotherapy · 30 min",            medicare: "Excluded",              commercial: "$80–120", note: "When NF + psychotherapy combined, ~30 min" },
  { code: "90876", name: "Psychophys + psychotherapy · 45 min",            medicare: "Excluded",              commercial: "$110–160", note: "When NF + psychotherapy combined, ~45 min" },
  { code: "90849", name: "Multi-family group psychotherapy",               medicare: "Excluded",              commercial: "$60–90/pt", note: "Group sessions · per patient" },
  { code: "97012", name: "Mechanical traction (sometimes paired)",         medicare: "$15",                   commercial: "$25–40", note: "Rarely used standalone for NF" },
  { code: "99214", name: "E/M · established patient, moderate",            medicare: "$135",                  commercial: "$150–200", note: "When clinician evaluates + plans during visit" },
];

export default function CalculatorsPage() {
  const [tab, setTab] = useState<"cpt" | "insurance">("cpt");

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#0EA5E9", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Calculators</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Practical math for neurofeedback practices</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 28, maxWidth: 720 }}>
          Insurance reimbursement estimates and CPT code lookup. Numbers are illustrative — always confirm with your billing team.
        </p>

        {/* Tab nav */}
        <div role="tablist" aria-label="Calculator tabs" style={{ display: "flex", gap: 6, marginBottom: 20, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {[
            { id: "cpt", label: "CPT code lookup" },
            { id: "insurance", label: "Insurance estimator" },
          ].map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id as typeof tab)}
              style={{ padding: "8px 16px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", background: tab === t.id ? "#2563EB" : "transparent", color: tab === t.id ? "white" : "#475569" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "cpt" && (
          <section role="tabpanel" style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th style={{ textAlign: "left", padding: 14, fontWeight: 800, color: "#475569", borderBottom: "1px solid #E5E7EB", width: 90 }}>Code</th>
                  <th style={{ textAlign: "left", padding: 14, fontWeight: 800, color: "#475569", borderBottom: "1px solid #E5E7EB" }}>Service</th>
                  <th style={{ textAlign: "left", padding: 14, fontWeight: 800, color: "#475569", borderBottom: "1px solid #E5E7EB", width: 130 }}>Medicare</th>
                  <th style={{ textAlign: "left", padding: 14, fontWeight: 800, color: "#475569", borderBottom: "1px solid #E5E7EB", width: 130 }}>Commercial</th>
                </tr>
              </thead>
              <tbody>
                {CPT_CODES.map((c, i) => (
                  <tr key={c.code} style={{ borderTop: i === 0 ? "none" : "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 14px", fontFamily: "ui-monospace, monospace", fontWeight: 800, color: "#2563EB" }}>{c.code}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#0F172A", fontWeight: 600 }}>{c.name}</div>
                      <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>{c.note}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748B" }}>{c.medicare}</td>
                    <td style={{ padding: "12px 14px", color: "#0F172A", fontWeight: 600 }}>{c.commercial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: 16, background: "#FEF3C7", borderTop: "1px solid #FCD34D", fontSize: 11, color: "#78350F", lineHeight: 1.7 }}>
              <strong>Note:</strong> Medicare excluded biofeedback codes effective 2024 — bill with -GA modifier and complete ABN. Commercial reimbursement varies by payer + region. EEGBase auto-suggests codes per session and pulls real-time eligibility via Stedi.
            </div>
          </section>
        )}

        {tab === "insurance" && (
          <InsuranceEstimator />
        )}
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}

function InsuranceEstimator() {
  const [code, setCode] = useState("90901");
  const [payer, setPayer] = useState("commercial");
  const [sessions, setSessions] = useState(20);

  const RATES: Record<string, Record<string, number>> = {
    "90901": { commercial: 75, medicare: 0, medicaid: 30, selfpay: 150 },
    "90875": { commercial: 95, medicare: 0, medicaid: 40, selfpay: 175 },
    "90876": { commercial: 130, medicare: 0, medicaid: 55, selfpay: 200 },
    "90849": { commercial: 70, medicare: 0, medicaid: 28, selfpay: 90 },
  };
  const perSession = RATES[code]?.[payer] ?? 0;
  const total = perSession * sessions;
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <section role="tabpanel" style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>Inputs</h3>
          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>CPT code</span>
            <select value={code} onChange={(e) => setCode(e.target.value)} style={{ width: "100%", padding: 10, fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, marginTop: 4 }}>
              <option value="90901">90901 · Biofeedback training</option>
              <option value="90875">90875 · NF + psychotherapy 30 min</option>
              <option value="90876">90876 · NF + psychotherapy 45 min</option>
              <option value="90849">90849 · Group multi-family</option>
            </select>
          </label>
          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Payer type</span>
            <select value={payer} onChange={(e) => setPayer(e.target.value)} style={{ width: "100%", padding: 10, fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, marginTop: 4 }}>
              <option value="commercial">Commercial (BCBS, Aetna, Cigna, UHC)</option>
              <option value="medicare">Medicare (excluded since 2024)</option>
              <option value="medicaid">Medicaid (state-dependent)</option>
              <option value="selfpay">Self-pay / cash</option>
            </select>
          </label>
          <label style={{ display: "block" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Sessions in protocol</span>
            <input type="number" min={1} max={60} value={sessions} onChange={(e) => setSessions(Math.max(1, Number(e.target.value)))} style={{ width: "100%", padding: 10, fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, marginTop: 4 }} />
          </label>
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>Estimate</h3>
          <div style={{ background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)", border: "1px solid #A7F3D0", borderRadius: 12, padding: 18, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Per session</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#065F46", letterSpacing: "-0.02em" }}>{fmt(perSession)}</div>
          </div>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Full {sessions}-session protocol</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{fmt(total)}</div>
          </div>
          <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 12, lineHeight: 1.6 }}>
            Illustrative regional median. Real reimbursement depends on contracted rate, prior auth status, modifier requirements, and patient deductible status. EEGBase pulls real eligibility via Stedi 270/271.
          </p>
        </div>
      </div>
    </section>
  );
}
