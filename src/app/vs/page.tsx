import Link from "next/link";

export const metadata = {
  title: "Comparisons · EEGBase",
  description: "Honest side-by-side comparisons against the platforms clinicians actually consider.",
};

const VS = [
  { slug: "simplepractice",    name: "SimplePractice",    desc: "General mental-health EHR · most popular comparison" },
  { slug: "therapynotes",      name: "TherapyNotes",      desc: "ONC-certified EHR · psychiatrist-friendly" },
  { slug: "myndlift",          name: "Myndlift",          desc: "Muse-only home neurofeedback · our nearest direct competitor" },
  { slug: "brainmaster",       name: "BrainMaster",       desc: "Legacy clinical-NF Windows software" },
  { slug: "cygnet",            name: "Cygnet · BEE Medic", desc: "Z-score-focused clinical platform" },
  { slug: "bioexplorer",       name: "BioExplorer",       desc: "Open-design protocol-builder for power users" },
  { slug: "neuroguide",        name: "NeuroGuide",        desc: "qEEG + LORETA gold standard" },
  { slug: "divergence-neuro",   name: "Divergence Neuro",  desc: "Modern multi-vendor cloud platform · our nearest cloud peer" },
];

export default function VsIndex() {
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
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Comparisons</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>vs the platforms you&apos;re considering</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Honest side-by-sides. We don&apos;t pretend to win every row — see "Honest take" at the bottom of each page.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {VS.map((v) => (
            <Link key={v.slug} href={`/vs/${v.slug}`} style={{ textDecoration: "none" }}>
              <article style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 6, letterSpacing: "-0.01em" }}>EEGBase vs {v.name}</h2>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{v.desc}</p>
                <p style={{ fontSize: 12, color: "#2563EB", fontWeight: 700, marginTop: 10 }}>Side-by-side →</p>
              </article>
            </Link>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
