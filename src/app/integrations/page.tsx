import Link from "next/link";

export const metadata = {
  title: "Integrations · EEGBase",
  description: "Every device, EHR, AI, and payer that EEGBase supports.",
};

type Status = "live" | "beta" | "planned";

type Tile = { name: string; cat: string; status: Status; sub?: string };

const TILES: Tile[] = [
  // Hardware — fNIRS
  { name: "Mendi v3",         cat: "fNIRS hardware", status: "live",    sub: "Flagship · 25 Hz · Fp1/Fp2" },
  { name: "NIRx NIRScout",    cat: "fNIRS hardware", status: "beta",    sub: "Research · 8–48 channels" },
  { name: "Artinis Brite",    cat: "fNIRS hardware", status: "beta",    sub: "Wearable Brite MKIII" },
  { name: "Kernel Flow",      cat: "fNIRS hardware", status: "planned", sub: "Q4 2026" },

  // Hardware — EEG
  { name: "Muse 2 / S Athena", cat: "EEG hardware", status: "live",    sub: "4-ch · 256 Hz" },
  { name: "OpenBCI Cyton",    cat: "EEG hardware", status: "live",    sub: "8-ch · 250 Hz" },
  { name: "Neurosity Crown",  cat: "EEG hardware", status: "beta",    sub: "8-ch · developer" },
  { name: "Sens.ai",          cat: "EEG hardware", status: "planned", sub: "Q4 2026 · EEG + HRV + PBM" },
  { name: "Bittium Faros",    cat: "EEG hardware", status: "planned", sub: "Research-grade ECG/EEG" },

  // HRV / Wearables
  { name: "Polar H10",        cat: "HRV / wearables", status: "live", sub: "Chest strap · 1000 Hz RR" },
  { name: "Polar OH1",        cat: "HRV / wearables", status: "live", sub: "Optical forearm" },
  { name: "Apple HealthKit",  cat: "HRV / wearables", status: "live", sub: "iOS · sleep + HRV + mindful" },
  { name: "Oura Ring",        cat: "HRV / wearables", status: "live", sub: "Sleep · body temp · HRV" },
  { name: "Whoop 4.0",        cat: "HRV / wearables", status: "live", sub: "Recovery · strain · sleep" },
  { name: "Garmin",           cat: "HRV / wearables", status: "beta", sub: "Stress · Body Battery" },
  { name: "Fitbit",           cat: "HRV / wearables", status: "beta", sub: "Sleep stages · SpO₂" },
  { name: "Empatica EmbracePlus", cat: "HRV / wearables", status: "planned", sub: "EDA · GSR" },

  // EHR / practice management
  { name: "SimplePractice",   cat: "EHR / PM", status: "live",    sub: "Migration importer · sync" },
  { name: "TherapyNotes",     cat: "EHR / PM", status: "live",    sub: "Migration importer · sync" },
  { name: "Jane App",         cat: "EHR / PM", status: "live",    sub: "Two-way sync" },
  { name: "Alma",             cat: "EHR / PM", status: "live",    sub: "One-click client + claim sync" },
  { name: "TheraNest",        cat: "EHR / PM", status: "beta",    sub: "Two-way sync" },
  { name: "Epic (SMART-on-FHIR)", cat: "EHR / PM", status: "planned", sub: "Q3 2026 · FHIR R4" },
  { name: "Athenahealth",     cat: "EHR / PM", status: "planned", sub: "Q3 2026 · FHIR R4" },
  { name: "eClinicalWorks",   cat: "EHR / PM", status: "planned", sub: "Q4 2026" },

  // AI scribes
  { name: "Claude (Anthropic)", cat: "AI · LLM", status: "live", sub: "Haiku 4.5 · default" },
  { name: "GPT-4o (OpenAI)",   cat: "AI · LLM", status: "live", sub: "Fallback · BYO API key" },
  { name: "Mentalyc",          cat: "AI · LLM", status: "beta", sub: "External SOAP scribe via API" },
  { name: "Upheal",            cat: "AI · LLM", status: "planned", sub: "Q4 2026" },

  // Billing / payer
  { name: "Stedi",             cat: "Billing / payer", status: "live", sub: "270/271 eligibility · 837P" },
  { name: "Office Ally",       cat: "Billing / payer", status: "live", sub: "Clearinghouse · 4 payer types" },
  { name: "Apex EDI",          cat: "Billing / payer", status: "live", sub: "Clearinghouse" },
  { name: "Stripe",            cat: "Billing / payer", status: "live", sub: "Self-pay + Truemed HSA/FSA" },
  { name: "Truemed",           cat: "Billing / payer", status: "live", sub: "HSA/FSA for cash pay" },
  { name: "DrFirst (EPCS)",    cat: "Billing / payer", status: "planned", sub: "Q4 2026 · psychiatrists" },

  // Telehealth + comms
  { name: "Daily.co",          cat: "Telehealth · comms", status: "live", sub: "HIPAA video · BAA signed" },
  { name: "Resend",            cat: "Telehealth · comms", status: "live", sub: "Transactional email" },
  { name: "Slack",             cat: "Telehealth · comms", status: "beta", sub: "Notifications · webhook" },
  { name: "Zoom (HIPAA)",      cat: "Telehealth · comms", status: "planned", sub: "Q3 2026" },
  { name: "Twilio Messaging",  cat: "Telehealth · comms", status: "planned", sub: "Q4 2026 · SMS reminders" },

  // Auth / identity
  { name: "Okta",              cat: "Auth / identity", status: "live", sub: "SAML SSO" },
  { name: "Google Workspace",  cat: "Auth / identity", status: "live", sub: "OIDC SSO" },
  { name: "Microsoft Entra",   cat: "Auth / identity", status: "beta", sub: "SAML SSO" },

  // Data / research
  { name: "BIDS-fNIRS (BEP-030)", cat: "Data / research", status: "live", sub: "SNIRF + JSON sidecar" },
  { name: "OpenNeuro",         cat: "Data / research", status: "live", sub: "DataLad · DOI" },
  { name: "OSF",               cat: "Data / research", status: "live", sub: "Pre-registration mirror" },
  { name: "ClinicalTrials.gov", cat: "Data / research", status: "live", sub: "Pre-registration assist" },
  { name: "MNE-Python",        cat: "Data / research", status: "live", sub: "BIDS export · MNE-NIRS 0.5+" },

  // Calendar
  { name: "Google Calendar",   cat: "Calendar", status: "live", sub: "Two-way sync" },
  { name: "Outlook / Microsoft 365", cat: "Calendar", status: "live", sub: "Two-way sync" },
  { name: "Cal.com",            cat: "Calendar", status: "beta", sub: "Public booking integration" },

  // Notifications
  { name: "Plausible",         cat: "Analytics · privacy-first", status: "live", sub: "Cookieless · EU-hosted" },
];

