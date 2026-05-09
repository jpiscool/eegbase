import Link from "next/link";

export const metadata = {
  title: "Conditions · EEGBase",
  description: "Neurofeedback protocols, outcomes, and evidence by clinical condition.",
};

const CONDITIONS = [
  { slug: "adhd",       name: "ADHD",             desc: "Inattentive + hyperactive subtypes · prefrontal up-train · 30-year evidence base", color: "#2563EB" },
  { slug: "anxiety",    name: "Anxiety",          desc: "GAD, panic, social · right-DLPFC down-train + HRV resonance",                      color: "#10B981" },
  { slug: "burnout",    name: "Burnout",          desc: "Workplace exhaustion · DLPFC reactivation · KU Leuven replication",                color: "#7C3AED" },
  { slug: "ptsd",       name: "PTSD",             desc: "Veterans + civilian · alpha-theta + right-temporal down-train",                    color: "#E11D48" },
  { slug: "sleep",      name: "Sleep · insomnia", desc: "Sleep-spindle SMR + pre-sleep alpha + HRV resonance",                              color: "#06B6D4" },
  { slug: "depression", name: "Depression",       desc: "Frontal alpha asymmetry + Mendi prefrontal HbO up-train",                          color: "#A855F7" },
  { slug: "autism",     name: "Autism spectrum",  desc: "SMR + mu-rhythm · neurodiversity-affirming framing",                              color: "#F59E0B" },
  { slug: "ocd",        name: "OCD",              desc: "Beta down-train + ERP-paired biofeedback · Y-BOCS tracking",                       color: "#84CC16" },
];

export default function ConditionsIndex() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Conditions</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Treatment focus areas</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Each condition page lists the supported protocols, registry-derived outcomes, and primary literature. EEGBase is software — clinical judgment always rests with the licensed clinician.
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
