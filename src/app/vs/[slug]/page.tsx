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
    pricing: "SimplePractice ~$99/clinician/mo · EEGBase $349/clinic/mo (5 clinicians) or $19/session",
    rows: [
      { feature: "Real-time fNIRS / EEG signal capture", us: true,  them: false },
      { feature: "AI cross-session pattern detector",     us: true,  them: false },
      { feature: "Ambient SOAP scribe (6 formats)",       us: true,  them: false },
      { feature: "CMS-1500 + ERA + ICD-10",                us: true,  them: true },
      { feature: "HIPAA video co-feedback",                us: true,  them: false, sub: "Theirs is video-only, no signal overlay" },
      { feature: "Group + couples + family modes",         us: true,  them: true,  sub: "Comparable" },
      { feature: "Open-source · self-hostable",           us: true,  them: false },
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
    pricing: "TherapyNotes $69+/clinician/mo · EEGBase $349/clinic/mo flat",
    rows: [
      { feature: "Real-time fNIRS / EEG signal capture", us: true,  them: false },
      { feature: "ONC HIT 2025 Edition certification",   us: false, them: true,  sub: "Their advantage; we're targeting Q1 2027" },
      { feature: "Mature insurance integrations",         us: true,  them: true,  sub: "Both solid — their edge cases cover years of payer quirks" },
      { feature: "ICD-10 auto-suggest from session",      us: true,  them: false },
      { feature: "AI cross-session pattern detector",     us: true,  them: false },
      { feature: "Ambient SOAP scribe (6 formats)",       us: true,  them: false },
      { feature: "Open-source · self-hostable",           us: true,  them: false },
      { feature: "BIDS / SNIRF / EDF+ export",            us: true,  them: false },
      { feature: "EPCS / PDMP for psychiatrists",         us: false, them: true,  sub: "We're targeting Q4 2026 via DrFirst" },
    ],
    closing: "TherapyNotes is the strongest general-EHR competitor, especially for psychiatrist practices using EPCS today. EEGBase wins for any practice where neurofeedback signal capture is core — they have zero of that.",
  },
  {
    slug: "myndlift",
    name: "Myndlift",
    cat: "Muse-only home neurofeedback platform",
    pricing: "Myndlift $199 kit + $29-150/mo coaching · EEGBase $349/clinic/mo flat (or $19/session)",
    rows: [
      { feature: "Hardware-agnostic (any BLE)",           us: true,  them: false, sub: "Theirs is Muse-only" },
      { feature: "Native Mendi fNIRS support",             us: true,  them: false },
      { feature: "AI cross-session pattern detector",     us: true,  them: false },
      { feature: "Open-source · self-hostable",           us: true,  them: false },
      { feature: "BIDS / SNIRF / EDF+ export",            us: true,  them: false },
      { feature: "Coaching marketplace",                  us: true,  them: true,  sub: "Theirs is more mature today" },
      { feature: "qEEG brain mapping",                    us: true,  them: true,  sub: "Comparable" },
      { feature: "Native iOS + Android client app",       us: false, them: true,  sub: "Their advantage; we ship Q3 2026" },
      { feature: "Insurance billing + claims",             us: true,  them: false, sub: "They don't bill" },
      { feature: "Existing clinician base",               us: false, them: true,  sub: "10k+ vs our private beta" },
    ],
    closing: "Myndlift is our nearest competitor. Their advantage: mature consumer mobile app + an established Muse-clinician network. Our advantage: hardware-agnostic with native Mendi, full EHR + billing, open-source no lock-in, and the cross-session AI pattern detector nobody else ships.",
  },
  {
    slug: "brainmaster",
    name: "BrainMaster · Discovery / Atlantis",
    cat: "Legacy clinical neurofeedback hardware + Windows software",
    pricing: "Discovery $2.5k+ hardware + $1.5k+ software · EEGBase $349/clinic/mo OR free MIT self-host",
    rows: [
      { feature: "Cloud-native · web-based",              us: true,  them: false, sub: "Theirs is Windows installed" },
      { feature: "Hardware-agnostic",                      us: true,  them: false, sub: "Theirs is BrainMaster-only" },
      { feature: "Modern UX (2026 standards)",            us: true,  them: false },
      { feature: "AI scribe + cross-session patterns",     us: true,  them: false },
      { feature: "BIDS / SNIRF / EDF+ open export",       us: true,  them: "partial" },
      { feature: "Open-source · MIT",                     us: true,  them: false },
      { feature: "Established protocol library",           us: true,  them: true,  sub: "Both have them" },
      { feature: "Long-tenured clinical credibility",     us: false, them: true,  sub: "Their 25-year head start" },
    ],
    closing: "BrainMaster is the legacy stalwart. If you've been running their Discovery for 10 years, the switching cost is real. Our migration importer handles their .ngu/.ncf files in ~38 minutes.",
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
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
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
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}

function Mark({ v }: { v: boolean | "partial" }) {
  if (v === true)  return <span style={{ color: "#10B981", fontSize: 18, fontWeight: 800 }}>✓</span>;
  if (v === "partial") return <span style={{ color: "#F59E0B", fontSize: 14, fontWeight: 800 }}>~</span>;
  return <span style={{ color: "#CBD5E1", fontSize: 14 }}>—</span>;
}
