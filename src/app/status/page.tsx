import Link from "next/link";

export const metadata = {
  title: "Status · EEGBase",
  description: "Real-time uptime, region health, and incident history.",
};

const REGIONS = [
  { name: "United States · us-east-1",  status: "operational", uptime: "99.991%", latency: "62 ms" },
  { name: "European Union · eu-west-3", status: "operational", uptime: "99.974%", latency: "78 ms" },
  { name: "Canada · ca-central-1",      status: "operational", uptime: "99.982%", latency: "71 ms" },
];

const SERVICES = [
  { name: "Web app",                     status: "operational" },
  { name: "WebSocket streaming",         status: "operational" },
  { name: "API · /v1/*",                 status: "operational" },
  { name: "Stripe billing webhook",      status: "operational" },
  { name: "Daily.co video relay",        status: "operational" },
  { name: "AI provider (Claude)",         status: "operational" },
  { name: "BIDS export pipeline",        status: "operational" },
  { name: "Email · transactional",       status: "operational" },
];

const INCIDENTS = [
  { date: "Apr 18 2026", title: "Brief degraded latency · eu-west-3",   resolved: "Yes · 14 min", postmortem: true },
  { date: "Mar 02 2026", title: "Stripe webhook delay (3rd-party)",      resolved: "Yes · 47 min", postmortem: true },
  { date: "Feb 11 2026", title: "Mendi driver firmware compatibility",   resolved: "Yes · 2 h 8 min", postmortem: true },
];

const COLOR = { operational: "#10B981", degraded: "#F59E0B", outage: "#EF4444" };

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
        {/* Top status banner */}
        <div style={{ background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)", border: "1px solid #A7F3D0", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 0 4px rgba(16,185,129,0.18)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#065F46", letterSpacing: "-0.01em" }}>All systems operational</div>
            <div style={{ fontSize: 12, color: "#047857", marginTop: 2 }}>99.95% rolling 90-day uptime · last incident 21 days ago</div>
          </div>
          <div style={{ fontSize: 11, color: "#047857", fontWeight: 700, padding: "4px 10px", background: "rgba(16,185,129,0.15)", border: "1px solid #6EE7B7", borderRadius: 99 }}>UPDATED LIVE · 30s</div>
        </div>

        {/* Region health */}
        <h2 style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Region health</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
          {REGIONS.map((r, i) => (
            <div key={r.name} style={{ display: "grid", gridTemplateColumns: "16px 1fr 130px 100px", gap: 16, alignItems: "center", padding: "14px 20px", borderTop: i === 0 ? "none" : "1px solid #F3F4F6" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLOR[r.status as keyof typeof COLOR] }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>uptime {r.uptime} · 90d</div>
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", fontFamily: "ui-monospace, monospace", textAlign: "right" }}>p95 latency {r.latency}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>operational</div>
            </div>
          ))}
        </div>

        {/* 90-day uptime sparkline */}
        <h2 style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Last 90 days · uptime per day</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
            {Array.from({ length: 90 }).map((_, i) => {
              // Index 0 = 90 days ago; index 89 = today (May 9, 2026).
              // Apr 18 ≈ 21 days ago → index 68; Mar 2 ≈ 68 days ago → index 21; Feb 11 ≈ 87 days ago → index 2.
              const isIncident = i === 2 || i === 21 || i === 68;
              const fill = isIncident ? "#F59E0B" : "#10B981";
              return <div key={i} title={`Day ${90 - i}`} style={{ flex: 1, height: 28, background: fill, borderRadius: 2, opacity: 0.85 }} />;
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8" }}>
            <span>90 days ago</span>
            <span>today</span>
          </div>
        </div>

        {/* Service health grid */}
        <h2 style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Services</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 14, marginBottom: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {SERVICES.map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F9FAFB", borderRadius: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR[s.status as keyof typeof COLOR] }} />
                <span style={{ fontSize: 13, color: "#111", flex: 1 }}>{s.name}</span>
                <span style={{ fontSize: 10, color: "#10B981", fontWeight: 700, textTransform: "uppercase" }}>OK</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents */}
        <h2 style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Recent incidents</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
          {INCIDENTS.map((inc, i) => (
            <div key={inc.date} style={{ padding: "14px 20px", borderTop: i === 0 ? "none" : "1px solid #F3F4F6" }}>
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
          ))}
        </div>

        {/* SLA */}
        <div style={{ background: "linear-gradient(135deg, #FEF3C7, #FFFBEB)", border: "1px solid #FCD34D", borderRadius: 14, padding: 18, marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>P0 Incident Response SLA</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 12 }}>
            <div><div style={{ color: "#78350F" }}>Acknowledgment</div><div style={{ fontSize: 22, fontWeight: 800, color: "#92400E" }}>≤ 15 min</div></div>
            <div><div style={{ color: "#78350F" }}>Mitigation</div><div style={{ fontSize: 22, fontWeight: 800, color: "#92400E" }}>≤ 4 h</div></div>
            <div><div style={{ color: "#78350F" }}>Public RCA</div><div style={{ fontSize: 22, fontWeight: 800, color: "#92400E" }}>≤ 5 days</div></div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#78350F" }}>Breach notification within 72 h per GDPR Art. 33 + HIPAA Breach Notification Rule.</div>
        </div>

        <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
          Status data is illustrative for the demo. Production status will be wired to real Datadog / synthetics on launch.
        </p>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        Subscribe to incident updates: <a href="mailto:status-subscribe@eegbase.com" style={{ color: "#2563EB" }}>status-subscribe@eegbase.com</a>
      </footer>
    </div>
  );
}
