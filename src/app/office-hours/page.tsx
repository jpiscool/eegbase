import Link from "next/link";

export const metadata = {
  title: "Office hours · EEGBase",
  description: "Public weekly drop-in sessions with the EEGBase team. Free, 30 minutes, no agenda.",
};

const SLOTS = [
  { day: "Tuesday",  time: "11:00 AM PT · 2:00 PM ET · 7:00 PM UTC", host: "Founder · Engineering",  topic: "Anything technical · API · self-hosting · adapters" },
  { day: "Thursday", time: "9:00 AM PT · 12:00 PM ET · 4:00 PM UTC", host: "Clinical advisor (BCN)", topic: "Clinical workflow questions · protocols · CPT billing" },
  { day: "Friday",   time: "1:00 PM PT · 4:00 PM ET · 8:00 PM UTC",  host: "Research advisor (PhD)",  topic: "Research, IRB, registry, BIDS-fNIRS · co-authorship" },
];

export default function OfficeHoursPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/contact" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Async contact →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Public office hours</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Drop in. Ask anything. Free.</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 28, maxWidth: 720 }}>
          We hold three weekly public office hours. Free, 30 minutes, no agenda. Whether you're a clinician evaluating us, a researcher considering the registry, or a developer poking at the API — show up, ask anything.
        </p>

        {/* Slots */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
          {SLOTS.map((s, i) => (
            <article key={s.day} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 18, position: "relative" }}>
              <span style={{ position: "absolute", top: 14, right: 14, fontSize: 9, fontWeight: 800, color: "#10B981", padding: "2px 7px", background: "#DCFCE7", borderRadius: 4, letterSpacing: "0.06em" }}>WEEKLY</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>{s.day}</h2>
              <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>{s.time}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Host</p>
              <p style={{ fontSize: 13, color: "#0F172A", marginBottom: 10 }}>{s.host}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Best for</p>
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.55, marginBottom: 14 }}>{s.topic}</p>
              <Link href={`/contact?role=other`} style={{ display: "block", padding: "8px 14px", background: ["#2563EB", "#10B981", "#7C3AED"][i % 3], color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                Reserve a slot →
              </Link>
            </article>
          ))}
        </div>

        {/* What to expect */}
        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>What to expect</h2>
          <ul style={{ paddingLeft: 20, listStyle: "disc", color: "#475569", fontSize: 14, lineHeight: 1.8 }}>
            <li>30-minute Zoom (HIPAA-compliant variant for clinical-data demos)</li>
            <li>You don't prep anything · just show up with questions</li>
            <li>Recordings stay private unless you say otherwise</li>
            <li>If you bring a problem, we try to solve it on the call</li>
            <li>If we can't solve it on the call, we follow up by email within 48 hours</li>
            <li>No sales pitch unless you specifically ask · this is for genuine help</li>
          </ul>
        </section>

        <section style={{ background: "linear-gradient(135deg, #FEF3C7, #FFFBEB)", border: "1px solid #FCD34D", borderRadius: 14, padding: 18, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#78350F", lineHeight: 1.6 }}>
            Calendly links pending live setup. Until then, <Link href="/contact" style={{ color: "#92400E", textDecoration: "underline", fontWeight: 700 }}>send us three windows that work</Link> and we'll book it.
          </p>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
