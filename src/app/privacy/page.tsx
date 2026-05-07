import Link from "next/link";

export const metadata = {
  title: "Privacy · EEGBase",
  description: "How EEGBase handles personal and clinical data.",
};

export default function PrivacyPage() {
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
          <Link href="/terms" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Terms →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Last updated · May 2026</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 28 }}>Privacy Notice</h1>

        <Section title="The short version">
          <ul style={{ listStyle: "disc", paddingLeft: 20, color: "#374151", lineHeight: 1.7, fontSize: 15 }}>
            <li>We don&apos;t sell, rent, or trade personal data. Ever.</li>
            <li>EEGBase is open-source and self-hostable. If you self-host, your patient data never reaches us.</li>
            <li>If you use the managed version, we&apos;re a HIPAA Business Associate and operate under a signed BAA.</li>
            <li>EU clinic data lives in Frankfurt (eu-west-3). US clinic data lives in us-east-1.</li>
            <li>We honor data deletion requests within 30 days. Patient records owned by clinics; clinics own deletion authority.</li>
          </ul>
        </Section>

        <Section title="Who we are">
          <p>EEGBase is operated by EEGBase, Inc. (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;), a Delaware corporation with operations in the United States and the European Union. Contact: <a href="mailto:hello@eegbase.com" style={{ color: "#2563EB" }}>hello@eegbase.com</a>. Data Protection Officer: <a href="mailto:dpo@eegbase.com" style={{ color: "#2563EB" }}>dpo@eegbase.com</a>.</p>
        </Section>

        <Section title="What we collect">
          <p><strong>From clinicians (account holders):</strong> name, email, phone, organization, payment method, IP address, browser fingerprint for security.</p>
          <p style={{ marginTop: 10 }}><strong>From clinic patients:</strong> only what the clinician chooses to enter — typically name, date of birth, condition, sessions, signal recordings, outcome scores. Patient consent is collected by the clinician before data enters EEGBase.</p>
          <p style={{ marginTop: 10 }}><strong>Aggregate analytics:</strong> page views, feature usage, error logs. We use Plausible (cookie-less) for analytics. We do not use Google Analytics or Facebook tracking pixels.</p>
        </Section>

        <Section title="Why we collect it">
          <p>Provide the service · operate billing · respond to support requests · meet legal obligations (HIPAA, GDPR, PHIPA, 42 CFR Part 2 where applicable) · improve product quality through aggregate analytics.</p>
        </Section>

        <Section title="Where data lives">
          <p>Three regions:</p>
          <ul style={{ listStyle: "disc", paddingLeft: 20, color: "#374151", lineHeight: 1.7, fontSize: 15, marginTop: 6 }}>
            <li><strong>United States</strong> · AWS us-east-1 (Tier IV) · primary region</li>
            <li><strong>European Union</strong> · AWS eu-west-3 Frankfurt · GDPR-compliant · Schrems II SCCs (2021/914) on file · no transatlantic transfers without DPA</li>
            <li><strong>Canada</strong> · AWS ca-central-1 · PHIPA-compliant</li>
          </ul>
          <p style={{ marginTop: 10 }}>Encryption at rest: AES-256-GCM. In transit: TLS 1.3 with forward secrecy. Cross-AZ failover tested monthly. RTO 15 minutes, RPO 5 minutes.</p>
        </Section>

        <Section title="Who we share with">
          <p>We share data with subprocessors only as needed to deliver the service. All subprocessors are bound by a DPA and SCCs:</p>
          <ul style={{ listStyle: "disc", paddingLeft: 20, color: "#374151", lineHeight: 1.7, fontSize: 15, marginTop: 6 }}>
            <li>Amazon Web Services (hosting)</li>
            <li>Stripe (billing)</li>
            <li>Daily.co (HIPAA-BAA video)</li>
            <li>Resend (transactional email)</li>
            <li>Plausible (privacy-first analytics)</li>
            <li>Anthropic (AI features · only de-identified content)</li>
          </ul>
          <p style={{ marginTop: 10 }}>We do not share with advertisers, data brokers, or for-profit analytics platforms.</p>
        </Section>

        <Section title="Your rights">
          <p>Under GDPR, CCPA, PHIPA, and HIPAA, you have the right to access, correct, delete, port, and restrict processing of your personal data. Email <a href="mailto:dpo@eegbase.com" style={{ color: "#2563EB" }}>dpo@eegbase.com</a> with a verifiable request. We respond within 30 days.</p>
        </Section>

        <Section title="Breach notification">
          <p>Per GDPR Art. 33 and HIPAA Breach Notification Rule, we notify affected clinics within 72 hours of confirmed unauthorized access. Public RCAs ship within 5 business days at <Link href="/status" style={{ color: "#2563EB" }}>status.eegbase.com</Link>.</p>
        </Section>

        <Section title="Changes">
          <p>We&apos;ll notify clinic admins by email at least 30 days before any material change to this notice. Historical versions are kept on GitHub.</p>
        </Section>

        <p style={{ marginTop: 40, fontSize: 13, color: "#94A3B8", textAlign: "center" }}>
          This is the public privacy notice. The full HIPAA-BAA is exchanged before sign-up.
        </p>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/terms" style={{ color: "#9CA3AF" }}>Terms</Link> · <a href="https://github.com/eegbase/eegbase" style={{ color: "#9CA3AF" }}>GitHub</a>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32, paddingBottom: 24, borderBottom: "1px solid #E5E7EB" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 12 }}>{title}</h2>
      <div style={{ color: "#374151", lineHeight: 1.7, fontSize: 15 }}>{children}</div>
    </section>
  );
}
