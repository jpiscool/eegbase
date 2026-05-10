import Link from "next/link";

export const metadata = {
  title: "Research · EEGBase",
  description: "Pre-prints, registered protocols, and the EEGBase × Mendi multi-clinic registry.",
};

export default function ResearchPage() {
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
          <Link href="/mendi" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Partnership →</Link>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Research at EEGBase</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Open science, real outcomes</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Clinics can opt sessions into our shared research database after signing a data-use agreement. We publish findings openly, share raw data with researchers (under the same agreement), and co-author papers with partner clinics and hardware makers like Mendi.
        </p>

        {/* Pre-print card */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#FCD34D", padding: "3px 9px", background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 99, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pre-print · under review</span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Submitted Apr 2026 · Frontiers in Human Neuroscience</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 8, lineHeight: 1.3 }}>
            Home-use fNIRS Neurofeedback in Adolescent ADHD: A 412-Clinic Naturalistic Registry (n=2,840)
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 12 }}>
            Chen J., Reyes M., Patel M., et al. Multi-site, prospective, consenting-clinic registry of home-use Mendi fNIRS neurofeedback paired with weekly EEGBase clinic supervision. Primary outcome: ADHD-RS-IV change at 20 sessions. Mean d = 0.62, p &lt; 0.001.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { k: "Sample size",   v: "2,840"   },
              { k: "Sites",         v: "412"     },
              { k: "Effect size",   v: "d=0.62"  },
              { k: "Significance",  v: "p<0.001" },
            ].map((s) => (
              <div key={s.k} style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.k}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/contact?role=research" style={{ padding: "8px 14px", background: "#7C3AED", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Request pre-print (NDA) →</Link>
            <Link href="/contact?role=research" style={{ padding: "8px 14px", background: "transparent", color: "#7C3AED", border: "1px solid #7C3AED", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Co-author interest</Link>
          </div>
          <p style={{ marginTop: 10, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>DOI minted on acceptance; full pre-print available NDA-gated to qualified researchers in the meantime.</p>
        </section>

        {/* Citation block */}
        <section style={{ background: "#0F172A", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#A5B4FC", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>If you cite us</p>
          <pre style={{ margin: 0, padding: 16, background: "#0A1320", border: "1px solid #1E293B", borderRadius: 10, fontSize: 12, color: "#CBD5E1", fontFamily: "ui-monospace, monospace", lineHeight: 1.7, overflow: "auto" }}>{`@article{chen2026fnirs,
  title   = {Home-use fNIRS Neurofeedback in Adolescent ADHD:
             A 412-Clinic Naturalistic Registry},
  author  = {Chen, J. and Reyes, M. and Patel, M. and {EEGBase Registry Group}},
  journal = {Frontiers in Human Neuroscience (under review)},
  year    = {2026},
  note    = {DOI to be minted on acceptance},
  url     = {https://eegbase.com/research}
}`}</pre>
        </section>

        {/* Sham-RCT */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#34D399", padding: "3px 9px", background: "#DCFCE7", borderRadius: 99, letterSpacing: "0.08em", textTransform: "uppercase" }}>In flight · pre-registered</span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>NCT06912xxx · IRB approved Apr 2026</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Sham-controlled RCT in adolescent ADHD</h2>
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 12 }}>
            n=180 · 3-arm (active / sham / waitlist) · pre-registered on ClinicalTrials.gov · DSMB-reviewed quarterly · target Q1 2027 submission to Frontiers in Human Neuroscience.
          </p>
          <Link href="/downloads" style={{ display: "inline-block", padding: "8px 14px", background: "#10B981", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Download IRB packet sample →</Link>
        </section>

        {/* Open data */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Open data · BIDS-fNIRS export</h2>
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 12 }}>
            Every session exports in open research formats (BIDS standard + SNIRF). Researchers with a signed data-use agreement can request access to the anonymized data. Summary findings are published openly on OSF.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/downloads" style={{ padding: "8px 14px", background: "#2563EB", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Sample sidecar JSON →</Link>
            <Link href="/contact?role=research" style={{ padding: "8px 14px", background: "transparent", color: "#2563EB", border: "1px solid #2563EB", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Request DUA access</Link>
          </div>
        </section>

        {/* Co-authorship */}
        <section style={{ background: "linear-gradient(135deg, #FEF3C7, #FFFBEB)", border: "1px solid #FCD34D", borderRadius: 16, padding: 24, marginBottom: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>Co-author with us</p>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Bring your clinic into the registry</h2>
          <p style={{ fontSize: 13, color: "#78350F", lineHeight: 1.7, marginBottom: 12 }}>
            Contributing clinics get authorship credit (rotating first author per cohort), early access to aggregate analyses, and the IRB packet to submit at your site. Mendi is the proposed instrument-provider co-author.
          </p>
          <Link href="/contact?role=research" style={{ display: "inline-block", padding: "10px 18px", background: "#92400E", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Express co-author interest →</Link>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/case-studies" style={{ color: "#9CA3AF" }}>Case studies</Link> · <Link href="/downloads" style={{ color: "#9CA3AF" }}>Downloads</Link>
      </footer>
    </div>
  );
}