const STATUS_STYLE: Record<Status, { bg: string; fg: string; label: string }> = {
  live:    { bg: "#DCFCE7", fg: "#15803D", label: "LIVE" },
  beta:    { bg: "#DBEAFE", fg: "#1D4ED8", label: "BETA" },
  planned: { bg: "#FEF3C7", fg: "#92400E", label: "PLANNED" },
};

export default function IntegrationsPage() {
  const cats = Array.from(new Set(TILES.map((t) => t.cat)));
  const liveCount = TILES.filter((t) => t.status === "live").length;
  const betaCount = TILES.filter((t) => t.status === "beta").length;
  const plannedCount = TILES.filter((t) => t.status === "planned").length;

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
          <Link href="/api-docs" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>API →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Integrations · {TILES.length} total</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Everything we plug into</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 24, maxWidth: 720 }}>
          {liveCount} live · {betaCount} beta · {plannedCount} planned. Don&apos;t see your tool? <a href="mailto:integrations@eegbase.com" style={{ color: "#2563EB" }}>Email us</a> — most adapters take ~1 sprint.
        </p>

        {cats.map((cat) => (
          <section key={cat} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>{cat}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {TILES.filter((t) => t.cat === cat).map((t) => {
                const s = STATUS_STYLE[t.status];
                return (
                  <div key={t.name} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 14, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{t.name}</div>
                      <span style={{ fontSize: 8, fontWeight: 800, color: s.fg, padding: "2px 6px", background: s.bg, borderRadius: 4, letterSpacing: "0.06em" }}>{s.label}</span>
                    </div>
                    {t.sub && <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.45 }}>{t.sub}</div>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div style={{ marginTop: 36, padding: 20, background: "white", border: "1px solid #E5E7EB", borderRadius: 14, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Build your own adapter</h2>
          <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 16, maxWidth: 560, margin: "0 auto 16px" }}>
            Public TypeScript adapter SDK ships with the API beta. ~200 lines of code to add a new BLE device.
          </p>
          <Link href="/api-docs" style={{ display: "inline-block", padding: "10px 18px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            See API docs →
          </Link>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/api-docs" style={{ color: "#9CA3AF" }}>API</Link>
      </footer>
    </div>
  );
}
