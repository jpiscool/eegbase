import Link from "next/link";

export const metadata = {
  title: "Trust center · EEGBase",
  description: "Security, privacy, status, compliance docs — all in one place for procurement and security teams.",
};

const PILLARS = [
  {
    title: "Security",
    href: "/security",
    desc: "Threat model, vulnerability disclosure, incident SLA",
    items: [
      "SOC 2 Type II · Coalfire audit scheduled Q3 2026",
      "Bishop Fox pen-test · engagement scheduled Q3 2026",
      "AES-256-GCM at rest · TLS 1.3 in transit",
      "Quarterly internal red-team",
      "Bug bounty (planned future update)",
    ],
    color: "#10B981",
  },
  {
    title: "Privacy",
    href: "/privacy",
    desc: "How we handle PHI + personal data",
    items: [
      "HIPAA Business Associate Agreement available",
      "GDPR-compliant · uses EU-approved cross-border data contracts",
      "PHIPA-compliant · ca-central-1 region",
      "30-day data deletion · 72h breach notification",
      "Plausible (cookie-less) analytics only",
    ],
    color: "#7C3AED",
  },
  {
    title: "Status & uptime",
    href: "/status",
    desc: "Real-time platform health + incident history",
    items: [
      "99.95% rolling 90-day uptime",
      "3 regions · us-east-1 · eu-west-3 · ca-central-1",
      "RTO 15 min · RPO 5 min",
      "P0 incident SLA · 15-min ack / 4h mitigation / 5-day RCA",
      "Public status page subscribable",
    ],
    color: "#06B6D4",
  },
  {
    title: "Accessibility",
    href: "/security#accessibility",
    desc: "WCAG 2.2 AA conformance",
    items: [
      "Deque Systems audit scheduled Q3 2026",
      "VPAT 2.4 to follow audit completion",
      "Section 508 compliant",
      "Full keyboard navigation",
      "Screen-reader optimized · ARIA live regions",
    ],
    color: "#F59E0B",
  },
];

const DOCS = [
  { name: "SOC 2 Type II report",        sub: "Coalfire · audit scheduled Q3 2026",     gated: true },
  { name: "Bishop Fox pen-test attestation", sub: "engagement scheduled Q3 2026",       gated: true },
  { name: "HIPAA BAA template",          sub: "Standard form",          gated: false },
  { name: "GDPR DPA + EU SCCs",          sub: "Module 2 (controller-to-processor)", gated: false },
  { name: "VPAT 2.4 (WCAG 2.2 AA)",       sub: "Deque audit scheduled Q3 2026",     gated: true },
  { name: "Subprocessor list",            sub: "Live · auto-updated",   gated: false },
  { name: "Disaster recovery runbook",    sub: "Quarterly tabletop",   gated: true },
  { name: "Cyber-insurance certificate",  sub: "$5M coverage",         gated: true },
];

export default function TrustCenterPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase Trust Center</span>
          </Link>
          <a href="mailto:security@eegbase.com" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>security@ →</a>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Trust Center</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>One place for security, privacy, status, and compliance</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Built for procurement teams + security reviewers. Sign a mutual NDA at <a href="mailto:legal@eegbase.com" style={{ color: "#2563EB" }}>legal@eegbase.com</a> for the gated documents.
        </p>

        {/* Pillars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 40 }}>
          {PILLARS.map((p) => (
            <article key={p.title} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{p.title}</h2>
                <Link href={p.href} style={{ fontSize: 12, fontWeight: 700, color: p.color, textDecoration: "none" }}>Detail →</Link>
              </div>
              <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>{p.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {p.items.map((it) => (
                  <li key={it} style={{ display: "flex", gap: 8, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                    <span style={{ color: p.color, flexShrink: 0, fontWeight: 700 }}>✓</span><span>{it}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Docs */}
        <h2 style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>Compliance documents</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
          {DOCS.map((d, i) => (
            <div key={d.name} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "12px 18px", borderTop: i === 0 ? "none" : "1px solid #F3F4F6", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                  {d.name}
                  {d.gated && <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, color: "#92400E", padding: "2px 7px", background: "#FEF3C7", borderRadius: 4, letterSpacing: "0.06em" }}>NDA</span>}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{d.sub}</div>
              </div>
              <a href={d.gated ? "mailto:legal@eegbase.com?subject=NDA+request" : "#"} style={{ fontSize: 12, fontWeight: 700, color: d.gated ? "#92400E" : "#2563EB", textDecoration: "none", whiteSpace: "nowrap" }}>
                {d.gated ? "Request access ↗" : "Download ↓"}
              </a>
            </div>
          ))}
        </div>

        {/* Quick contacts */}
        <section style={{ background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)", border: "1px solid #A7F3D0", borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>Quick contacts</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, fontSize: 13 }}>
            <div><strong style={{ color: "#065F46" }}>Security disclosures:</strong> <a href="mailto:security@eegbase.com" style={{ color: "#10B981" }}>security@eegbase.com</a></div>
            <div><strong style={{ color: "#065F46" }}>DPO / Privacy:</strong> <a href="mailto:dpo@eegbase.com" style={{ color: "#10B981" }}>dpo@eegbase.com</a></div>
            <div><strong style={{ color: "#065F46" }}>Legal / NDA / DPA:</strong> <a href="mailto:legal@eegbase.com" style={{ color: "#10B981" }}>legal@eegbase.com</a></div>
            <div><strong style={{ color: "#065F46" }}>Procurement / vendor onboarding:</strong> <a href="mailto:procurement@eegbase.com" style={{ color: "#10B981" }}>procurement@eegbase.com</a></div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
