import Link from "next/link";

export const metadata = {
  title: "Partners · EEGBase",
  description: "Hardware, AI, billing, regulatory, and distribution partners powering EEGBase.",
};

const GROUPS = [
  {
    title: "Hardware",
    sub: "Devices we natively support",
    items: [
      { name: "Mendi",         desc: "fNIRS prefrontal · co-branded clinical channel · pending Mendi SDK", status: "planned", color: "#7C3AED" },
      { name: "Muse / Athena",  desc: "EEG · 4-channel · home-use friendly",          status: "live", color: "#06B6D4" },
      { name: "Polar",         desc: "HRV · chest strap + optical forearm",            status: "live", color: "#EF4444" },
      { name: "OpenBCI",       desc: "8-channel EEG · open-design hardware (theirs)",  status: "live", color: "#10B981" },
      { name: "NIRx",          desc: "Research-grade fNIRS · 8–48 channels",           status: "beta", color: "#F59E0B" },
      { name: "Artinis",       desc: "Wearable Brite MKIII fNIRS",                     status: "beta", color: "#06B6D4" },
    ],
  },
  {
    title: "AI · LLM",
    sub: "Powering the AI scribe + cross-session pattern detector",
    items: [
      { name: "Anthropic · Claude",  desc: "Default LLM · Haiku 4.5 for ambient scribe", status: "live", color: "#D97706" },
      { name: "OpenAI · GPT-4o",     desc: "Fallback · BYO API key",                     status: "live", color: "#10B981" },
    ],
  },
  {
    title: "Billing · payer",
    sub: "Insurance and payment plumbing",
    items: [
      { name: "Stripe",        desc: "Self-pay + Truemed HSA/FSA",                     status: "live", color: "#635BFF" },
      { name: "Stedi",         desc: "270/271 eligibility · 837P submission",          status: "live", color: "#0EA5E9" },
      { name: "Office Ally",   desc: "Clearinghouse · 4 payer types",                  status: "live", color: "#F59E0B" },
      { name: "Truemed",       desc: "HSA/FSA flow for cash-pay clinics",              status: "live", color: "#10B981" },
      { name: "DrFirst",       desc: "EPCS + PDMP · psychiatrist-friendly",            status: "planned", color: "#A78BFA" },
    ],
  },
  {
    title: "Regulatory · audit",
    sub: "Independent verification of our security + compliance posture",
    items: [
      { name: "Coalfire",      desc: "SOC 2 Type II audit · Q3 2026",                  status: "live", color: "#16A34A" },
      { name: "Bishop Fox",    desc: "Pen-test · Q3 2026 · attestation NDA-gated",     status: "live", color: "#DC2626" },
      { name: "Deque",         desc: "WCAG 2.2 AA accessibility audit",                status: "live", color: "#7C3AED" },
    ],
  },
  {
    title: "Distribution · clinical channel",
    sub: "How clinicians and clinics find us",
    items: [
      { name: "BCIA",          desc: "Biofeedback Certification International Alliance · listing pending", status: "planned", color: "#06B6D4" },
      { name: "ISNR",          desc: "International Society for Neuroregulation · directory",            status: "planned", color: "#10B981" },
      { name: "AAPB",          desc: "Assoc. for Applied Psychophysiology & Biofeedback",                status: "planned", color: "#F59E0B" },
      { name: "Psychology Today", desc: "Directory sync for clinic public profiles",                     status: "live", color: "#3B82F6" },
    ],
  },
];

const STATUS = {
  live:    { bg: "#DCFCE7", fg: "#15803D", label: "LIVE" },
  beta:    { bg: "#DBEAFE", fg: "#1D4ED8", label: "BETA" },
  planned: { bg: "#FEF3C7", fg: "#92400E", label: "PLANNED" },
} as const;

export default function PartnersPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/integrations" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Integration list →</Link>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Partners</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>The ecosystem we stand on</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          Hardware, AI, billing, regulatory, and clinical-channel partners. We don't pretend to make all the things we sit on. We make the clinical layer that ties them together.
        </p>

        {GROUPS.map((g) => (
          <section key={g.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>{g.title}</h2>
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 14 }}>{g.sub}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {g.items.map((item) => {
                const s = STATUS[item.status as keyof typeof STATUS];
                return (
                  <div key={item.name} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 99, background: item.color, flexShrink: 0 }} />
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{item.name}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: s.fg, padding: "2px 7px", background: s.bg, borderRadius: 4, letterSpacing: "0.06em" }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.55, marginLeft: 16 }}>{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section style={{ marginTop: 36, background: "linear-gradient(135deg, #FEF3C7, #FFFBEB)", border: "1px solid #FCD34D", borderRadius: 16, padding: 24, textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Want to partner with us?</h2>
          <p style={{ fontSize: 14, color: "#78350F", lineHeight: 1.6, marginBottom: 16, maxWidth: 560, margin: "0 auto 16px" }}>
            Hardware vendor with a BLE device? AI tool with a clinical use case? Payer with a bundled-payment program? We're especially interested in fNIRS hardware, telehealth, and EU clinical channels.
          </p>
          <Link href="/contact?role=partner" style={{ display: "inline-block", padding: "10px 18px", background: "#92400E", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Talk to us →</Link>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}
