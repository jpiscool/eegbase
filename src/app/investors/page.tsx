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
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/contact?role=investor" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Talk to us →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>For prospective investors</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>The clinical layer for consumer neuroscience</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          EEGBase is the open-source clinical layer for any neurofeedback hardware. Mendi at home, Muse in clinic, Polar HRV, and Apple Health become one client record, one SOAP note, one billable session.
        </p>

        {/* Market thesis */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>The market</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { val: "$2.1B",  lbl: "Global neurofeedback TAM 2026", sub: "11% CAGR" },
              { val: "47k",    lbl: "Licensed NA clinicians",        sub: "Core target" },
              { val: "$300M",  lbl: "Mendi consumer line",           sub: "Hardware partner addressable" },
              { val: "+38%",   lbl: "Consumer attach lift",          sub: "Per Mendi-attached clinic" },
            ].map((s) => (
              <div key={s.lbl} style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, marginTop: 2 }}>{s.lbl}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Traction */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>Traction (illustrative · pre-public-launch)</h2>
          <ul style={{ paddingLeft: 20, listStyle: "disc", color: "#374151", fontSize: 14, lineHeight: 1.8 }}>
            <li>Pre-print under review at Frontiers in Human Neuroscience (n=2,840)</li>
            <li>Sham-controlled RCT pre-registered · NCT06912xxx · IRB approved Apr 2026</li>
            <li>Mendi partnership proposal submitted Q2 2026 · 3 partnership tiers under review</li>
            <li>SOC 2 Type II + Bishop Fox pen-test complete Q1 2026</li>
            <li>Open-source codebase · MIT license · public repo since 2025</li>
            <li>Demo deployed at <Link href="/demo" style={{ color: "#2563EB" }}>eegbase.vercel.app/demo</Link> · 16 tabs · 10 mock clients · 88 mock sessions</li>
          </ul>
        </section>

        {/* Why now */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>Why now</h2>
          <ol style={{ paddingLeft: 20, listStyle: "decimal", color: "#374151", fontSize: 14, lineHeight: 1.8 }}>
            <li><strong>Consumer fNIRS just hit price-feasible</strong> — Mendi $299, Muse Athena $475, Sens.ai $1,500. The hardware is finally affordable for clinic prescription.</li>
            <li><strong>USCDI+ Behavioral Health pilot</strong> — ONC&apos;s 9-pilot federal program launched Q1 2026. First-mover advantage on the standards is open.</li>
            <li><strong>AI scribe is table-stakes</strong> — Mentalyc, Upheal, DeepCura proved the workflow. We bundle it with the signal data, which they can&apos;t.</li>
            <li><strong>Open-source + self-hostable</strong> — procurement teams can finally say yes to a startup. MIT license + BIDS export = zero lock-in.</li>
          </ol>
        </section>

        {/* Ask */}
        <section style={{ background: "linear-gradient(135deg, #1E1B4B, #0F172A)", borderRadius: 16, padding: 28, marginBottom: 18, color: "white" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#A5B4FC", letterSpacing: "0.15em", marginBottom: 8, textTransform: "uppercase" }}>The round</p>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>Pre-seed open · target $1.5M</h2>
          <p style={{ fontSize: 14, color: "#CBD5E1", lineHeight: 1.7, marginBottom: 18 }}>
            Use of funds: 18 months runway · 4 hires (1 clinical PM, 2 engineers, 1 research engineer) · Q3 2026 paid plans launch · Mendi partnership operationalization · multi-clinic registry execution.
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
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginBottom: 14 }}>NDA-gated. Sign a mutual NDA and we&apos;ll send the full data room within 24 hours.</p>
          <ul style={{ paddingLeft: 20, listStyle: "disc", color: "#374151", fontSize: 13, lineHeight: 1.8 }}>
            <li>Full pitch deck + financial model</li>
            <li>SOC 2 Type II report (Coalfire)</li>
            <li>Bishop Fox pen-test attestation</li>
            <li>Cap table + ownership history</li>
            <li>Customer pipeline + Mendi correspondence</li>
            <li>Hiring plan + compensation philosophy</li>
            <li>IRB packet + research roadmap</li>
          </ul>
          <a href="mailto:investors@eegbase.com?subject=Data%20room%20request" style={{ display: "inline-block", marginTop: 16, padding: "10px 18px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Request data room →</a>
        </section>

        <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
          This page is illustrative for the pitch demo. All figures will be replaced with audited numbers in the actual data room.
        </p>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/team" style={{ color: "#9CA3AF" }}>Team</Link> · <Link href="/security" style={{ color: "#9CA3AF" }}>Security</Link>
      </footer>
    </div>
  );
}
