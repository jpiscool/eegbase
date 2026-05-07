import Link from "next/link";

export const metadata = {
  title: "Downloads · EEGBase",
  description: "Sample artifacts for clinical and research evaluation.",
};

const FILES = [
  {
    name: "BIDS-fNIRS sidecar (sample)",
    file: "sub-021_ses-08_task-focus_nirs.json",
    desc: "Real-shape JSON sidecar conformant to BIDS-fNIRS Extension Proposal 30 (BEP-030). Includes Mendi v3 hardware metadata, motion-artifact rejection statistics, preprocessing pipeline, subject demographics, and outcome measures.",
    audience: "fNIRS researchers · BIDS validators · regulatory reviewers",
    size: "1.8 KB",
    icon: "🧠",
    tag: "JSON · BIDS-fNIRS",
    color: "#7C3AED",
  },
  {
    name: "IRB application packet (sample)",
    file: "EEGBase-Mendi-IRB-Packet-Sample.docx",
    desc: "Sample IRB submission packet for the proposed multi-clinic naturalistic registry of home-use Mendi fNIRS in adolescent ADHD. 12 sections including aims, procedures, data management, DSMP, and conflict-of-interest disclosure.",
    audience: "Mendi science team · clinic IRBs · co-investigators",
    size: "16 KB · 12 pages",
    icon: "📋",
    tag: "DOCX · IRB",
    color: "#10B981",
  },
];

export default function DownloadsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase Downloads</span>
          </Link>
          <Link href="/mendi" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Partnership →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Public artifacts</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Downloads</h1>
        <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Concrete artifacts for evaluating the platform. SOC 2 + Bishop Fox + DPA documents are NDA-gated — email{" "}
          <a href="mailto:hello@eegbase.com" style={{ color: "#2563EB" }}>hello@eegbase.com</a> for access.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {FILES.map((f) => (
            <article key={f.file} style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 20, padding: 20, background: "white", border: "1px solid #E5E7EB", borderRadius: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: 12, background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{f.icon}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>{f.name}</h2>
                  <span style={{ fontSize: 9, fontWeight: 700, color: f.color, padding: "2px 7px", background: `${f.color}15`, borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.tag}</span>
                </div>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginBottom: 8 }}>{f.desc}</p>
                <p style={{ fontSize: 11, color: "#94A3B8" }}>
                  <strong style={{ color: "#475569" }}>For:</strong> {f.audience}  ·  {f.size}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <a
                  href={`/downloads/${f.file}`}
                  download
                  style={{ padding: "10px 16px", background: f.color, color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  Download ↓
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* NDA-gated section */}
        <section style={{ marginTop: 36, padding: 20, background: "linear-gradient(135deg, #FEF3C7, #FFFBEB)", border: "1px solid #FCD34D", borderRadius: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>NDA-gated</p>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Compliance documents available on request</h2>
          <p style={{ fontSize: 13, color: "#78350F", lineHeight: 1.6, marginBottom: 12 }}>
            SOC 2 Type II report (Coalfire, Q1 2026) · Bishop Fox pen-test attestation · HIPAA risk assessment · GDPR DPA + EU SCCs · Master Service Agreement template. Mutual NDA prerequisite.
          </p>
          <a href="mailto:legal@eegbase.com?subject=Mutual%20NDA%20%2B%20compliance%20docs%20request" style={{ display: "inline-block", padding: "10px 16px", background: "#92400E", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Request NDA + docs →
          </a>
        </section>

        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 32, textAlign: "center", lineHeight: 1.7 }}>
          Sample BIDS sidecar uses de-identified illustrative data per HIPAA Safe Harbor + Expert Determination.<br />
          IRB packet bracketed-placeholder fields ({"[Insert ...]"}) replaced with real personnel before any IRB submission.
        </p>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/mendi" style={{ color: "#9CA3AF" }}>Partnership</Link>
      </footer>
    </div>
  );
}
