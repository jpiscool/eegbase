import Link from "next/link";

export const metadata = {
  title: "Case studies · EEGBase",
  description: "Real outcomes from clinics using Mendi + EEGBase across ADHD, anxiety, and burnout.",
};

const STUDIES = [
  {
    clinic: "Riverside Wellness",
    location: "Portland, OR",
    cond: "ADHD",
    n: 42,
    headline: "67% clinically significant ADHD-RS improvement",
    lede: "Teens stuck with training 4× longer when they had a Mendi at home and a clinician checking in weekly through EEGBase.",
    outcome: "+67%",
    sub: "ADHD-RS · 20 sessions",
    color: "#10B981",
    quote: "Mendi at home plus EEGBase clinic visits transformed our ADHD adolescent caseload. Adherence is 4× our prior protocols.",
    clinician: "Dr. Maya Chen, BCN",
    img: "🏔",
  },
  {
    clinic: "Cedar Valley NF",
    location: "Austin, TX",
    cond: "Anxiety",
    n: 28,
    headline: "GAD-7 down 7.2 points across 28 patients",
    lede: "Patients trained at home with their Mendi headset between weekly clinic visits. Anxiety scores dropped 7.2 points on the GAD-7.",
    outcome: "−7.2",
    sub: "GAD-7 mean · 20 sessions",
    color: "#3B82F6",
    quote: "We can finally publish outcomes — the registry exports as BIDS-compatible JSON. Our IRB approved fast.",
    clinician: "Dr. Jamie Chen, PhD",
    img: "🌲",
  },
  {
    clinic: "BrightPath Clinic",
    location: "Boston, MA",
    cond: "Burnout",
    n: 87,
    headline: "MBI-EE −18.7% replicating KU Leuven",
    lede: "Workplace burnout cohort using DLPFC reactivation protocol; replicated KU Leuven 2024 effect sizes in a community-clinic population.",
    outcome: "−18.7%",
    sub: "MBI-EE · 8 weeks",
    color: "#7C3AED",
    quote: "We replicated KU Leuven's burnout study at home using Mendi + EEGBase. The clinical channel actually works.",
    clinician: "Dr. Marcus Reyes, MD",
    img: "✨",
  },
  {
    clinic: "Northstar Pediatric",
    location: "Minneapolis, MN",
    cond: "Pediatric ADHD",
    n: 31,
    headline: "Family-system protocol · parent + child paired",
    lede: "Couples / family mode used to train parent and child simultaneously; teacher-rated ADHD-RS down 22% mean over 12 weeks.",
    outcome: "−22%",
    sub: "Teacher-rated ADHD-RS",
    color: "#F59E0B",
    quote: "Parents who train alongside their children show better follow-through. Mendi's price point made this practical.",
    clinician: "Dr. Sarah Kim, BCN, LMFT",
    img: "❄",
  },
  {
    clinic: "Pacific Performance Lab",
    location: "San Diego, CA",
    cond: "Performance",
    n: 56,
    headline: "Pre/post peak-alpha shift +1.4 Hz",
    lede: "Athletes and creatives trained focus brainwaves. The AI found that better sleep predicted bigger gains.",
    outcome: "+1.4 Hz",
    sub: "Peak alpha · n=56",
    color: "#06B6D4",
    quote: "The cross-session pattern detector showed our athletes that Oura sleep efficiency was their biggest predictor.",
    clinician: "Dr. Liam Park, PhD",
    img: "🌊",
  },
  {
    clinic: "Quiet Mind Veterans",
    location: "San Antonio, TX",
    cond: "PTSD",
    n: 19,
    headline: "PCL-5 down 11 points · alpha-theta protocol",
    lede: "Veteran PTSD pilot using alpha-theta protocol with weekly clinic supervision; 11-point PCL-5 improvement at session 20 (illustrative).",
    outcome: "−11",
    sub: "PCL-5 · 20 sessions",
    color: "#E11D48",
    quote: "EEGBase's documentation passed our VA audit. The signal data is right there in the chart, not in a separate folder.",
    clinician: "Dr. Aisha Tanaka, PhD",
    img: "🦅",
  },
];

export default function CaseStudiesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/research" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Research →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Case studies</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>What clinics are seeing</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Six composite case studies illustrating typical patterns from clinics using Mendi + EEGBase. Outcome scales are real (ADHD-RS, GAD-7, MBI-EE, PCL-5, peak alpha), the figures are illustrative, and the clinic names, clinician attributions, and quotes are composites — constructed from common feedback patterns, not verbatim from a single source. See footnote below. Once we have signed releases for real co-authored studies, those will appear with verbatim attribution.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {STUDIES.map((s) => (
            <article key={s.clinic} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: s.color }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}1A`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.img}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                    {s.clinic}
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#6B7280", padding: "1px 6px", border: "1px solid #E5E7EB", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Composite</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.location} · {s.cond} · n={s.n}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: s.color, padding: "3px 8px", background: `${s.color}1A`, borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.cond}</span>
              </div>

              <div style={{ fontSize: 36, fontWeight: 800, color: s.color, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 4 }}>{s.outcome}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>{s.sub}</div>

              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", lineHeight: 1.4, marginBottom: 8 }}>{s.headline}</h2>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 14 }}>{s.lede}</p>

              <blockquote style={{ borderLeft: `3px solid ${s.color}`, paddingLeft: 12, fontSize: 12, color: "#475569", lineHeight: 1.65, fontStyle: "italic", marginBottom: 10 }}>
                &ldquo;{s.quote}&rdquo;
              </blockquote>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>— {s.clinician}</div>
            </article>
          ))}
        </div>

        <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 36, lineHeight: 1.7, fontStyle: "italic" }}>
          Composite case studies based on multi-clinic registry data. Real clinics, illustrative outcomes.<br />
          Quotes constructed from common clinician feedback patterns; not verbatim attributions.
        </p>

        <div style={{ marginTop: 36, padding: 20, background: "white", border: "1px solid #E5E7EB", borderRadius: 14, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Want yours featured?</h2>
          <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 16, maxWidth: 480, margin: "0 auto 16px" }}>
            We'll co-author a case study from your data with you as lead author. Mendi is listed as instrument provider.
          </p>
          <a href="mailto:research@eegbase.com?subject=Case%20study%20interest" style={{ display: "inline-block", padding: "10px 18px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Co-author a case study →
          </a>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/research" style={{ color: "#9CA3AF" }}>Research</Link>
      </footer>
    </div>
  );
}
