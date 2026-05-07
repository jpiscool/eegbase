import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", letterSpacing: "0.2em", marginBottom: 14, textTransform: "uppercase" }}>404 · Not found</p>
        <h1 style={{ fontSize: 56, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 16 }}>
          Off-protocol.
        </h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 28 }}>
          That page doesn&apos;t exist — or hasn&apos;t shipped yet. The good news: the live demo, the partnership doc, and the source code all do.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 }}>
          <Link href="/demo" style={{ padding: "12px 20px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Open the live demo →
          </Link>
          <Link href="/" style={{ padding: "12px 20px", background: "white", border: "1px solid #E5E7EB", color: "#374151", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Back home
          </Link>
        </div>
        <p style={{ fontSize: 12, color: "#94A3B8" }}>
          Looking for something specific? <a href="mailto:hello@eegbase.com" style={{ color: "#2563EB", textDecoration: "underline" }}>hello@eegbase.com</a>
        </p>
        {/* Decorative offset signal-line */}
        <svg viewBox="0 0 400 60" width="100%" height="60" style={{ marginTop: 36, opacity: 0.5 }}>
          <path d="M 0,30 L 60,28 L 110,42 L 150,18 L 200,52 L 250,12 L 310,38 L 360,28 L 400,30" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="150" y1="0" x2="150" y2="60" stroke="#EF4444" strokeWidth="0.6" strokeDasharray="3 3"/>
          <text x="155" y="10" fontSize="9" fill="#EF4444" fontWeight="700">drift detected</text>
        </svg>
      </div>
    </div>
  );
}
