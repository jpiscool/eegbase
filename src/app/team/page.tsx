import Link from "next/link";

export const metadata = {
  title: "Team · EEGBase",
  description: "Who's building EEGBase.",
};

const TEAM = [
  {
    role: "Founder · Engineering",
    name: "Bio at public launch",
    bio: "Prior healthcare-software product. Ships fast, debugs production at 2 a.m.",
    color: "#2563EB",
    initials: "EB",
  },
  {
    role: "Clinical advisor (BCN)",
    name: "Bio at public launch",
    bio: "20+ years neurofeedback. BCIA-board-certified. Multi-clinic operator. Has seen every protocol fail and recover.",
    color: "#10B981",
    initials: "CA",
  },
  {
    role: "Research advisor (PhD fNIRS)",
    name: "Bio at public launch",
    bio: "Published in NeuroImage. Active BIDS-fNIRS contributor. IRB experience across 12+ studies.",
    color: "#7C3AED",
    initials: "RA",
  },
  {
    role: "Compliance counsel",
    name: "Bio at public launch",
    bio: "HIPAA + GDPR + 42 CFR Part 2. Prior digital-health Series A and B compliance lead.",
    color: "#F59E0B",
    initials: "DC",
  },
];

const HIRING = [
  { role: "Senior full-stack engineer", level: "Sr · remote · USA/EU", desc: "Next.js + Postgres + WebSocket. Building the cross-session pattern detector & coaching marketplace." },
  { role: "Clinical product manager",   level: "Sr · remote · USA",     desc: "Run discovery with practicing clinicians. Translate clinical workflows into product." },
  { role: "Research engineer (fNIRS)",   level: "Mid · remote",          desc: "MNE-NIRS, BIDS-fNIRS, motion artifact rejection. Help us run the registry." },
];

export default function TeamPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/brand-assets" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Brand assets →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>The team</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Operators, not just builders</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Job titles less than operating experience. EEGBase is built by people who've sat through Mendi sessions, written SOAP notes, fought with insurance billers, and shipped clinical software for real clinics. We're a small team — we'll publish photos and full bios as we hit hiring milestones.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 40 }}>
          {TEAM.map((p) => (
            <article key={p.role} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: p.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>{p.initials}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.role}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>{p.name}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{p.bio}</p>
            </article>
          ))}
        </div>

        {/* Hiring */}
        <section style={{ background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)", border: "1px solid #A7F3D0", borderRadius: 16, padding: 24, marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>We're hiring</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 14 }}>Open roles</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {HIRING.map((r) => (
              <div key={r.role} style={{ background: "white", borderRadius: 12, padding: 14, display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{r.role}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{r.level}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 1.5 }}>{r.desc}</div>
                </div>
                <a href={`mailto:hiring@eegbase.com?subject=${encodeURIComponent(r.role)}`} style={{ padding: "8px 14px", background: "#10B981", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>Apply →</a>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#047857", marginTop: 12, lineHeight: 1.6 }}>
            Don't see a fit? <a href="mailto:hiring@eegbase.com" style={{ color: "#047857", textDecoration: "underline" }}>Send us a great cold email</a>. We pay attention.
          </p>
        </section>

        <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", lineHeight: 1.7 }}>
          Real names + photos populate as we hit funding milestones and public-launch readiness.
        </p>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/security" style={{ color: "#9CA3AF" }}>Security</Link>
      </footer>
    </div>
  );
}
