import Link from "next/link";
import { RoadmapVoteButton } from "@/components/RoadmapVoteButton";

export const metadata = {
  title: "Roadmap · EEGBase",
  description: "What's shipping next on the EEGBase platform.",
};

type Status = "now" | "next" | "planned" | "future";

const QUARTERS: { quarter: string; label: Status; items: { title: string; desc: string; votes?: number }[] }[] = [
  {
    quarter: "Q2 2026",
    label: "now",
    items: [
      { title: "Sham-controlled RCT enrollment portal", desc: "Multi-clinic registry · DSMB review · public clinic-recruitment landing page", votes: 47 },
      { title: "Security audit prep",                   desc: "SOC 2 Type I scoping with Coalfire (Type II to follow); independent web pentest vendor selection in progress · target start Q3 2026", votes: 33 },
      { title: "BIDS-fNIRS validator (browser-side)",   desc: "Real-time validation against bids-validator 1.13+", votes: 18 },
      { title: "Mendi adapter (awaiting Mendi SDK)",   desc: "BLE adapter and ingestion pipeline are built; production pairing waits on Mendi releasing public SDK access", votes: 22 },
    ],
  },
  {
    quarter: "Q3 2026",
    label: "next",
    items: [
      { title: "Native iOS + Android apps",            desc: "React Native build (separate codebase from the web app, shared design tokens) · TestFlight beta · App Store + Play Store submission", votes: 124 },
      { title: "Hyperscanning (multi-headset)",        desc: "Dyadic + 4-person group studies · ms-precision LSL alignment", votes: 41 },
      { title: "Apple Watch HRV native",               desc: "WatchOS app · pairs with EEGBase session in real-time", votes: 38 },
      { title: "Offline mode (PWA)",                   desc: "Run a session without internet · sync when connection returns", votes: 27 },
      { title: "Spanish + French + German + Dutch i18n", desc: "Full UI translation across the four EU launch languages · client-facing portal first, then clinician-facing", votes: 31 },
    ],
  },
  {
    quarter: "Q4 2026",
    label: "planned",
    items: [
      { title: "SMART-on-FHIR app launcher (read)",    desc: "Single-EHR pilot first — Epic launch sequence; Athena / eClinicalWorks to follow once the pilot is live", votes: 89 },
      { title: "EU clinic onboarding waves",            desc: "Frankfurt region · using the four EU languages shipped in Q3", votes: 22 },
      { title: "Coaching marketplace · invite-only alpha", desc: "Mendi at-home users matched with clinicians for oversight · Stripe Connect plumbing live; public beta gated on alpha learnings", votes: 53 },
      { title: "42 CFR Part 2 SUD records",             desc: "Separate consent flow for substance-use treatment", votes: 11 },
      { title: "3D LORETA source localization",         desc: "Web-based · Three.js brain mesh · click any moment to see the estimated source", votes: 64 },
      { title: "Group therapy mode",                    desc: "2–6 participants · CPT 90849 reimbursable · screen-share protocol controls", votes: 19 },
    ],
  },
  {
    quarter: "Q1 2027",
    label: "future",
    items: [
      { title: "RCT data collection complete",          desc: "Interim analysis · target Frontiers submission Q2 2027" },
      { title: "Bidirectional FHIR R4 write-back",      desc: "Earned upgrade from the Q4 read-only launcher · scoped to one EHR initially" },
      { title: "API GA + public SDK",                    desc: "v1 stable · TypeScript and Python clients · Postman collection" },
      { title: "ONC HIT 2025 Edition cert",              desc: "Apply for federal HIT certification through CHPL" },
      { title: "AI co-author for clinic write-ups",      desc: "From session data → drafted clinical case study; the clinician reviews, edits, and submits" },
    ],
  },
];

const COLOR: Record<Status, { bg: string; fg: string; ring: string }> = {
  now:     { bg: "#DCFCE7", fg: "#15803D", ring: "#10B981" },
  next:    { bg: "#DBEAFE", fg: "#1D4ED8", ring: "#3B82F6" },
  planned: { bg: "#EDE9FE", fg: "#6D28D9", ring: "#A78BFA" },
  future:  { bg: "#FEF3C7", fg: "#92400E", ring: "#F59E0B" },
};

export default function RoadmapPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
            <Link href="/status" style={{ color: "#6B7280", textDecoration: "none" }}>Status →</Link>
          </div>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <style>{`
          .roadmap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          @media (max-width: 720px) {
            .roadmap-grid { grid-template-columns: 1fr; }
          }
        `}</style>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Public roadmap · updated weekly</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>What ships next</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          What we're shipping next, organised by quarter. Vote counts shown are pre-launch placeholders until the public account flow is live — real votes will come from clinicians once they sign up.
        </p>

        <div className="roadmap-grid">
          {QUARTERS.map((q) => {
            const c = COLOR[q.label];
            return (
              <section key={q.quarter} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: c.fg, padding: "3px 9px", background: c.bg, borderRadius: 99, letterSpacing: "0.08em", textTransform: "uppercase" }}>{q.label}</span>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>{q.quarter}</h2>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  {q.items.map((item) => (
                    <li key={item.title} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start", paddingBottom: 12, borderBottom: "1px solid #F3F4F6" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.55 }}>{item.desc}</div>
                      </div>
                      {item.votes !== undefined && (
                        <RoadmapVoteButton id={`${q.quarter}::${item.title}`} initial={item.votes} color={c.ring} />
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div style={{ marginTop: 36, background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Have a request?</h2>
          <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 16, maxWidth: 480, margin: "0 auto 16px" }}>
            We read every email. If multiple clinicians ask for the same thing, it moves up the queue.
          </p>
          <a href="mailto:hello@eegbase.com?subject=Roadmap%20request" style={{ display: "inline-block", padding: "10px 18px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Email a request →
          </a>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/status" style={{ color: "#9CA3AF" }}>Status</Link>
      </footer>
    </div>
  );
}
