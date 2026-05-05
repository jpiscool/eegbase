import Link from "next/link";

export const metadata = {
  title: "EEGBase × Mendi — Clinical Partnership",
  description:
    "The clinical layer Mendi has been waiting for. EEGBase gives licensed neurofeedback clinicians the dashboard, analytics, and reporting tools the Mendi app can't provide.",
};

const violet = "#7C3AED";
const violetLight = "#EDE9FE";
const violetBorder = "#C4B5FD";
const blue = "#2563EB";
const blueLight = "#EFF6FF";

export default function MendiPartnershipPage() {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#FAFAFA", minHeight: "100vh", color: "#111" }}>

      {/* Nav */}
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: blue, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/#features" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>
              For Clinicians
            </Link>
            <Link
              href="/demo"
              style={{
                fontSize: 14, fontWeight: 600, padding: "8px 16px",
                background: violet, color: "#fff", borderRadius: 8,
                textDecoration: "none", display: "inline-block",
              }}
            >
              View Demo →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, #1E1B4B 0%, #2D1B69 50%, #3B0764 100%)`, color: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.1)", borderRadius: 999,
            padding: "6px 14px", fontSize: 12, fontWeight: 600,
            color: "#DDD6FE", marginBottom: 24, border: "1px solid rgba(196,181,253,0.3)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA" }} />
            Partnership Proposal — May 2026
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20 }}>
            The clinical layer<br />
            <span style={{ color: "#A78BFA" }}>Mendi has been waiting for</span>
          </h1>
          <p style={{ fontSize: 18, color: "#C4B5FD", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 32px" }}>
            Mendi&apos;s headband is exceptional consumer hardware. But licensed neurofeedback clinicians need more than a progress graph — they need clinical oversight, session documentation, and outcome reporting. That&apos;s EEGBase.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/demo"
              style={{
                padding: "12px 24px", background: violet, color: "#fff",
                borderRadius: 12, fontSize: 14, fontWeight: 700,
                textDecoration: "none", display: "inline-block",
              }}
            >
              See the clinical dashboard →
            </Link>
            <a
              href="mailto:hello@eegbase.com"
              style={{
                padding: "12px 24px", background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
                borderRadius: 12, fontSize: 14, fontWeight: 500,
                textDecoration: "none", display: "inline-block",
              }}
            >
              Contact us
            </a>
          </div>
        </div>
      </section>

      {/* Section 1: What clinicians need */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: violet, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              The gap
            </p>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111", marginBottom: 16, lineHeight: 1.2 }}>
              What clinicians need that the Mendi app doesn&apos;t provide
            </h2>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7 }}>
              The Mendi app is designed for consumers. Clinicians who prescribe or supervise Mendi-based neurofeedback sessions are flying blind — no caseload view, no documentation, no clinical accountability.
            </p>
          </div>
          <div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "🗂️", text: "A single dashboard showing all clients and their session histories" },
                { icon: "📊", text: "Bilateral OxyHb/DeoxyHb analysis — not just a single reward score" },
                { icon: "📋", text: "Pre/post questionnaire deltas (GAD-7, focus, mood, anxiety, energy)" },
                { icon: "📝", text: "SOAP clinical notes and session-level annotations" },
                { icon: "🤖", text: "AI-generated clinical summaries for documentation efficiency" },
                { icon: "📤", text: "Shareable progress reports for clients, families, and referrers" },
                { icon: "🏥", text: "Billing codes, scheduling, and outcome measure tracking" },
                { icon: "💾", text: "EDF+ / CSV / PDF export for research and insurance" },
                { icon: "🔒", text: "HIPAA-friendly self-hosted architecture — no third-party data access" },
              ].map(({ icon, text }) => (
                <li key={text} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  background: "#fff", border: "1px solid #E5E7EB",
                  borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#374151",
                }}>
                  <span style={{ fontSize: 16, lineHeight: 1, marginTop: 1 }}>{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: Three ways to partner */}
      <section style={{ background: "#fff", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: violet, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, textAlign: "center" }}>
            Partnership models
          </p>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111", marginBottom: 8, textAlign: "center" }}>
            Three ways to partner
          </h2>
          <p style={{ fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 48, maxWidth: 560, margin: "0 auto 48px" }}>
            From a lightweight referral arrangement to a fully white-labeled B2B product — we can structure this however creates the most value for Mendi.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              {
                num: "01",
                title: "Referral program",
                badge: "Low lift",
                badgeColor: "#059669",
                badgeBg: "#D1FAE5",
                description: "Mendi recommends EEGBase to clinicians who reach out via your \"For Professionals\" inquiry flow. EEGBase affiliates Mendi hardware purchases from our clinician onboarding. Revenue share on both sides — no engineering required.",
                bullets: [
                  "Affiliate link in Mendi Pro onboarding",
                  "EEGBase referral link to Mendi hardware",
                  "Revenue share: ~10–15%",
                  "Zero engineering required",
                ],
                accent: violet,
                accentBg: violetLight,
                accentBorder: violetBorder,
              },
              {
                num: "02",
                title: "Deep integration",
                badge: "Recommended",
                badgeColor: violet,
                badgeBg: violetLight,
                description: "Mendi cloud pushes session data to EEGBase via a lightweight REST API. Clinicians see all client sessions in one dashboard without needing to be present at the BLE connection — or even own the headband themselves.",
                bullets: [
                  "Mendi API pushes to EEGBase webhook",
                  "Clinician dashboard pulls live session data",
                  "Clients authorize data sharing in Mendi app",
                  "~1–2 weeks engineering (Mendi side)",
                ],
                accent: violet,
                accentBg: violetLight,
                accentBorder: violetBorder,
              },
              {
                num: "03",
                title: "White-label portal",
                badge: "Strategic",
                badgeColor: blue,
                badgeBg: blueLight,
                description: "EEGBase powers a \"Mendi for Clinicians\" branded dashboard. Mendi gets a B2B SaaS product and recurring revenue stream. EEGBase gets distribution to Mendi&apos;s clinician user base. Full co-brand or full white-label.",
                bullets: [
                  "Mendi-branded clinician portal",
                  "B2B SaaS revenue for Mendi",
                  "EEGBase provides ongoing development",
                  "Revenue split: negotiable",
                ],
                accent: blue,
                accentBg: blueLight,
                accentBorder: "#BFDBFE",
              },
            ].map(({ num, title, badge, badgeColor, badgeBg, description, bullets, accent, accentBg, accentBorder }) => (
              <div key={num} style={{
                border: `2px solid ${accentBorder}`,
                borderRadius: 20, background: accentBg, padding: 24,
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: accentBorder, lineHeight: 1 }}>{num}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: badgeColor, background: badgeBg,
                    border: `1px solid ${accentBorder}`, borderRadius: 999, padding: "3px 10px",
                  }}>{badge}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 12 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7, marginBottom: 16, flexGrow: 1 }}>{description}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {bullets.map((b) => (
                    <li key={b} style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Built on Mendi signals */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: violet, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, textAlign: "center" }}>
          Signal architecture
        </p>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111", marginBottom: 8, textAlign: "center" }}>
          Built on Mendi signals
        </h2>
        <p style={{ fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 48, maxWidth: 520, margin: "0 auto 48px" }}>
          EEGBase already understands every signal Mendi broadcasts. Here&apos;s what each one tells clinicians.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {[
            {
              label: "OxyHb Left",
              code: "PFC-L",
              description: "Oxygenated hemoglobin in the left prefrontal cortex. Rises with focused attention and working memory load. Key indicator for ADHD protocols.",
              color: "#DC2626",
              bg: "#FEF2F2",
              border: "#FECACA",
            },
            {
              label: "OxyHb Right",
              code: "PFC-R",
              description: "Right hemisphere prefrontal oxygenation. Tracks emotional regulation and sustained vigilance. Lateralization asymmetry is clinically significant.",
              color: "#EA580C",
              bg: "#FFF7ED",
              border: "#FED7AA",
            },
            {
              label: "DeoxyHb Left",
              code: "dHb-L",
              description: "Inverse oxygenation signal. Rises when oxygen is consumed — an independent marker of neural activation. Complements OxyHb for fuller hemodynamic picture.",
              color: "#7C3AED",
              bg: "#F5F3FF",
              border: "#DDD6FE",
            },
            {
              label: "DeoxyHb Right",
              code: "dHb-R",
              description: "Right hemisphere deoxygenated hemoglobin. Used in bilateral asymmetry calculations. Useful for anxiety, stress regulation, and trauma protocols.",
              color: "#6D28D9",
              bg: "#EDE9FE",
              border: "#C4B5FD",
            },
            {
              label: "Reward Score",
              code: "0–100",
              description: "Composite metric computed from OxyHb bilateral balance. Used for real-time neurofeedback. EEGBase preserves raw samples for clinical post-processing.",
              color: "#0D9488",
              bg: "#F0FDFA",
              border: "#99F6E4",
            },
          ].map(({ label, code, description, color, bg, border }) => (
            <div key={label} style={{
              background: bg, border: `1px solid ${border}`,
              borderRadius: 16, padding: 18,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                <span style={{ fontSize: 10, color, background: "white", border: `1px solid ${border}`, borderRadius: 6, padding: "2px 6px", fontFamily: "monospace", fontWeight: 700 }}>{code}</span>
              </div>
              <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, margin: 0 }}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: One technical ask */}
      <section style={{ background: "#1E1B4B", color: "#fff" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                Integration requirements
              </p>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
                One afternoon of<br />engineering time
              </h2>
              <p style={{ fontSize: 15, color: "#C4B5FD", lineHeight: 1.7, marginBottom: 24 }}>
                Deep integration requires only three values from Mendi&apos;s firmware team. Once we have them, EEGBase can connect directly to the Mendi headband via Web Bluetooth — no Mendi app required for clinical sessions.
              </p>
              <p style={{ fontSize: 14, color: "#8B5CF6", lineHeight: 1.7 }}>
                We&apos;ve already reverse-engineered the BLE advertisement and connection flow. The values below are the only missing pieces. This is one afternoon of work for a firmware engineer.
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(196,181,253,0.2)", borderRadius: 20, padding: 28 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
                The 3 values we need
              </p>
              {[
                {
                  label: "BLE Service UUID",
                  desc: "The primary GATT service UUID for the Mendi data stream",
                  example: 'e.g. "6e400001-b5a3-f393-..."',
                },
                {
                  label: "Characteristic UUID",
                  desc: "The notify characteristic that broadcasts fNIRS packet data",
                  example: 'e.g. "6e400003-b5a3-f393-..."',
                },
                {
                  label: "Packet format",
                  desc: "Byte layout of each packet: offsets for OxyHb L/R, DeoxyHb L/R, reward score, timestamp",
                  example: 'e.g. [0-3]=OxyHb_L float32, [4-7]=OxyHb_R...',
                },
              ].map(({ label, desc, example }) => (
                <div key={label} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 13, color: "#C4B5FD", marginBottom: 4 }}>{desc}</p>
                  <p style={{ fontSize: 11, color: "#7C3AED", fontFamily: "monospace", background: "rgba(124,58,237,0.15)", padding: "4px 8px", borderRadius: 6 }}>{example}</p>
                </div>
              ))}
              <a
                href="mailto:hello@eegbase.com?subject=Mendi BLE Integration"
                style={{
                  display: "block", textAlign: "center", padding: "12px 20px",
                  background: violet, color: "#fff", borderRadius: 10,
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                }}
              >
                Send us the UUIDs →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: About EEGBase */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: violet, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              About EEGBase
            </p>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111", marginBottom: 16, lineHeight: 1.2 }}>
              Built by clinicians,<br />for clinicians
            </h2>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 16 }}>
              EEGBase is an MIT-licensed, fully open-source neurofeedback platform. Clinicians can self-host it on their own infrastructure in under 10 minutes — or deploy free on Vercel + Neon.
            </p>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7 }}>
              Patient data never leaves your infrastructure. No third-party cloud access by default. HIPAA-friendly architecture designed with clinical privacy as the primary constraint — not an afterthought.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "License", value: "MIT — fork it, self-host it, contribute to it", icon: "⚖️" },
              { label: "Stack", value: "Next.js 15, PostgreSQL (Neon), TypeScript", icon: "🛠️" },
              { label: "Deployment", value: "Vercel + Neon free tier, or Docker Compose on any Linux server", icon: "🚀" },
              { label: "Data residency", value: "Self-hosted by default — no EEGBase cloud required", icon: "🔒" },
              { label: "Devices", value: "Mendi fNIRS, Muse EEG, extensible adapter API", icon: "📡" },
              { label: "AI features", value: "Claude Haiku for clinical summaries — opt-in only", icon: "🤖" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                background: "#fff", border: "1px solid #E5E7EB",
                borderRadius: 12, padding: "14px 16px",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{icon}</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 13, color: "#374151" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo access section */}
      <section style={{ background: "#F5F3FF", borderTop: "1px solid #EDE9FE", borderBottom: "1px solid #EDE9FE" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "56px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 48, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Try it now
            </p>
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, color: "#1E1B4B", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 16 }}>
              Explore the full clinical dashboard
            </h2>
            <p style={{ fontSize: 15, color: "#4C1D95", lineHeight: 1.7, marginBottom: 0 }}>
              Pacific Neurofeedback is pre-loaded: 10 clients, 88 Mendi fNIRS sessions,
              SOAP notes, outcome measures, and a live simulator. No install required.
            </p>
          </div>
          <div style={{
            background: "#fff",
            border: "1.5px solid #C4B5FD",
            borderRadius: 16,
            padding: "24px 28px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Demo credentials
            </p>
            {[
              { label: "URL", value: "eegbase.com/login" },
              { label: "Email", value: "demo@eegbase.com" },
              { label: "Password", value: "demo2026" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{label}</span>
                <code style={{ fontSize: 13, color: "#4C1D95", fontFamily: "monospace", background: "#F5F3FF", padding: "2px 8px", borderRadius: 6 }}>{value}</code>
              </div>
            ))}
            <Link
              href="/login"
              style={{
                display: "block", marginTop: 20, padding: "10px 0",
                background: "#7C3AED", color: "#fff", borderRadius: 10,
                textAlign: "center", fontSize: 14, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Open Demo Clinic →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#111", color: "#9CA3AF", borderTop: "1px solid #1F2937" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontWeight: 700, color: "#fff", marginBottom: 4 }}>EEGBase × Mendi</p>
            <p style={{ fontSize: 13 }}>Partnership inquiries welcome — we move fast.</p>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
            <a
              href="mailto:hello@eegbase.com?subject=Mendi Partnership"
              style={{ color: "#A78BFA", textDecoration: "none", fontWeight: 600 }}
            >
              hello@eegbase.com
            </a>
            <a
              href="https://github.com/eegbase/eegbase"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#9CA3AF", textDecoration: "none" }}
            >
              GitHub
            </a>
            <Link href="/demo" style={{ color: "#9CA3AF", textDecoration: "none" }}>
              Live Demo
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
