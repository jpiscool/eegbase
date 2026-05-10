import Link from "next/link";
import { notFound } from "next/navigation";

type Comp = {
  slug: string;
  name: string;
  cat: string;
  pricing: string;
  rows: { feature: string; us: boolean; them: boolean | "partial"; sub?: string }[];
  closing: string;
};

const COMPARISONS: Comp[] = [
  {
    slug: "simplepractice",
    name: "SimplePractice",
    cat: "General mental-health EHR",
    pricing: "SimplePractice is paid SaaS · EEGBase is free for licensed clinicians",
    rows: [
      { feature: "Real-time fNIRS / EEG signal capture", us: true,  them: false },
      { feature: "AI cross-session pattern detector",     us: true,  them: false },
      { feature: "Ambient SOAP scribe (6 formats)",       us: true,  them: false },
      { feature: "CMS-1500 + ERA + ICD-10",                us: true,  them: true },
      { feature: "HIPAA video co-feedback",                us: true,  them: false, sub: "Theirs is video-only, no signal overlay" },
      { feature: "Group + couples + family modes",         us: true,  them: true,  sub: "Comparable" },
      { feature: "BIDS / SNIRF / EDF+ export",            us: true,  them: false },
      { feature: "ONC HIT certification",                  us: false, them: false, sub: "Both not yet · we target Q1 2027" },
      { feature: "Existing clinician base (millions)",    us: false, them: true,  sub: "Their advantage today" },
    ],
    closing: "If your practice is mostly talk-therapy and doesn't capture neurofeedback signals, SimplePractice is fine. If you do neurofeedback, EEGBase replaces SimplePractice + your streaming software in one app.",
  },
  {
    slug: "therapynotes",
    name: "TherapyNotes",
    cat: "General mental-health EHR · ONC-certified",
    pricing: "TherapyNotes is paid SaaS · EEGBase is free for licensed clinicians",
    rows: [
      { feature: "Real-time fNIRS / EEG signal capture", us: true,  them: false },
      { feature: "ONC HIT 2025 Edition certification",   us: false, them: true,  sub: "Their advantage; we're targeting Q1 2027" },
      { feature: "Mature insurance integrations",         us: true,  them: true,  sub: "Both solid — their edge cases cover years of payer quirks" },
      { feature: "ICD-10 auto-suggest from session",      us: true,  them: false },
      { feature: "AI cross-session pattern detector",     us: true,  them: false },
      { feature: "Ambient SOAP scribe (6 formats)",       us: true,  them: false },
      { feature: "BIDS / SNIRF / EDF+ export",            us: true,  them: false },
      { feature: "EPCS / PDMP for psychiatrists",         us: false, them: true,  sub: "We're targeting Q4 2026 via DrFirst" },
    ],
    closing: "TherapyNotes is the strongest general-EHR competitor, especially for psychiatrist practices using EPCS today. EEGBase wins for any practice where neurofeedback signal capture is core — they have zero of that.",
  },
  {
    slug: "myndlift",
    name: "Myndlift",
    cat: "Muse-only home neurofeedback platform",
    pricing: "Myndlift is paid coaching SaaS + hardware kit · EEGBase is free for licensed clinicians",
    rows: [
      { feature: "Hardware-agnostic (any BLE)",           us: true,  them: false, sub: "Theirs is Muse-only" },
      { feature: "Native Mendi fNIRS support",             us: true,  them: false },
      { feature: "AI cross-session pattern detector",     us: true,  them: false },
      { feature: "BIDS / SNIRF / EDF+ export",            us: true,  them: false },
      { feature: "Coaching marketplace",                  us: true,  them: true,  sub: "Theirs is more mature today" },
      { feature: "qEEG brain mapping",                    us: true,  them: true,  sub: "Comparable" },
      { feature: "Native iOS + Android client app",       us: false, them: true,  sub: "Their advantage; we ship Q3 2026" },
      { feature: "Insurance billing + claims",             us: true,  them: false, sub: "They don't bill" },
      { feature: "Existing clinician base",               us: false, them: true,  sub: "10k+ vs our private beta" },
    ],
    closing: "Myndlift is our nearest competitor. Their advantage: mature consumer mobile app + an established Muse-clinician network. Our advantage: hardware-agnostic with native Mendi, full EHR + billing, BIDS exports for zero lock-in, and the cross-session AI pattern detector nobody else ships.",
  },
  {
    slug: "brainmaster",
    name: "BrainMaster · Discovery / Atlantis",
    cat: "Legacy clinical neurofeedback hardware + Windows software",
    pricing: "Discovery is hardware + paid software · EEGBase is free for licensed clinicians",
    rows: [
      { feature: "Cloud-native · web-based",              us: true,  them: false, sub: "Theirs is Windows installed" },
      { feature: "Hardware-agnostic",                      us: true,  them: false, sub: "Theirs is BrainMaster-only" },
      { feature: "Modern UX (2026 standards)",            us: true,  them: false },
      { feature: "AI scribe + cross-session patterns",     us: true,  them: false },
      { feature: "BIDS / SNIRF / EDF+ open export",       us: true,  them: "partial" },
      { feature: "Established protocol library",           us: true,  them: true,  sub: "Both have them" },
      { feature: "Long-tenured clinical credibility",     us: false, them: true,  sub: "Their 25-year head start" },
    ],
    closing: "BrainMaster is the legacy stalwart. If you've been running their Discovery for 10 years, the switching cost is real. Our migration importer handles their .ngu/.ncf files in ~38 minutes.",
  },
  {
    slug: "cygnet",
    name: "Cygnet · BEE Medic",
    cat: "Z-score-focused clinical neurofeedback platform · Windows",
    pricing: "Cygnet is paid subscription · EEGBase is free for licensed clinicians",
    rows: [
      { feature: "Cloud-native",                          us: true,  them: false, sub: "Cygnet is Windows-only" },
      { feature: "Z-score training",                      us: true,  them: true,  sub: "Both support · their depth is greater today" },
      { feature: "Hardware-agnostic",                      us: true,  them: false, sub: "Cygnet ties to BEE Medic hardware" },
      { feature: "AI cross-session pattern detector",     us: true,  them: false },
      { feature: "Insurance billing built-in",             us: true,  them: false, sub: "Cygnet relies on external EHR" },
      { feature: "Established z-score evidence base",     us: false, them: true,  sub: "Their advantage today" },
      { feature: "Mendi fNIRS support",                   us: true,  them: false },
    ],
    closing: "Cygnet's z-score implementation is excellent and deep. We match the basics today and integrate Mendi fNIRS — which they don't. If z-score depth is your only criterion, stay on Cygnet. If you need the consumer-hardware channel, switch.",
  },
  {
    slug: "bioexplorer",
    name: "BioExplorer",
    cat: "Open-design legacy biofeedback designer · Windows",
    pricing: "BioExplorer is a paid perpetual licence · EEGBase is free for licensed clinicians",
    rows: [
      { feature: "Cloud-native · web-based",              us: true,  them: false },
      { feature: "Visual protocol designer",              us: true,  them: true,  sub: "Their advantage — the designer is excellent" },
      { feature: "AI scribe · SOAP automation",            us: true,  them: false },
      { feature: "EHR + claims bundled",                  us: true,  them: false },
      { feature: "Hardware-agnostic",                      us: true,  them: true,  sub: "Comparable" },
      { feature: "Custom-protocol depth",                  us: false, them: true,  sub: "Their open-design approach has 20-year head start" },
      { feature: "BIDS / SNIRF export",                   us: true,  them: false },
    ],
    closing: "BioExplorer is the power-user's tool — its visual protocol designer is unmatched today for completely custom protocols. EEGBase wins on workflow integration, but if you live in your protocol designer, BioExplorer keeps its niche. We support their .ncb files via importer.",
  },
  {
    slug: "neuroguide",
    name: "NeuroGuide",
    cat: "qEEG + LORETA gold standard · Windows desktop",
    pricing: "NeuroGuide is a paid perpetual licence · EEGBase is free for licensed clinicians",
    rows: [
      { feature: "Cloud-native",                          us: true,  them: false },
      { feature: "qEEG with normative database",          us: true,  them: true,  sub: "NeuroGuide's normative database is the field standard" },
      { feature: "3D LORETA source localization",         us: false, them: true,  sub: "Their gold-standard feature; we ship Q4 2026" },
      { feature: "AI scribe · cross-session AI",          us: true,  them: false },
      { feature: "Insurance billing built-in",             us: true,  them: false },
      { feature: "Long-tenured clinical credibility",     us: false, them: true,  sub: "Their 30-year reputation" },
      { feature: "Mendi fNIRS support",                   us: true,  them: false },
    ],
    closing: "NeuroGuide is the LORETA gold standard. If 3D source localization is your daily workflow, you stay there until our Q4 2026 LORETA ships — and even then they'll keep the depth advantage. EEGBase wins on workflow + Mendi support. Our migration importer reads their .nguide files.",
  },
  {
    slug: "divergence-neuro",
    name: "Divergence Neuro",
    cat: "Modern cloud-based multi-vendor neurofeedback platform",
    pricing: "Divergence is paid SaaS · EEGBase is free for licensed clinicians",
    rows: [
      { feature: "Cloud-native",                          us: true,  them: true,  sub: "Both" },
      { feature: "Hardware-agnostic",                      us: true,  them: true,  sub: "Both — but they treat all vendors equally" },
      { feature: "Mendi flagship / preferred status",     us: true,  them: false, sub: "We can offer Mendi flagship; Divergence keeps multi-vendor parity" },
      { feature: "AI cross-session pattern detector",     us: true,  them: false },
      { feature: "BIDS / SNIRF / EDF+ open export",       us: true,  them: "partial" },
      { feature: "Mature product · existing clinic base", us: false, them: true,  sub: "Their advantage today" },
    ],
    closing: "Divergence is our nearest cloud peer. Their structural choice — multi-vendor parity — means Mendi gets equal weight with BrainBit and Muse. We can offer Mendi flagship/preferred status plus a bundled AI scribe and EHR layer, which Divergence isn't.",
  },
];

