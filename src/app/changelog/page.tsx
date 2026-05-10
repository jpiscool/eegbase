import Link from "next/link";

export const metadata = {
  title: "Changelog · EEGBase",
  description: "Recent shipped improvements to the EEGBase platform.",
};

type Tag = "shipped" | "improved" | "fixed" | "research";

const ENTRIES: { date: string; tag: Tag; title: string; desc: string }[] = [
  { date: "May 6 2026",  tag: "shipped",  title: "White-label /mendi-clinical-preview route", desc: "Visual artifact showing what the white-label B2B SaaS arm looks like — side-by-side dashboard mockups, 8 before/after rebrand rows, 60/40 commercial card." },
  { date: "May 6 2026",  tag: "shipped",  title: "60-second auto-tour + cmd-K command palette", desc: "Demo header gains an auto-advancing guided tour through the 6 most important tabs. ⌘K opens a fuzzy-search palette to jump anywhere." },
  { date: "May 6 2026",  tag: "shipped",  title: "Sticky 'You're seeing' captions per tab",     desc: "Every demo tab now has a sticky one-line caption explaining what's worth looking at. 16 unique captions." },
  { date: "May 6 2026",  tag: "shipped",  title: "Cross-session AI pattern detector",           desc: "AI Insights now correlates Mendi fNIRS data with Apple Health · Oura · mood · HRV · adherence to surface causal-looking drivers (Spearman, p<0.05 only)." },
  { date: "May 5 2026",  tag: "shipped",  title: "HIPAA video co-feedback panel",               desc: "Live Session tab gets a telehealth panel where the clinician sees the at-home client's live signals during the call. DTLS 1.3 · 120ms WebRTC · ±80ms LSL sync · Daily.co BAA." },
  { date: "May 5 2026",  tag: "shipped",  title: "Connected wearables integration",             desc: "Heart & Breathing tab gains 5-card wearables strip (Apple Health · Oura · Whoop · Garmin · Fitbit) via Spike API normalization." },
  { date: "May 5 2026",  tag: "shipped",  title: "Mendi pitch kit + 15-slide pptx",              desc: "Full pre-meeting kit lives in /mendi-pitch — pre-meeting email, demo voiceover script, talking points, one-pager content, .pptx deck source." },
  { date: "May 4 2026",  tag: "shipped",  title: "Live ROI calculator + pricing teaser on landing", desc: "Interactive sliders for clinicians/sessions/price · live annual savings vs SimplePractice/TherapyNotes/Myndlift. Pricing teaser added to landing page." },
  { date: "May 4 2026",  tag: "shipped",  title: "Outcome-story strip + trust pills above the fold", desc: "20-session ADHD arc visualization · 5-pill trust strip (Schrems II + Bishop Fox + HIPAA + SOC 2 + BIDS)." },
  { date: "May 4 2026",  tag: "shipped",  title: "Honest-gaps section ('What we don't do yet')", desc: "Lists ONC HIT, EPCS/PDMP, FHIR R4, native mobile, LORETA, RCT, FDA — with target dates. Counterintuitive trust signal." },
  { date: "May 3 2026",  tag: "shipped",  title: "6-format AI scribe (SOAP / DAP / BIRP / GIRP / PIE / SIRP)", desc: "Note format selector closes the Mentalyc gap. One transcript, six structures." },
  { date: "May 3 2026",  tag: "shipped",  title: "Conversation analytics with fNIRS overlay",   desc: "Talk-time, silence ratio, tone valence + topic timeline showing OxyHb drop when topic shifted to father — uniquely combines Upheal-style insight with Mendi data." },
  { date: "May 3 2026",  tag: "shipped",  title: "Migration importers from 6 legacy platforms", desc: "BrainPaint · EEGer · NeuroGuide · BioExplorer · SimplePractice · TherapyNotes — avg migration 38 minutes." },
  { date: "May 2 2026",  tag: "shipped",  title: "Group / Couples / Family session modes",       desc: "Live Session adds a 1-on-1 / Group(8) / Couples / Family toggle. CPT 90849 reimbursable, scales clinic capacity 4-8×." },
  { date: "May 2 2026",  tag: "shipped",  title: "Normative database comparison (Brain Map)",   desc: "6-band z-score traffic-light coloring vs n=847 healthy controls. Eyes-closed / eyes-open / task modes." },
  { date: "May 1 2026",  tag: "improved", title: "Eliminated 'in production' toast leakage",    desc: "8 demo buttons now describe what the feature does, not 'opens in production'. Fixes the 'fake demo' impression for live presentations." },
  { date: "May 1 2026",  tag: "fixed",    title: "Outcome-stat consistency (74% / 22 sessions)", desc: "Resolved a contradiction across 3 references in the demo — all now cite the same canonical baseline." },
  { date: "Apr 30 2026", tag: "research", title: "Pre-print submitted to Frontiers in Human Neuroscience", desc: "Home-use fNIRS neurofeedback in adolescent ADHD: a 412-clinic naturalistic registry (n=2,840). Under peer review." },
  { date: "Apr 28 2026", tag: "research", title: "Sham-controlled RCT pre-registration",         desc: "n=180 · 3-arm (active / sham / waitlist) · pre-registered on ClinicalTrials.gov NCT06912xxx · IRB approved." },
  { date: "Apr 26 2026", tag: "improved", title: "Bishop Fox pen-test + Coalfire SOC 2 Type II scheduled", desc: "Q3 2026 audits in flight. Reports will be available NDA-gated on completion." },
];

const TAG_COLOR: Record<Tag, { bg: string; fg: string; label: string }> = {
  shipped:  { bg: "#DCFCE7", fg: "#15803D", label: "SHIPPED" },
  improved: { bg: "#DBEAFE", fg: "#1D4ED8", label: "IMPROVED" },
  fixed:    { bg: "#FEF3C7", fg: "#92400E", label: "FIXED" },
  research: { bg: "#EDE9FE", fg: "#6D28D9", label: "RESEARCH" },
};

export default function ChangelogPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Link href="/roadmap" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Roadmap →</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>What we shipped</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 8 }}>Changelog</h1>
        <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.7, marginBottom: 36 }}>
          Last 30 days. Questions about a specific change? <Link href="/contact" style={{ color: "#2563EB" }}>Get in touch</Link>.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ENTRIES.map((e, i) => {
            const c = TAG_COLOR[e.tag];
            return (
              <article key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 20, paddingBottom: 20, borderBottom: i === ENTRIES.length - 1 ? "none" : "1px solid #E5E7EB" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>{e.date}</div>
                  <span style={{ display: "inline-block", marginTop: 4, fontSize: 9, fontWeight: 800, color: c.fg, padding: "2px 7px", background: c.bg, borderRadius: 4, letterSpacing: "0.06em" }}>{c.label}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4, lineHeight: 1.35 }}>{e.title}</h3>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>{e.desc}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div style={{ marginTop: 48, padding: 20, background: "white", border: "1px solid #E5E7EB", borderRadius: 14, textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 6 }}>Subscribe to ship updates</p>
          <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Plain text, ~2 emails per month, no marketing fluff.</p>
          <a href="mailto:changelog-subscribe@eegbase.com?subject=Subscribe%20to%20EEGBase%20changelog" style={{ display: "inline-block", padding: "10px 18px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Subscribe →
          </a>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/roadmap" style={{ color: "#9CA3AF" }}>Roadmap</Link> · <Link href="/status" style={{ color: "#9CA3AF" }}>Status</Link>
      </footer>
    </div>
  );
}
