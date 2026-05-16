import Link from "next/link";

export const metadata = {
  title: "Investors · EEGBase",
  description: "Traction, market thesis, and ask for prospective EEGBase investors.",
};

export default function InvestorsPage() {
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
          <Link href="/contact?role=investor" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Talk to us →</Link>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>For prospective investors</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>The clinical layer for consumer neuroscience</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          EEGBase is the clinical layer for any neurofeedback hardware. Mendi at home, Muse in clinic, Polar HRV, and Apple Health become one client record, one SOAP note, one billable session.
        </p>

        {/* Market thesis */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>The market (illustrative)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { val: "$1–2B",  lbl: "Global neurofeedback / consumer-NF TAM range", sub: "Public-source estimates · varies by definition" },
              { val: "~47k",   lbl: "Licensed NA mental-health clinicians (BLS est.)", sub: "Subset adopt neurofeedback" },
              { val: "Growing",lbl: "Consumer fNIRS & EEG hardware",                  sub: "Mendi, Muse, Sens.ai, OpenBCI, Polar etc." },
            ].map((s) => (
              <div key={s.lbl} style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, marginTop: 2 }}>{s.lbl}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 10, lineHeight: 1.5 }}>Figures above are estimates compiled from public sources (industry reports, BLS data, hardware-maker disclosures). Final sources will be cited in the data room.</p>
        </section>

        {/* Traction */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>Where we are today (pre-launch)</h2>
          <ul style={{ paddingLeft: 20, listStyle: "disc", color: "#374151", fontSize: 14, lineHeight: 1.8 }}>
            <li>Full product built end-to-end · 11-tab clinician dashboard live in demo</li>
            <li>Adapters built for Polar, Apple Watch, Oura, Whoop · Muse adapter built (independent BLE protocol, hardware-validation in progress) · Mendi adapter in development as an independent BLE integration</li>
            <li>Mendi confirmed May 2026 that an independent integration (Myndlift-style, hardware-only) is the supported model — no licensing or partnership barrier</li>
            <li>iOS + Android consumer apps in design — required for at-home Mendi/Muse use to hit clinician dashboards</li>
            <li>SOC 2 + independent pen-test scoping in progress · target start Q3 2026</li>
            <li>Sham-controlled RCT in design phase · IRB submission planned Q3 2026 · ClinicalTrials.gov registration to follow</li>
            <li>Hosted SaaS · free for licensed clinicians during early launch</li>
            <li>Demo deployed at <Link href="/demo" style={{ color: "#2563EB" }}>eegbase.com/demo</Link> · 11 tabs · pre-loaded sample clients + sessions</li>
          </ul>
        </section>

        {/* Why now */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>Why now</h2>
          <ol style={{ paddingLeft: 20, listStyle: "decimal", color: "#374151", fontSize: 14, lineHeight: 1.8 }}>
            <li><strong>Consumer fNIRS just hit price-feasible</strong> — Mendi $299, Muse Athena $475, Sens.ai $1,500. The hardware is finally affordable for clinic prescription.</li>
            <li><strong>USCDI+ Behavioral Health pilot</strong> — ONC's 9-pilot federal program launched Q3 2026. First-mover advantage on the standards is open.</li>
            <li><strong>AI scribe is table-stakes</strong> — Mentalyc, Upheal, DeepCura proved the workflow. We bundle it with the signal data, which they can't.</li>
            <li><strong>BIDS / SNIRF / EDF+ export anytime</strong> — procurement teams can finally say yes to a startup. Standardised exports = zero lock-in.</li>
          </ol>
        </section>

        {/* Ask */}
        <section style={{ background: "linear-gradient(135deg, #1E1B4B, #0F172A)", borderRadius: 16, padding: 28, marginBottom: 18, color: "white" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#A5B4FC", letterSpacing: "0.15em", marginBottom: 8, textTransform: "uppercase" }}>The round</p>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>Pre-seed open · target $1.5M</h2>
          <p style={{ fontSize: 14, color: "#CBD5E1", lineHeight: 1.7, marginBottom: 18 }}>
            We'll spend the $1.5M on: 18 months of runway, 4 hires (clinical PM, 2 engineers, 1 research engineer), keeping the platform free for early clinics, and standing up the Mendi partnership and multi-clinic research database.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(165,180,252,0.3)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#A5B4FC", marginBottom: 4 }}>Round size</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>$1.5M</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(165,180,252,0.3)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#A5B4FC", marginBottom: 4 }}>Lead allocation</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>$750k</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(165,180,252,0.3)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#A5B4FC", marginBottom: 4 }}>Runway</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>18 mo</div>
            </div>
          </div>
        </section>

        {/* Data room */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Data room</h2>
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginBottom: 14 }}>NDA-gated. Sign a mutual NDA and we&rsquo;ll send the data room within 24 hours.</p>
          <ul style={{ paddingLeft: 20, listStyle: "disc", color: "#374151", fontSize: 13, lineHeight: 1.8 }}>
            <li>Full pitch deck + financial model</li>
            <li>Cap table + ownership history</li>
            <li>Hardware-partner conversation log</li>
            <li>Hiring plan + compensation philosophy</li>
            <li>Research roadmap (RCT design, IRB plan)</li>
            <li>Security &amp; compliance roadmap (SOC 2 + pen-test scope, target Q3 2026)</li>
          </ul>
          <a href="mailto:investors@eegbase.com?subject=Data%20room%20request" style={{ display: "inline-block", marginTop: 16, padding: "10px 18px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Request data room →</a>
        </section>

        <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
          This page is a public product overview for prospective investors. It is <strong>not an offer to sell or a solicitation to buy</strong> any security. All figures are illustrative pre-launch estimates from public sources; audited numbers and full source references will be provided in the NDA-gated data room. Forward-looking statements (roadmap items, planned audits, planned trials) involve risk and uncertainty and are not guarantees.
        </p>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/team" style={{ color: "#9CA3AF" }}>Team</Link> · <Link href="/security" style={{ color: "#9CA3AF" }}>Security</Link>
      </footer>
    </div>
  );
}