export async function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = COMPARISONS.find((x) => x.slug === slug);
  if (!c) return { title: "Not found · EEGBase" };
  return {
    title: `EEGBase vs ${c.name} · EEGBase`,
    description: `Honest side-by-side: where EEGBase wins, where ${c.name} wins. ${c.cat}.`,
  };
}

export default async function VsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = COMPARISONS.find((x) => x.slug === slug);
  if (!c) return notFound();

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/vs" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>All comparisons →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Comparison</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 8 }}>EEGBase vs {c.name}</h1>
        <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 14 }}>{c.cat}</p>
        <p style={{ fontSize: 14, color: "#374151", marginBottom: 28, lineHeight: 1.7 }}>{c.pricing}</p>

        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 14, fontSize: 12, fontWeight: 800, color: "#475569", borderBottom: "1px solid #E5E7EB" }}>Capability</th>
              <th style={{ padding: 14, fontSize: 12, fontWeight: 800, color: "#2563EB", borderBottom: "1px solid #E5E7EB", width: 110 }}>EEGBase</th>
              <th style={{ padding: 14, fontSize: 12, fontWeight: 800, color: "#475569", borderBottom: "1px solid #E5E7EB", width: 110 }}>{c.name}</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r, i) => (
              <tr key={r.feature} style={{ borderTop: i === 0 ? "none" : "1px solid #F3F4F6" }}>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "#0F172A" }}>
                  {r.feature}
                  {r.sub && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{r.sub}</div>}
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}><Mark v={r.us} /></td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}><Mark v={r.them} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <section style={{ background: "linear-gradient(135deg, #ECFEFF, #EFF6FF)", border: "1px solid #BFDBFE", borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#1D4ED8", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>Honest take</p>
          <p style={{ fontSize: 14, color: "#0F172A", lineHeight: 1.7 }}>{c.closing}</p>
        </section>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/demo" style={{ padding: "10px 18px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Try the live demo →</Link>
          <Link href="/#pricing" style={{ padding: "10px 18px", background: "transparent", color: "#2563EB", border: "1px solid #2563EB", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>See pricing</Link>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}

function Mark({ v }: { v: boolean | "partial" }) {
  if (v === true)  return <span style={{ color: "#10B981", fontSize: 18, fontWeight: 800 }}>✓</span>;
  if (v === "partial") return <span style={{ color: "#F59E0B", fontSize: 14, fontWeight: 800 }}>~</span>;
  return <span style={{ color: "#CBD5E1", fontSize: 14 }}>—</span>;
}
