import Link from "next/link";

export const metadata = {
  title: "Resources · EEGBase",
  description: "Blog, research, case studies, glossary, condition guides — everything in one place.",
};

const SECTIONS = [
  { title: "Blog",          desc: "Field notes, opinions, post-mortems",            href: "/blog",          color: "#7C3AED", icon: "✍" },
  { title: "Research",       desc: "Pre-prints, citations, RCT, registry",          href: "/research",      color: "#06B6D4", icon: "🔬" },
  { title: "Case studies",   desc: "Real outcomes from clinics using Mendi + EEGBase", href: "/case-studies", color: "#10B981", icon: "📊" },
  { title: "Conditions",     desc: "Protocols + outcomes by condition (ADHD, anxiety, sleep…)", href: "/conditions", color: "#2563EB", icon: "🧠" },
  { title: "Glossary",       desc: "Plain-English definitions for 45+ terms",       href: "/glossary",      color: "#F59E0B", icon: "📖" },
  { title: "Comparisons",    desc: "Honest side-by-sides vs SimplePractice, TherapyNotes, Myndlift, NeuroGuide…", href: "/vs", color: "#E11D48", icon: "⚖" },
  { title: "Downloads",      desc: "BIDS-fNIRS sample, IRB packet, brand assets",   href: "/downloads",     color: "#84CC16", icon: "↓" },
  { title: "Roadmap",        desc: "What ships next + clinician-vote rankings",      href: "/roadmap",        color: "#A855F7", icon: "🗺" },
  { title: "Calculators",     desc: "Insurance estimator + CPT-code lookup",        href: "/calculators",    color: "#0EA5E9", icon: "🧮" },
];

export default function ResourcesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Resources hub</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Everything we publish, in one place</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Educational content, comparisons, primary research, and practical tools.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
              <article style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, height: "100%", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{s.title}</h2>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.55 }}>{s.desc}</p>
                  <p style={{ fontSize: 12, color: s.color, fontWeight: 700, marginTop: 8 }}>Open →</p>
                </div>
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
