import Link from "next/link";

export const metadata = {
  title: "Protocol references · EEGBase",
  description: "Reference summaries of neurofeedback protocols documented in the published literature, organised by symptom focus. Not medical advice.",
};

const CONDITIONS = [
  { slug: "adhd",       name: "ADHD",             desc: "Inattentive + hyperactive subtypes · prefrontal up-train · published since the 1990s", color: "#2563EB" },
  { slug: "anxiety",    name: "Anxiety",          desc: "GAD, panic, social · right-DLPFC down-train + HRV resonance",                      color: "#10B981" },
  { slug: "burnout",    name: "Burnout",          desc: "Workplace exhaustion · DLPFC reactivation literature",                             color: "#7C3AED" },
  { slug: "ptsd",       name: "PTSD",             desc: "Veterans + civilian · alpha-theta + right-temporal down-train literature",         color: "#E11D48" },
  { slug: "sleep",      name: "Sleep · insomnia", desc: "Sleep-spindle SMR + pre-sleep alpha + HRV resonance literature",                   color: "#06B6D4" },
  { slug: "depression", name: "Depression",       desc: "Frontal alpha asymmetry + fNIRS prefrontal HbO up-train literature",               color: "#A855F7" },
  { slug: "autism",     name: "Autism spectrum",  desc: "SMR + mu-rhythm · neurodiversity-affirming framing",                              color: "#F59E0B" },
  { slug: "ocd",        name: "OCD",              desc: "Beta down-train + ERP-paired biofeedback literature",                              color: "#84CC16" },
];

export default function ConditionsIndex() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Conditions</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Protocol references</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 16, maxWidth: 720 }}>
          Reference summaries of neurofeedback protocols documented in the published literature, organised by symptom focus. EEGBase is software — it does not diagnose, treat, cure, or prevent any disease. Clinical judgment always rests with the licensed clinician.
        </p>
        <p style={{ fontSize: 12, color: "#92400E", background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 10, padding: "10px 14px", marginBottom: 36, maxWidth: 720, lineHeight: 1.6 }}>
          <strong>Note:</strong> Effect sizes shown on individual pages are illustrative figures from the published academic literature, not from an EEGBase outcomes registry. EEGBase has not yet completed any clinical study of its own.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {CONDITIONS.map((c) => (
            <Link key={c.slug} href={`/conditions/${c.slug}`} style={{ textDecoration: "none" }}>
              <article style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, height: "100%", borderLeft: `4px solid ${c.color}` }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 6, letterSpacing: "-0.01em" }}>{c.name}</h2>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{c.desc}</p>
                <p style={{ fontSize: 12, color: c.color, fontWeight: 700, marginTop: 10 }}>Protocols + outcomes →</p>
              </article>
            </Link>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
