import Link from "next/link";

export const metadata = {
  title: "Careers · EEGBase",
  description: "Open roles at EEGBase. Build the clinical layer for any neurofeedback hardware.",
};

const ROLES = [
  {
    title: "Senior Full-stack Engineer",
    level: "Senior · Remote · USA / EU",
    salary: "$160–210k + equity",
    desc: "Own the cross-session pattern detector and coaching marketplace. Next.js + Postgres + WebSocket. We ship a public changelog; your work has visible impact within weeks.",
    quals: ["6+ years shipping production web apps", "Strong TypeScript + React", "Postgres / SQL fluency", "Have shipped a real-time streaming feature"],
  },
  {
    title: "Clinical Product Manager",
    level: "Senior · Remote · USA",
    salary: "$140–180k + equity",
    desc: "Run discovery with practicing clinicians (BCN/LPC/MD). Translate clinical workflows into product specs. Own the backlog. You are the bridge between the demo and the clinic.",
    quals: ["BCIA-certified or 5+ years clinical experience", "Have shipped 2+ B2B SaaS products", "Comfortable in front of 50+ user interviews/quarter", "Bonus: prior digital-health or behavioral-health experience"],
  },
  {
    title: "Research Engineer (fNIRS)",
    level: "Mid · Remote",
    salary: "$120–150k + equity",
    desc: "Run the multi-clinic registry and the sham-controlled RCT. MNE-NIRS, BIDS-fNIRS, motion artifact rejection, MNE-Python pipelines.",
    quals: ["MS/PhD in neuroscience or biomedical engineering", "Published with fNIRS data", "Comfortable with BIDS / SNIRF / SciPy stack", "Have helped land at least one IRB approval"],
  },
  {
    title: "Founding Designer",
    level: "Senior · Remote",
    salary: "$140–180k + equity",
    desc: "Own the demo + landing-page + brand. We have strong opinions but need someone who has stronger ones. Healthcare-software experience preferred but not required.",
    quals: ["Have shipped 5+ marketing sites + 1+ B2B SaaS dashboard", "Strong systems thinking (design tokens, component libraries)", "Can prototype in Figma + ship with the engineering team in code"],
  },
];

const VALUES = [
  { title: "Honest gaps over fake polish", desc: "We list what we can't do yet on the homepage. Anyone who pretends to be perfect is hiding something." },
  { title: "Clinicians > engineers > investors", desc: "If a clinical workflow is broken, we fix the workflow before we add a feature. Investors come third in this order on purpose." },
  { title: "Free for clinicians", desc: "We don't charge licensed clinicians during early launch. Revenue comes from clinic-scale enterprise tiers and hardware partnerships, not per-seat fees." },
  { title: "Show your work", desc: "Public changelog, public roadmap, public RCA. Status page is real, not theatrical. We talk publicly about mistakes within 5 days." },
  { title: "Protect the patient", desc: "Patient data never leaves the site of care without explicit consent. Cross-site registry data is de-identified per Safe Harbor + Expert Determination." },
];

const PROCESS = [
  { step: 1, title: "Send us a great cold email",          time: "30 min" },
  { step: 2, title: "30-min intro call with founder",      time: "30 min" },
  { step: 3, title: "Take-home or paired work session",   time: "~3 hours · paid" },
  { step: 4, title: "Final round · meet the team",         time: "Half day" },
  { step: 5, title: "Reference check · offer",             time: "Within a week" },
];

export default function CareersPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/team" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>The team →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Careers · {ROLES.length} open roles</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Build the clinical layer</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          A small team (4 right now, hiring to 8 by Q4 2026) building the clinical software layer for consumer + research neurofeedback hardware. Profitable-by-Q3-2027 plan, well-funded for 18 months runway, fully remote.
        </p>

        {/* Roles */}
        <h2 style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>Open roles</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
          {ROLES.map((r) => (
            <article key={r.title} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 2, letterSpacing: "-0.01em" }}>{r.title}</h3>
                  <p style={{ fontSize: 12, color: "#94A3B8" }}>{r.level} · {r.salary}</p>
                </div>
                <a href={`mailto:hiring@eegbase.com?subject=${encodeURIComponent(r.title)}`} style={{ padding: "8px 14px", background: "#10B981", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>Apply →</a>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 12 }}>{r.desc}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Looking for</p>
              <ul style={{ paddingLeft: 18, listStyle: "disc", color: "#475569", fontSize: 12, lineHeight: 1.8 }}>
                {r.quals.map((q) => <li key={q}>{q}</li>)}
              </ul>
            </article>
          ))}
        </div>

        {/* Values */}
        <h2 style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>How we work</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 40 }}>
          {VALUES.map((v) => (
            <div key={v.title} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{v.title}</h3>
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Process */}
        <h2 style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>Hiring process</h2>
        <ol style={{ counterReset: "step-counter", listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {PROCESS.map((p) => (
            <li key={p.step} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 12, alignItems: "center", background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "10px 16px" }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#2563EB", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{p.step}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{p.title}</span>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>{p.time}</span>
            </li>
          ))}
        </ol>

        <section style={{ background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)", border: "1px solid #A7F3D0", borderRadius: 14, padding: 24, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Don't see your fit?</h2>
          <p style={{ fontSize: 13, color: "#047857", lineHeight: 1.6, marginBottom: 14 }}>
            Send a great cold email. Mention how you'd move the needle on something specific. We read every one.
          </p>
          <a href="mailto:hiring@eegbase.com" style={{ display: "inline-block", padding: "10px 18px", background: "#10B981", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Email hiring@eegbase.com →</a>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
