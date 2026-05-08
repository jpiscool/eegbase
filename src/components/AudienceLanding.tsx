import Link from "next/link";

export type AudienceContent = {
  eyebrow: string;
  eyebrowColor: string;
  hero: { line1: string; line2: string; line2Color: string };
  lede: string;
  pillars: { title: string; desc: string; color: string }[];
  features: string[];
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  proofPoints?: { val: string; lbl: string }[];
  footnote?: string;
};

export function AudienceLanding({ c }: { c: AudienceContent }) {
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
          <Link href="/demo" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Live demo →</Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 32px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: c.eyebrowColor, letterSpacing: "0.15em", marginBottom: 14, textTransform: "uppercase" }}>{c.eyebrow}</p>
          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
            {c.hero.line1}
            <br />
            <span style={{ color: c.hero.line2Color }}>{c.hero.line2}</span>
          </h1>
          <p style={{ fontSize: 17, color: "#475569", lineHeight: 1.7, maxWidth: 720, marginBottom: 28 }}>{c.lede}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={c.cta.href} style={{ padding: "12px 22px", background: c.eyebrowColor, color: "white", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>{c.cta.label}</Link>
            {c.secondaryCta && (
              <Link href={c.secondaryCta.href} style={{ padding: "12px 22px", background: "white", border: "1px solid #E5E7EB", color: "#374151", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>{c.secondaryCta.label}</Link>
            )}
          </div>

          {/* Proof points */}
          {c.proofPoints && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${c.proofPoints.length}, 1fr)`, gap: 16, marginTop: 40 }}>
              {c.proofPoints.map((p) => (
                <div key={p.lbl}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.eyebrowColor, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{p.val}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{p.lbl}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pillars */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {c.pillars.map((p) => (
              <article key={p.title} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${p.color}1A`, marginBottom: 10 }} />
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 6, letterSpacing: "-0.01em" }}>{p.title}</h2>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.65 }}>{p.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Feature list */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>What you get</h2>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {c.features.map((f) => (
                <li key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                  <span style={{ color: c.eyebrowColor, fontWeight: 700, flexShrink: 0 }}>✓</span><span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA band */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 64px" }}>
          <div style={{ background: c.eyebrowColor, borderRadius: 16, padding: 32, textAlign: "center" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", marginBottom: 10, letterSpacing: "-0.02em" }}>Ready to try it?</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 20, maxWidth: 540, margin: "0 auto 20px" }}>It&rsquo;s free · no card · synthetic data in the demo · MIT-licensed.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href={c.cta.href} style={{ padding: "12px 22px", background: "white", color: c.eyebrowColor, borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>{c.cta.label}</Link>
              <Link href="/contact" style={{ padding: "12px 22px", background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: "white", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Talk to us</Link>
            </div>
          </div>
          {c.footnote && <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 20, lineHeight: 1.6, fontStyle: "italic" }}>{c.footnote}</p>}
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
