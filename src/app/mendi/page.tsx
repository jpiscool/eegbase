import Link from "next/link";

export const metadata = {
  title: "EEGBase for Mendi — independent clinical layer for Mendi headbands",
  description:
    "EEGBase is an independent clinical platform that talks to Mendi headbands over Bluetooth. Built the same way Myndlift built on Muse — hardware-only, no Mendi app or cloud in the loop. Free for licensed clinicians.",
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
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: blue, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
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

      <main id="main-content">
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
            Independent integration · Mendi-compatible
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20 }}>
            A clinical layer{" "}<br />
            <span style={{ color: "#A78BFA" }}>for Mendi headbands</span>
          </h1>
          <p style={{ fontSize: 18, color: "#C4B5FD", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 32px" }}>
            Mendi's headband is exceptional consumer hardware. EEGBase is an independent clinical platform that talks to it directly over Bluetooth — the same model Myndlift took with Muse. No Mendi app or cloud in the loop. Bring your own headband, plug it into a clinic.
          </p>
          <p style={{ fontSize: 12, color: "#A5B4FC", marginTop: -16, marginBottom: 32, fontStyle: "italic", maxWidth: 540, margin: "-8px auto 32px" }}>
            EEGBase is not a Mendi product. We are not affiliated with, endorsed by, or licensed by Mendi AB. &ldquo;Mendi&rdquo; is a trademark of its owner.
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
              href="#book-meeting"
              style={{
                padding: "12px 24px", background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
                borderRadius: 12, fontSize: 14, fontWeight: 500,
                textDecoration: "none", display: "inline-block",
              }}
            >
              Book a 30-min call →
            </a>
          </div>
        </div>
      </section>

      {/* Book a meeting — Calendly isn't live yet, so we surface a clean
          mailto + the demo link instead of a broken iframe. Replace this
          whole block with the iframe (or a Cal.com embed) once the
          calendar URL exists. */}
      <section id="book-meeting" style={{ background: "#FAFAFA", padding: "56px 24px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.15em", marginBottom: 8, textTransform: "uppercase" }}>Book a meeting</p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 8 }}>30 minutes · live demo · your team</h2>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, maxWidth: 540, margin: "0 auto" }}>
              We&rsquo;ll walk through the demo, answer the 3 things you&rsquo;d most like answered,
              and end with a concrete next step. No slide deck unless you ask.
            </p>
          </div>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: 20, textAlign: "center" }}>
              Email us with three windows that work for you. We reply same day.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 20 }}>
              <Link
                href="/contact?role=partner"
                style={{
                  padding: "12px 24px", background: violet, color: "#fff",
                  borderRadius: 12, fontSize: 14, fontWeight: 700,
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
                }}
              >
                Open the contact form
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/demo"
                style={{
                  padding: "12px 24px", background: "white",
                  border: "1px solid #E5E7EB", color: "#374151",
                  borderRadius: 12, fontSize: 14, fontWeight: 600,
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8,
                }}
              >
                Or explore the demo first
              </Link>
            </div>
            <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", margin: 0 }}>
              Self-serve calendar coming soon. Email gets you a slot in under a day.
            </p>
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
              What clinicians need that the Mendi app doesn't provide
            </h2>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7 }}>
              The Mendi app is designed for consumers. Clinicians who prescribe or supervise Mendi-based neurofeedback sessions are flying blind — no caseload view, no documentation, no clinical accountability.
            </p>
          </div>
          <div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "🗂️", text: "One dashboard showing every client and every session" },
                { icon: "📊", text: "See the full brain data — not just a single score" },
                { icon: "📋", text: "Track changes in mood, focus, anxiety, and energy over time" },
                { icon: "📝", text: "Write clinical notes tied to each session" },
                { icon: "🤖", text: "AI-generated clinical summaries for documentation efficiency" },
                { icon: "📤", text: "Shareable progress reports for clients, families, and referrers" },
                { icon: "🏥", text: "Billing codes, scheduling, and outcome measure tracking" },
                { icon: "💾", text: "EDF+ / CSV / PDF export for research and insurance" },
                { icon: "🔒", text: "HIPAA-friendly U.S.-hosted architecture — clinic-owned data, full export anytime" },
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

      {/* Section 2: Future collaboration ideas */}
      <section style={{ background: "#fff", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: violet, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, textAlign: "center" }}>
            Open to collaboration · none active today
          </p>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111", marginBottom: 8, textAlign: "center" }}>
            If Mendi ever wants to formalise a relationship
          </h2>
          <p style={{ fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 48, maxWidth: 620, margin: "0 auto 48px" }}>
            EEGBase will work with any Mendi headband regardless of whether Mendi wants a formal relationship — the integration is independent. The three structures below are options we&rsquo;d be open to <em>if</em> Mendi ever wants to formalise something. Today, none of these are active.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              {
                num: "01",
                title: "Referral program",
                badge: "Low lift",
                badgeColor: "#059669",
                badgeBg: "#D1FAE5",
                description: "Mendi recommends EEGBase to clinicians who ask. EEGBase recommends Mendi to ours. Both sides get a referral cut. No code changes needed.",
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
                description: "EEGBase talks to the Mendi headband directly over Bluetooth — independent of Mendi's app or cloud. Clinicians see every client's sessions in one dashboard — even when the client trains alone at home.",
                bullets: [
                  "EEGBase consumer mobile app pairs with the Mendi headband over BLE",
                  "Sessions sync to the clinician's EEGBase dashboard",
                  "Per-clinician explicit consent in the EEGBase mobile app (GDPR Art. 9 / HIPAA authorization, revocable any time)",
                  "EEGBase is sole data controller — no joint-controller agreement needed because Mendi's cloud is not in the loop",
                  "Engineering owned end-to-end by EEGBase — no Mendi engineering required",
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
                description: "EEGBase powers a \"Mendi for Clinicians\" branded dashboard. Mendi gets a B2B SaaS product and recurring revenue stream. EEGBase gets distribution to Mendi's clinician user base. Full co-brand or full white-label.",
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
        <p style={{ fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 16, maxWidth: 600, margin: "0 auto 16px" }}>
          EEGBase already understands every signal Mendi broadcasts. Here's what each one tells clinicians.
        </p>
        <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", marginBottom: 40, maxWidth: 600, margin: "0 auto 40px", fontFamily: "ui-monospace, monospace" }}>
          Hardware: 660 + 805 nm wavelengths · ~31 Hz sampling · Brodmann area 10 (Fp1 / Fp2) · 2 long channels + 1 short-separation channel for skin-blood-flow regression.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {[
            {
              label: "OxyHb Left",
              code: "PFC-L",
              description: "Blood flow on the left side of the forehead. Goes up when someone is focused. ADHD clinicians track this during sessions.",
              color: "#DC2626",
              bg: "#FEF2F2",
              border: "#FECACA",
            },
            {
              label: "OxyHb Right",
              code: "PFC-R",
              description: "Blood flow on the right side of the forehead. Tells you about emotional control and how alert someone is. Left-right differences matter clinically.",
              color: "#EA580C",
              bg: "#FFF7ED",
              border: "#FED7AA",
            },
            {
              label: "DeoxyHb Left",
              code: "dHb-L",
              description: "Tracks when oxygen is being used up by neurons. Helps confirm whether the brain is actually working harder, not just getting more blood.",
              color: "#7C3AED",
              bg: "#F5F3FF",
              border: "#DDD6FE",
            },
            {
              label: "DeoxyHb Right",
              code: "dHb-R",
              description: "Same signal on the right side. Used to compare left and right brain activity — useful for anxiety, stress, and trauma work.",
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
                How the integration works
              </p>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
                Independent BLE,<br />no Mendi engineering required
              </h2>
              <p style={{ fontSize: 15, color: "#C4B5FD", lineHeight: 1.7, marginBottom: 24 }}>
                EEGBase reads the Mendi headband&rsquo;s BLE GATT stream directly — the same approach Myndlift took with Muse. Mendi confirmed (May 2026) this is the supported model: no SDK, no licensing, no engineering effort on their side.
              </p>
              <p style={{ fontSize: 14, color: "#8B5CF6", lineHeight: 1.7 }}>
                The adapter, decoder, Beer-Lambert helper, and unit tests are already built. The remaining work — capturing the GATT protocol from a physical Mendi via Wireshark — is being done in-house against the founder&rsquo;s own headband.
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(196,181,253,0.2)", borderRadius: 20, padding: 28 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
                Build status
              </p>
              {[
                { label: "Adapter scaffold (BLE transport)", note: "MendiAdapter class — full GATT lifecycle, reconnect, control-char hook", done: true },
                { label: "Pure packet decoder", note: "MendiPacketDecoder — separated from BLE I/O for unit-testing and mobile-app reuse", done: true },
                { label: "Beer-Lambert helper", note: "Modified Beer-Lambert MBLL for the raw-intensity case (Wray 1988 extinction coefficients)", done: true },
                { label: "Unit tests", note: "11 / 11 passing — preprocessed-Hb path, raw-intensity path, sequence-gap detection", done: true },
                { label: "BLE protocol capture", note: "Wireshark + Android HCI snoop log against a physical Mendi (in progress)", done: false },
                { label: "Hardware-in-the-loop validation", note: "Live session with real headband, baseline + serial-sevens task", done: false },
              ].map(({ label, note, done }) => (
                <div key={label} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, marginTop: 2, color: done ? "#34D399" : "#A78BFA", fontWeight: 700 }}>{done ? "✓" : "○"}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 12, color: "#C4B5FD" }}>{note}</p>
                  </div>
                </div>
              ))}
              <a
                href="/contact"
                style={{
                  display: "block", textAlign: "center", padding: "12px 20px",
                  background: violet, color: "#fff", borderRadius: 10,
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                }}
              >
                Get in touch →
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
              EEGBase is a clinician-built neurofeedback practice-management platform. Free for licensed clinicians. Hosted by us on HIPAA-friendly U.S. infrastructure (Vercel + Neon, AWS us-east-1).
            </p>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7 }}>
              Patient data is clinic-owned. Standard exports (BIDS-fNIRS, SNIRF, EDF+, CSV, PDF) anytime. No vendor lock-in, no third-party cloud access by default. HIPAA-friendly architecture designed with clinical privacy as the primary constraint — not an afterthought.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Pricing", value: "Free for licensed clinicians — no card, no per-seat fee", icon: "🎁" },
              { label: "Stack", value: "Next.js 16, PostgreSQL (Neon), TypeScript", icon: "🛠️" },
              { label: "Hosting", value: "Vercel + Neon · U.S. East · HIPAA-friendly architecture", icon: "🚀" },
              { label: "Data residency", value: "U.S. by default · clinic-owned · full export anytime", icon: "🔒" },
              { label: "Devices", value: "Mendi fNIRS, Muse EEG, Polar HRV, Apple Watch, Oura, extensible adapter API", icon: "📡" },
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
              The /demo route opens straight into a working clinical dashboard with 5 sample
              clients across ADHD, PTSD, burnout, sleep, and performance archetypes —
              including 20-session arcs, SOAP notes, outcome measures, and a live Mendi
              fNIRS simulator. No install, no signup.
            </p>
          </div>
          <div style={{
            background: "#fff",
            border: "1.5px solid #C4B5FD",
            borderRadius: 16,
            padding: "24px 28px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Open the demo
            </p>
            <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.65, marginBottom: 18 }}>
              No login or signup required. Click below and you land directly inside the
              clinical dashboard with the Mendi simulator running.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "11 tabs · Live Session, Brain Map, AI Insights, Reports, Compare",
                "5 sample clients · Mendi-only, hybrid, EEG-cap archetypes",
                "20-session learning arcs with PHQ-9 / GAD-7 outcomes",
                "Live Mendi fNIRS simulator · 660 + 805 nm · BA10 · 2 long + 1 short",
              ].map((item) => (
                <li key={item} style={{ fontSize: 12, color: "#4B5563", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7C3AED", flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/demo"
              style={{
                display: "block", padding: "10px 0",
                background: "#7C3AED", color: "#fff", borderRadius: 10,
                textAlign: "center", fontSize: 14, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Open the demo clinic →
            </Link>
          </div>
        </div>
      </section>
      </main>

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
            <Link href="/demo" style={{ color: "#9CA3AF", textDecoration: "none" }}>
              Live Demo
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
