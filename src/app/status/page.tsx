import Link from "next/link";

export const metadata = {
  title: "Status · EEGBase",
  description: "Real-time uptime, region health, and incident history.",
};

// Pre-launch posture: no real production traffic yet, so no real
// uptime numbers or incidents to publish. The regions/services lists
// describe the surface that WILL be monitored once we onboard the
// first paying clinic.
const REGIONS = [
  { name: "United States · us-east-1",  status: "pre-launch" },
  { name: "European Union · eu-west-3", status: "pre-launch" },
  { name: "Canada · ca-central-1",      status: "pre-launch" },
];

const SERVICES = [
  { name: "Web app",                     status: "pre-launch" },
  { name: "WebSocket streaming",         status: "pre-launch" },
  { name: "API · /v1/*",                 status: "pre-launch" },
  { name: "Stripe billing webhook",      status: "pre-launch" },
  { name: "Daily.co video relay",        status: "pre-launch" },
  { name: "AI provider (Claude)",         status: "pre-launch" },
  { name: "BIDS export pipeline",        status: "pre-launch" },
  { name: "Email · transactional",       status: "pre-launch" },
];

// No real incidents to report — we haven't carried real production
// traffic yet, and we'd rather show an empty state than fake history.
const INCIDENTS: { date: string; title: string; resolved: string; postmortem: boolean }[] = [];

const COLOR = { operational: "#10B981", degraded: "#F59E0B", outage: "#EF4444", "pre-launch": "#94A3B8" };

export default function StatusPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase Status</span>
          </Link>
          <Link href="/contact" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Contact →</Link>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
          EEGBase Status
        </h1>
        {/* Top status banner — honest pre-launch posture */}
        <div style={{ background: "linear-gradient(135deg, #F8FAFC, #F1F5F9)", border: "1px solid #CBD5E1", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#94A3B8", boxShadow: "0 0 0 4px rgba(148,163,184,0.18)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>Pre-launch · no real traffic yet</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>This page will go live the day we onboard our first clinic. No fake uptime numbers in the meantime.</div>
          </div>
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, padding: "4px 10px", background: "rgba(148,163,184,0.15)", border: "1px solid #CBD5E1", borderRadius: 99, whiteSpace: "nowrap" }}>PRE-LAUNCH</div>
        </div>

        {/* Region footprint (what we'll monitor on launch) */}
        <h2 style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Region footprint</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
          {REGIONS.map((r, i) => (
            <div key={r.name} style={{ display: "grid", gridTemplateColumns: "16px 1fr 110px", gap: 16, alignItems: "center", padding: "14px 20px", borderTop: i === 0 ? "none" : "1px solid #F3F4F6" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLOR[r.status as keyof typeof COLOR] }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{r.name}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>pre-launch</div>
            </div>
          ))}
        </div>

        {/* Service surface (what we'll monitor on launch) */}
        <h2 style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Service surface</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 14, marginBottom: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {SERVICES.map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F9FAFB", borderRadius: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR[s.status as keyof typeof COLOR] }} />
                <span style={{ fontSize: 13, color: "#111", flex: 1 }}>{s.name}</span>
                <span style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>—</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: 11, color: "#94A3B8" }}>
            Each surface above will get its own real-time check (p95 latency, error rate, regional uptime) once the first clinic onboards. We&rsquo;ll wire it up to Datadog synthetics + a public StatusPage feed.
          </p>
        </div>

        {/* Incidents (empty state) */}
        <h2 style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Recent incidents</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: "32px 20px", textAlign: "center", marginBottom: 28 }}>
          {INCIDENTS.length === 0 ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4 }}>No incidents to report</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>This list stays empty until we&rsquo;re carrying real production traffic. When something goes wrong, we&rsquo;ll publish the timeline + RCA here within 5 days.</div>
            </>
          ) : (
            INCIDENTS.map((inc, i) => (
              <div key={inc.date} style={{ padding: "14px 20px", borderTop: i === 0 ? "none" : "1px solid #F3F4F6", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{inc.title}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{inc.date} · resolved {inc.resolved}</div>
                  </div>
                  {inc.postmortem && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#2563EB", padding: "3px 9px", background: "#DBEAFE", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Public RCA</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* SLA — what every onboarded clinic gets */}
        <div style={{ background: "linear-gradient(135deg, #FEF3C7, #FFFBEB)", border: "1px solid #FCD34D", borderRadius: 14, padding: 18, marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>P0 Incident Response · target SLA on launch</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 12 }}>
            <div><div style={{ color: "#78350F" }}>Acknowledgment</div><div style={{ fontSize: 22, fontWeight: 800, color: "#92400E" }}>≤ 15 min</div></div>
            <div><div style={{ color: "#78350F" }}>Mitigation</div><div style={{ fontSize: 22, fontWeight: 800, color: "#92400E" }}>≤ 4 h</div></div>
            <div><div style={{ color: "#78350F" }}>Public RCA</div><div style={{ fontSize: 22, fontWeight: 800, color: "#92400E" }}>≤ 5 days</div></div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#78350F" }}>Targets above kick in once a clinic onboards. Breach notification within 72 h per GDPR Art. 33 + HIPAA Breach Notification Rule applies regardless of platform stage.</div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        Subscribe to incident updates once we&rsquo;re live: <a href="mailto:hello@eegbase.com?subject=Status%20updates%20subscribe" style={{ color: "#2563EB" }}>hello@eegbase.com</a>
      </footer>
    </div>
  );
}
