import Link from "next/link";

export const metadata = {
  title: "Brand assets · EEGBase",
  description: "Logos, color palette, screenshots, and usage guidelines.",
};

const COLORS = [
  { name: "EEGBase Blue",    hex: "#2563EB", role: "Primary brand" },
  { name: "Mendi Violet",    hex: "#7C3AED", role: "Partnership accent" },
  { name: "Signal Cyan",     hex: "#06B6D4", role: "Secondary accent" },
  { name: "Ink Navy",        hex: "#0F172A", role: "Dark surface · text" },
  { name: "Trust Emerald",   hex: "#10B981", role: "Success · live state" },
  { name: "Honest Amber",    hex: "#F59E0B", role: "Warnings · honest gaps" },
  { name: "Risk Rose",       hex: "#E11D48", role: "Errors · risk flags" },
  { name: "Paper",           hex: "#FAFAFA", role: "Light surface" },
];

const ASSETS = [
  { name: "Logo · square (PNG)",   sub: "Light + dark backgrounds · 1024×1024", file: "/og-image.svg", color: "#2563EB" },
  { name: "Logo · wordmark (SVG)", sub: "Vector · scales infinitely",            file: "/og-image.svg", color: "#7C3AED" },
  { name: "Open Graph card (SVG)", sub: "1200×630 · for social sharing",        file: "/og-image.svg", color: "#06B6D4" },
  { name: "Demo screenshots",      sub: "16 tabs · 1440×900 PNG · zip",         file: "mailto:hello@eegbase.com?subject=Demo%20screenshots", color: "#10B981" },
  { name: "One-pager PDF",         sub: "Printable summary for press / partners", file: "mailto:hello@eegbase.com?subject=One-pager%20PDF", color: "#F59E0B" },
];

export default function BrandAssetsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/team" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Team →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>For press, partners, designers</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Brand assets</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Logos, palette, screenshots, and usage guidelines. Free to use under the same MIT license as the codebase, with attribution. Email <a href="mailto:hello@eegbase.com" style={{ color: "#2563EB" }}>hello@eegbase.com</a> for high-res versions or for partner co-branding requests.
        </p>

        {/* Logo block */}
        <h2 style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>Logo</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 36 }}>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, background: "#2563EB", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 18 }}>EB</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: 22, color: "#0F172A", letterSpacing: "-0.02em" }}>EEGBase</span>
            </div>
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 18 }}>Light variant · use on white or pale surfaces</p>
          </div>
          <div style={{ background: "#0F172A", borderRadius: 14, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, background: "#3B82F6", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 18 }}>EB</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: 22, color: "white", letterSpacing: "-0.02em" }}>EEGBase</span>
            </div>
            <p style={{ fontSize: 11, color: "#64748B", marginTop: 18 }}>Dark variant · use on dark or photo backgrounds</p>
          </div>
        </div>

        {/* Color palette */}
        <h2 style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>Color palette</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 36 }}>
          {COLORS.map((c) => {
            const isLight = c.hex === "#FAFAFA";
            return (
              <div key={c.hex} style={{ background: c.hex, borderRadius: 12, padding: 16, height: 110, display: "flex", flexDirection: "column", justifyContent: "space-between", border: isLight ? "1px solid #E5E7EB" : "none" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: isLight ? "#0F172A" : "white", letterSpacing: "-0.01em" }}>{c.name}</div>
                <div>
                  <div style={{ fontSize: 14, fontFamily: "ui-monospace, monospace", color: isLight ? "#0F172A" : "white", fontWeight: 700 }}>{c.hex}</div>
                  <div style={{ fontSize: 10, color: isLight ? "#64748B" : "rgba(255,255,255,0.7)", marginTop: 2 }}>{c.role}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Typography */}
        <h2 style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>Typography</h2>
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24, marginBottom: 36 }}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 36, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 4 }}>The clinical layer</p>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>Headline · Geist · 36px / 800 / -0.03em tracking</p>
          </div>
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 4 }}>Subheading style for sections</p>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>H2 · Geist · 22px / 700 / -0.01em</p>
          </div>
          <div>
            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, marginBottom: 4 }}>Body text uses Geist at 15px with 1.7 line-height. Paragraphs are short, sentences are direct, jargon is glossed.</p>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>Body · Geist · 15px / 400 / 1.7 line-height</p>
          </div>
        </div>

        {/* Downloads */}
        <h2 style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>Downloads</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
          {ASSETS.map((a) => (
            <a key={a.name} href={a.file} download={a.file.startsWith("/")} style={{ display: "grid", gridTemplateColumns: "8px 1fr auto", gap: 12, alignItems: "center", padding: 14, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, textDecoration: "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: a.color }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>{a.sub}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>Download ↓</span>
            </a>
          ))}
        </div>

        {/* Usage rules */}
        <section style={{ background: "linear-gradient(135deg, #FEF3C7, #FFFBEB)", border: "1px solid #FCD34D", borderRadius: 14, padding: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>Usage rules</p>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>Please don't</h2>
          <ul style={{ paddingLeft: 20, listStyle: "disc", color: "#78350F", lineHeight: 1.7, fontSize: 13 }}>
            <li>Distort, recolor, or restyle the logo. Keep the EB mark on its blue square.</li>
            <li>Place the logo on busy photos without a high-contrast underlay.</li>
            <li>Combine with the Mendi logo without first contacting <a href="mailto:hello@eegbase.com" style={{ color: "#92400E", textDecoration: "underline" }}>hello@eegbase.com</a>.</li>
            <li>Use the EEGBase brand to imply endorsement of products or services not built by us.</li>
            <li>Use clinician quotes or case-study figures from this site as if they were peer-reviewed primary literature. They are illustrative.</li>
          </ul>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/team" style={{ color: "#9CA3AF" }}>Team</Link>
      </footer>
    </div>
  );
}
