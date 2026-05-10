import Link from "next/link";

export const metadata = {
  title: "Find a clinic · EEGBase",
  description: "Locate clinicians using EEGBase + Mendi for neurofeedback near you.",
};

// Waitlist counts are illustrative pre-launch — kept distinct from the
// 412-clinic naturalistic registry referenced on /research and /reports.
const REGIONS = [
  { name: "United States", clinics: 168, cities: ["Portland · OR", "Austin · TX", "Boston · MA", "San Diego · CA", "Minneapolis · MN", "San Antonio · TX"], color: "#2563EB" },
  { name: "Canada",        clinics: 22,  cities: ["Toronto · ON", "Vancouver · BC", "Montreal · QC"],                                            color: "#DC2626" },
  { name: "European Union", clinics: 54,  cities: ["Amsterdam · NL", "Berlin · DE", "Paris · FR", "Madrid · ES", "Stockholm · SE"],              color: "#7C3AED" },
  { name: "United Kingdom", clinics: 17, cities: ["London", "Manchester", "Edinburgh"],                                                       color: "#10B981" },
  { name: "Australia",     clinics: 9, cities: ["Sydney", "Melbourne"],                                                                       color: "#F59E0B" },
];

export default function ClinicFinderPage() {
  const total = REGIONS.reduce((a, r) => a + r.clinics, 0);
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/case-studies" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Case studies →</Link>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 980, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Clinic finder · waitlist</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Find a Mendi-attached clinic near you</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 30, maxWidth: 720 }}>
          Live finder ships in a future update. Today: {total}+ clinics on the waitlist across {REGIONS.length} regions. <Link href="/contact?role=patient" style={{ color: "#2563EB" }}>Send us your zip code</Link> and we'll connect you when one is available.
        </p>

        {/* Map placeholder */}
        <section style={{ background: "linear-gradient(135deg, #F1F5F9, #FFFFFF)", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, marginBottom: 28, position: "relative", minHeight: 320 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>World view · {total} waitlisted clinics</p>
          {/* Simple SVG world placeholder */}
          <svg viewBox="0 0 600 240" width="100%" height={240} style={{ display: "block" }}>
            {/* Continent shapes (very simplified) */}
            <g fill="#CBD5E1" opacity="0.5">
              <path d="M 50,80 Q 80,60 130,70 Q 160,80 170,110 Q 165,140 130,150 Q 80,150 60,130 Z" />
              <path d="M 280,60 Q 340,50 380,70 Q 410,90 405,120 Q 360,135 310,125 Q 280,110 280,80 Z" />
              <path d="M 200,160 Q 230,150 250,170 Q 245,200 220,205 Q 195,195 195,180 Z" />
              <path d="M 460,170 Q 510,165 530,185 Q 525,210 490,210 Q 465,200 460,185 Z" />
            </g>
            {/* Pins */}
            {[
              { x: 100, y: 100, n: 247, color: "#2563EB", label: "USA" },
              { x: 130, y: 80,  n: 38,  color: "#DC2626", label: "Canada" },
              { x: 320, y: 90,  n: 89,  color: "#7C3AED", label: "EU" },
              { x: 295, y: 75,  n: 23,  color: "#10B981", label: "UK" },
              { x: 510, y: 195, n: 15,  color: "#F59E0B", label: "AU" },
            ].map((p) => (
              <g key={p.label}>
                <circle cx={p.x} cy={p.y} r={Math.sqrt(p.n) * 1.5} fill={p.color} opacity="0.25" />
                <circle cx={p.x} cy={p.y} r="5" fill={p.color} />
                <text x={p.x} y={p.y - 12} fontSize="10" fontWeight="700" fill={p.color} textAnchor="middle">{p.n}</text>
              </g>
            ))}
          </svg>
          <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 12, fontStyle: "italic" }}>
            Illustrative placeholder. Real geo-clustered map ships in a future update.
          </p>
        </section>

        {/* Region cards */}
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>By region</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 28 }}>
          {REGIONS.map((r) => (
            <article key={r.name} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: r.color }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{r.name}</h3>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: r.color, fontVariantNumeric: "tabular-nums" }}>{r.clinics}</span>
              </div>
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.55 }}>{r.cities.join(" · ")}</p>
            </article>
          ))}
        </div>

        {/* CTA */}
        <section style={{ background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)", border: "1px solid #A7F3D0", borderRadius: 16, padding: 24, textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Are you a clinician?</h2>
          <p style={{ fontSize: 14, color: "#047857", lineHeight: 1.6, marginBottom: 14 }}>
            List your clinic when the public directory launches. No verification fee, but BCN/LPC/MD credentials required.
          </p>
          <Link href="/contact?role=clinician" style={{ display: "inline-block", padding: "10px 18px", background: "#10B981", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Reserve your listing →</Link>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
