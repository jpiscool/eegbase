import Link from "next/link";

export const metadata = {
  title: "Pricing · EEGBase",
  description: "EEGBase is free. Every feature, every device, no card required.",
};

export default function PricingPage() {
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
          <Link href="/demo" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Try the demo →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Pricing</p>
        <h1 style={{ fontSize: 56, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 16 }}>
          It&rsquo;s free.
        </h1>
        <p style={{ fontSize: 18, color: "#475569", lineHeight: 1.65, marginBottom: 32, maxWidth: 540, margin: "0 auto 32px" }}>
          Every feature. Every device. Every clinician on your team. No card, no trial limit, no &ldquo;contact sales&rdquo;.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/demo" style={{ display: "inline-block", padding: "14px 22px", background: "#2563EB", color: "white", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Open the demo
          </Link>
          <Link href="/" style={{ display: "inline-block", padding: "14px 22px", background: "white", color: "#0F172A", border: "1px solid #E5E7EB", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Back to home
          </Link>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
