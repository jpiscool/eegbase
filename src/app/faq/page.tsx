import Link from "next/link";
import { SearchableFAQ } from "@/components/SearchableFAQ";

export const metadata = {
  title: "FAQ · EEGBase",
  description: "Common questions about EEGBase — setup, security, pricing, migration, clinical use, research integration.",
};

export default function FaqPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/contact" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Still have questions? →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>FAQ</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Common questions</h1>
        <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.7, marginBottom: 36 }}>
          Search 18 questions across setup, security, migration, clinical use, and research. Don't see yours? <Link href="/contact" style={{ color: "#2563EB" }}>Email us</Link> — we respond within 24 hours.
        </p>

        <SearchableFAQ />
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
