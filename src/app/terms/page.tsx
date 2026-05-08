import Link from "next/link";

export const metadata = {
  title: "Terms · EEGBase",
  description: "Terms of service for the EEGBase platform.",
};

export default function TermsPage() {
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
          <Link href="/privacy" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Privacy →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Last updated · May 2026</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 28 }}>Terms of Service</h1>

        <S title="Plain-English summary">
          <ul style={{ listStyle: "disc", paddingLeft: 20, color: "#374151", lineHeight: 1.7, fontSize: 15 }}>
            <li>EEGBase is a software platform — not a medical device. Clinical judgment always rests with the licensed clinician.</li>
            <li>The hosted service requires an account. Self-hosting is free under MIT.</li>
            <li>You own your clinic's data. We're a custodian, not the owner.</li>
            <li>30-day free trial · no card · cancel anytime.</li>
            <li>If something goes seriously wrong, our liability is capped at fees paid in the last 12 months.</li>
          </ul>
        </S>

        <S title="1 · The service">
          <p>EEGBase provides a clinical software platform for licensed clinicians to operate neurofeedback practices. The service includes session streaming, clinical documentation, billing, analytics, and research-registry features.</p>
          <p style={{ marginTop: 10 }}>EEGBase is <strong>not a medical device</strong> and does not diagnose, treat, cure, or prevent any disease. Hardware partners (Mendi, Muse, Polar, etc.) handle their own regulatory classifications.</p>
        </S>

        <S title="2 · Eligibility">
          <p>You must be a licensed clinician, a credentialed staff member, or a research investigator with appropriate IRB approval. We reserve the right to verify credentials and to suspend accounts that do not meet eligibility.</p>
        </S>

        <S title="3 · Account & security">
          <p>You're responsible for keeping your credentials private and for all activity under your account. Two-factor authentication is enforced for all clinical seats. Auto-logout fires after 15 minutes of inactivity. Notify us within 24 hours of any suspected compromise.</p>
        </S>

        <S title="4 · Acceptable use">
          <p>Don't reverse-engineer, attempt to derive source from compiled binaries (the source is public — read it on GitHub), enter the data of patients without lawful basis, attempt to circumvent access controls, or use the service for any unlawful purpose. We may suspend accounts that violate this section.</p>
        </S>

        <S title="5 · Pricing & billing">
          <p>Pricing is published at <Link href="/#pricing" style={{ color: "#2563EB" }}>eegbase.com/#pricing</Link>. Monthly plans renew automatically; annual plans renew at the displayed annual rate. Cancel anytime — your account remains active through the end of the paid period. Refunds: full refund within 30 days of first paid invoice.</p>
        </S>

        <S title="6 · Data ownership & portability">
          <p>You own all data you enter or generate via the service. We provide one-click export to BIDS-fNIRS, SNIRF, EDF+, CSV, and PDF at any time. If you cancel, you retain export rights for 90 days; after that we permanently delete clinic-level data within 30 days unless you request earlier deletion.</p>
        </S>

        <S title="7 · HIPAA / BAA">
          <p>If you use the hosted service to store PHI, we'll execute a Business Associate Agreement before activation. Contact <a href="mailto:hello@eegbase.com" style={{ color: "#2563EB" }}>hello@eegbase.com</a>.</p>
        </S>

        <S title="8 · Open-source license">
          <p>The EEGBase codebase is released under the MIT license. You may fork, self-host, modify, and redistribute under the terms of MIT. Self-hosted deployments are not covered by our hosted-service terms — you operate them at your own risk and under your own compliance posture.</p>
        </S>

        <S title="9 · Warranty disclaimer">
          <p style={{ textTransform: "uppercase", fontSize: 12, lineHeight: 1.7 }}>The service is provided &quot;as is&quot; without warranty of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement.</p>
        </S>

        <S title="10 · Limitation of liability">
          <p>Our aggregate liability is capped at the fees you paid us in the 12 months preceding the event giving rise to the claim. We are not liable for indirect, consequential, or punitive damages, except where prohibited by law.</p>
        </S>

        <S title="11 · Governing law">
          <p>These Terms are governed by the laws of the State of Delaware, USA, without regard to its conflict of laws principles. EU clinics may exercise GDPR rights as set out in the Privacy Notice.</p>
        </S>

        <S title="12 · Changes">
          <p>We'll notify clinic admins by email at least 30 days before any material change. Continued use after the effective date constitutes acceptance.</p>
        </S>

        <S title="13 · Contact">
          <p>Legal: <a href="mailto:legal@eegbase.com" style={{ color: "#2563EB" }}>legal@eegbase.com</a> · Support: <a href="mailto:hello@eegbase.com" style={{ color: "#2563EB" }}>hello@eegbase.com</a> · DPO: <a href="mailto:dpo@eegbase.com" style={{ color: "#2563EB" }}>dpo@eegbase.com</a></p>
        </S>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/privacy" style={{ color: "#9CA3AF" }}>Privacy</Link> · <a href="https://github.com/jpiscool/eegbase" style={{ color: "#9CA3AF" }}>GitHub</a>
      </footer>
    </div>
  );
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32, paddingBottom: 24, borderBottom: "1px solid #E5E7EB" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 12 }}>{title}</h2>
      <div style={{ color: "#374151", lineHeight: 1.7, fontSize: 15 }}>{children}</div>
    </section>
  );
}
