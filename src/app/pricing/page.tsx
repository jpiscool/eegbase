import Link from "next/link";
import { CurrencyTogglePricing } from "@/components/CurrencyTogglePricing";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata = {
  title: "Pricing · EEGBase",
  description: "Simple, transparent pricing for EEGBase. Solo $19/session · Practice $349/clinic/mo · Enterprise custom · 30-day free trial · no card required.",
};

const FEATURE_MATRIX = [
  { feat: "Live fNIRS / EEG / HRV streaming",       solo: true,  practice: true,  ent: true  },
  { feat: "AI cross-session pattern detector",      solo: true,  practice: true,  ent: true  },
  { feat: "Ambient SOAP scribe (6 formats)",         solo: true,  practice: true,  ent: true  },
  { feat: "BIDS / SNIRF / EDF+ export",             solo: true,  practice: true,  ent: true  },
  { feat: "HIPAA video co-feedback",                solo: true,  practice: true,  ent: true  },
  { feat: "30-day free trial · no card",            solo: true,  practice: true,  ent: true  },
  { feat: "Number of clinicians",                   solo: "1",   practice: "5",   ent: "Unlimited" },
  { feat: "Number of clients",                      solo: "25",  practice: "Unlimited", ent: "Unlimited" },
  { feat: "CMS-1500 + ERA + claim tracking",        solo: false, practice: true,  ent: true  },
  { feat: "Group + couples + family modes",         solo: false, practice: true,  ent: true  },
  { feat: "Coaching marketplace seat",              solo: false, practice: true,  ent: true  },
  { feat: "Multi-location support",                 solo: false, practice: true,  ent: true  },
  { feat: "Outcomes-registry export",               solo: "Self-only", practice: "Clinic", ent: "Multi-clinic" },
  { feat: "White-label / custom branding",          solo: false, practice: false, ent: true  },
  { feat: "SSO + SAML + IP allowlist",              solo: false, practice: false, ent: true  },
  { feat: "Custom DPA + 42 CFR Part 2",             solo: false, practice: false, ent: true  },
  { feat: "99.97% uptime SLA + dedicated CSM",      solo: false, practice: false, ent: true  },
  { feat: "Multi-region · RTO 15 min",              solo: false, practice: false, ent: true  },
];

const FAQ = [
  { q: "What's the difference between Solo per-session and Solo monthly?", a: "Pay-per-session at $19 has no monthly commitment — perfect for trial periods or pilot programs. Solo monthly at $149/mo includes 25 client slots and unlimited sessions for one clinician." },
  { q: "Are there discounts for Mendi-attached clinics?", a: "Yes — 20% off Practice and Enterprise tiers when at least 30% of your active sessions use Mendi hardware. Auto-applied based on session telemetry." },
  { q: "What payment methods do you accept?", a: "Stripe handles all billing — credit/debit, ACH, wire, and Truemed HSA/FSA for cash-pay patients. Annual invoicing available on Practice and above." },
  { q: "Can I downgrade or cancel?", a: "Anytime. Cancel and your account stays active through the end of the paid period. Full refund within 30 days of first paid invoice. Your data remains exportable for 90 days after cancellation." },
  { q: "What's not included?", a: "Hardware (Mendi/Muse/Polar). Insurance reimbursement is between you and your payer (we just generate the claim). EPCS/PDMP for psychiatrists ships Q4 2026 (not yet available)." },
  { q: "Do you have an enterprise SLA?", a: "Yes. Enterprise plans include 99.97% uptime SLA, dedicated CSM, custom DPA, signed BAA, and 4-hour P0 incident response. Contact sales for the full SLA matrix." },
];

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
          <Link href="/calculators" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>ROI calculator →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Pricing</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12, textAlign: "center" }}>Simple, transparent pricing</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          Free for licensed clinicians during private beta · paid plans launch Q3 2026.
        </p>

        <CurrencyTogglePricing />

        {/* Feature comparison matrix */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginTop: 56, marginBottom: 16, textAlign: "center" }}>What's included in each tier</h2>
        <div style={{ overflow: "auto", background: "white", border: "1px solid #E5E7EB", borderRadius: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th style={{ textAlign: "left", padding: 14, fontWeight: 800, color: "#475569", borderBottom: "1px solid #E5E7EB" }}>Feature</th>
                <th style={{ padding: 14, fontWeight: 800, color: "#475569", borderBottom: "1px solid #E5E7EB", width: 110 }}>Solo</th>
                <th style={{ padding: 14, fontWeight: 800, color: "#2563EB", borderBottom: "1px solid #E5E7EB", width: 110 }}>Practice</th>
                <th style={{ padding: 14, fontWeight: 800, color: "#7C3AED", borderBottom: "1px solid #E5E7EB", width: 110 }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row, i) => (
                <tr key={row.feat} style={{ borderTop: i === 0 ? "none" : "1px solid #F3F4F6" }}>
                  <td style={{ padding: "10px 14px", color: "#0F172A" }}>{row.feat}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}><Cell v={row.solo} /></td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}><Cell v={row.practice} /></td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}><Cell v={row.ent} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Billing FAQ */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginTop: 56, marginBottom: 16, textAlign: "center" }}>Billing FAQ</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 720, margin: "0 auto" }}>
          {FAQ.map((f) => (
            <details key={f.q} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, color: "#0F172A", fontSize: 14, listStyle: "none" }}>{f.q}</summary>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginTop: 10 }}>{f.a}</p>
            </details>
          ))}
        </div>

        {/* Waitlist */}
        <section style={{ background: "linear-gradient(135deg, #ECFEFF, #EFF6FF)", border: "1px solid #BFDBFE", borderRadius: 16, padding: 28, marginTop: 56, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>Get notified at launch</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Be one of the first 200 clinicians</h2>
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginBottom: 16, maxWidth: 480, margin: "0 auto 16px" }}>
            Paid plans open Q3 2026. Join the waitlist for private-beta seats and early-access pricing.
          </p>
          <WaitlistForm variant="compact" />
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link>
      </footer>
    </div>
  );
}

function Cell({ v }: { v: boolean | string }) {
  if (v === true)  return <span style={{ color: "#10B981", fontSize: 18, fontWeight: 800 }}>✓</span>;
  if (v === false) return <span style={{ color: "#CBD5E1", fontSize: 14 }}>—</span>;
  return <span style={{ color: "#0F172A", fontSize: 12, fontWeight: 600 }}>{v}</span>;
}
