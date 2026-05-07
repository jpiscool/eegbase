import Link from "next/link";

export const metadata = {
  title: "Getting started · EEGBase docs",
  description: "From signup to first session in under 30 minutes.",
};

const STEPS = [
  { num: "01", title: "Sign up", body: "Visit /signup. 4 steps · ~90 seconds. No card required, 30-day free trial." },
  { num: "02", title: "Pair your hardware", body: "Mendi · Muse · Polar · OpenBCI. Open the demo, click 'Pair Mendi headset'. Real BLE pairing flow ships with the trial — uses Web Bluetooth, no native installer needed." },
  { num: "03", title: "Add your first client", body: "Settings → Clients → New. Capture intake (PHQ-9, GAD-7, custom scales). Optional: send the pre-session check-in form via SMS or email — uses the same workflow as Mendi consumer onboarding." },
  { num: "04", title: "Start a session", body: "Live Session tab → 'Pair Mendi headset' or 'Start with simulator'. The reward score updates every 100ms. Ambient SOAP scribe runs in the background if you grant audio permission." },
  { num: "05", title: "Generate the SOAP note", body: "After the session, the AI scribe drafts in your chosen format (SOAP / DAP / BIRP / GIRP / PIE / SIRP). Approve before saving — you can edit any field. Auto-suggests CPT 90901 + ICD-10 from session content." },
  { num: "06", title: "Submit the claim", body: "Billing & Claims tab → 'Generate superbill'. Pre-fills CMS-1500 + 837P. Submit via Stedi or Office Ally with one click. ERA auto-posts back when payer pays." },
  { num: "07", title: "Share progress", body: "Reports tab → 'One-click PDF report'. Branded with your clinic logo. Email to client + referring physician. No-account share-link option for family members." },
];

export default function GettingStartedPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/docs" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase Docs</span>
          </Link>
          <Link href="/docs" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>← All docs</Link>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Docs · Getting started</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>From signup to first session in 30 minutes</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 28 }}>
          The fastest path to a working clinical session with EEGBase. Skip ahead to any step.
        </p>

        {/* Quick links */}
        <nav aria-label="Section index" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28, padding: 14, background: "white", border: "1px solid #E5E7EB", borderRadius: 12 }}>
          {STEPS.map((s) => (
            <a key={s.num} href={`#step-${s.num}`} style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", background: "#F1F5F9", color: "#475569", borderRadius: 6, textDecoration: "none" }}>{s.num} {s.title}</a>
          ))}
        </nav>

        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          {STEPS.map((s) => (
            <li key={s.num} id={`step-${s.num}`} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24, scrollMarginTop: 80 }}>
              <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", letterSpacing: "-0.02em", flexShrink: 0 }}>{s.num}</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>{s.title}</h2>
              </div>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>{s.body}</p>
            </li>
          ))}
        </ol>

        <section style={{ background: "linear-gradient(135deg, #ECFEFF, #EFF6FF)", border: "1px solid #BFDBFE", borderRadius: 14, padding: 24, marginTop: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Ready to do it for real?</h2>
          <p style={{ fontSize: 13, color: "#1D4ED8", lineHeight: 1.6, marginBottom: 14 }}>
            Try the live demo first · 30-day free trial when you&apos;re ready.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/demo" style={{ padding: "10px 18px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Open demo →</Link>
            <Link href="/signup" style={{ padding: "10px 18px", background: "white", color: "#2563EB", border: "1px solid #2563EB", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Start trial</Link>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/docs" style={{ color: "#9CA3AF" }}>Docs</Link> · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
