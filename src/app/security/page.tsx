import Link from "next/link";

export const metadata = {
  title: "Security · EEGBase",
  description: "Threat model, vulnerability disclosure, and security posture.",
};

export default function SecurityPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase Security</span>
          </Link>
          <Link href="/privacy" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Privacy →</Link>
        </div>
      </header>

      <main id="main-content" style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Security posture</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Security at EEGBase</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>
          We treat security as a clinical-trust requirement, not a compliance checkbox. This page describes our threat model, posture, and disclosure process. Researchers welcome.
        </p>

        {/* Posture pills */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { tag: "🛡 HIPAA",       desc: "BAA available · audit log retention policy: 7 years (begins on launch)" },
            { tag: "🔒 SOC 2",        desc: "Type I scoping with Coalfire (Type II to follow) · Q3 2026 target · report NDA-gated on completion" },
            { tag: "🎯 Pen-test",    desc: "Independent web pentest · Q3 2026 target · vendor selection in progress" },
            { tag: "🇪🇺 Schrems II", desc: "EU SCCs (2021/914) · Frankfurt eu-west-3" },
            { tag: "♿ WCAG 2.2 AA", desc: "Deque audit planned Q3 2026 · VPAT 2.4 to follow" },
            { tag: "🔑 SSO",         desc: "SAML · Okta · Google · Microsoft Entra" },
            { tag: "🔐 At rest",     desc: "AES-256-GCM · keys rotated quarterly" },
            { tag: "🌐 In transit",  desc: "TLS 1.3 · forward secrecy · HSTS preload" },
          ].map((p) => (
            <div key={p.tag} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{p.tag}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{p.desc}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <Section title="Threat model">
          <p>The threats we explicitly defend against:</p>
          <ul style={{ listStyle: "disc", paddingLeft: 20, marginTop: 8, lineHeight: 1.8 }}>
            <li><strong>Unauthorized access to PHI</strong> — addressed via SSO + 2FA enforcement, IP allowlisting, role-based access control with least-privilege defaults, AES-256 at rest with HSM-backed keys.</li>
            <li><strong>Data exfiltration via supply chain</strong> — addressed via dependency pinning, automated SBOM (CycloneDX), Renovate auto-updates with security review, GitHub branch protection.</li>
            <li><strong>Compromised clinician device</strong> — auto-logout after 15 minutes idle, session token rotation, device-fingerprinted re-auth, suspicious-login email alerts.</li>
            <li><strong>Webhook tampering</strong> — HMAC-SHA256 signed bodies, timestamp window enforcement, IP allowlist available per webhook destination.</li>
            <li><strong>Cross-tenant data leakage</strong> — postgres row-level security on every table, contract tests in CI; internal red-team exercises planned to start once the team is staffed for them.</li>
          </ul>
        </Section>

        <Section title="Vulnerability disclosure">
          <p>We welcome responsible vulnerability disclosure from security researchers. Email <a href="mailto:hello@eegbase.com?subject=Security%20disclosure" style={{ color: "#2563EB" }}>hello@eegbase.com</a> (subject: Security disclosure) or use the <a href="/.well-known/security.txt" style={{ color: "#2563EB" }}>security.txt</a> contact.</p>
          <p style={{ marginTop: 12 }}><strong>Our commitment (target SLA):</strong></p>
          <ul style={{ listStyle: "disc", paddingLeft: 20, marginTop: 6, lineHeight: 1.8 }}>
            <li>Acknowledge confirmed reports within 24 hours.</li>
            <li>Triage and patch critical issues within 7 days; we'll keep you informed throughout.</li>
            <li>Disclose publicly via the <Link href="/status" style={{ color: "#2563EB" }}>status page</Link> after coordinated disclosure with affected clinics.</li>
            <li>Credit researchers in advisories unless you prefer anonymity.</li>
          </ul>
          <p style={{ marginTop: 12 }}><strong>Safe harbor:</strong> We will not pursue legal action against researchers acting in good faith. Don't access more data than necessary, don't exfiltrate or share data, don't test in ways that disrupt service.</p>
          <p style={{ marginTop: 12, fontSize: 12, color: "#94A3B8" }}>Bug bounty program launching in a future update. Out of scope today: third-party services (Stripe, AWS, Daily.co), self-hosted deployments outside our control.</p>
        </Section>

        <Section title="EU data sharing">
          <p>When a Mendi at-home user&rsquo;s session data flows into an EU clinician&rsquo;s EEGBase view, EEGBase and Mendi are <strong>joint controllers</strong> of that personal data under GDPR Art. 26. We treat that as a real legal artifact, not a checkbox.</p>
          <p style={{ marginTop: 12 }}><strong>Before any EU at-home Mendi data lands in a clinical EEGBase view, we will have in place:</strong></p>
          <ul style={{ listStyle: "disc", paddingLeft: 20, marginTop: 6, lineHeight: 1.8 }}>
            <li><strong>Joint Controller Agreement (JCA)</strong> signed with Mendi — defines who responds to access requests, who notifies on breach, who&rsquo;s liable for what</li>
            <li><strong>Data Protection Impact Assessment (DPIA)</strong> on file — required for high-risk processing of health + AI under GDPR Art. 35</li>
            <li><strong>GDPR Art. 9 explicit, purpose-specific consent</strong> in the Mendi consumer app — separate consent per clinician, revocable at any time, never a single generic toggle</li>
            <li><strong>Lawful basis</strong> documented per processing activity (consent for at-home sharing, legitimate interest for clinical record-keeping, legal obligation for retention)</li>
          </ul>
          <p style={{ marginTop: 12 }}><strong>Right to erasure (Art. 17) vs clinical retention.</strong> EU member states require clinical records to be retained 10–30 years (e.g. France 20y, Germany 10y, Sweden 10y). When an erasure request conflicts with retention, the clinical retention obligation wins for the regulated record; non-essential personal data is removed within 30 days and the user is informed of what was retained and why.</p>
          <p style={{ marginTop: 12 }}><strong>Cross-border transfer.</strong> EU clinic data lives in Frankfurt (eu-west-3). When transfer outside the EEA is necessary (e.g. a US clinician credentialed at an EU clinic), EU SCCs (2021/914 Module 2) plus supplementary measures per Schrems II apply.</p>
          <p style={{ marginTop: 12, fontSize: 12, color: "#94A3B8" }}>None of the Mendi-EU pieces are live yet — they gate EU clinic onboarding and the Coaching marketplace, both planned Q4 2026. Status updates appear on the <Link href="/roadmap" style={{ color: "#2563EB" }}>roadmap</Link>.</p>
        </Section>

        <Section title="Incident response">
          <p><strong>P0 incident SLA · target on launch:</strong></p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
            <Stat val="≤ 15 min" label="Acknowledgment" color="#10B981" />
            <Stat val="≤ 4 h"    label="Mitigation"      color="#3B82F6" />
            <Stat val="≤ 5 days" label="Public RCA"      color="#7C3AED" />
          </div>
          <p style={{ marginTop: 14 }}>
            Targets above kick in once a clinic onboards. Breach notification within 72 h per GDPR Art. 33 + HIPAA Breach Notification Rule applies regardless of platform stage. Public incident history will appear on the <Link href="/status" style={{ color: "#2563EB" }}>status page</Link>. Subscribe to email updates at <a href="mailto:hello@eegbase.com?subject=Status%20updates%20subscribe" style={{ color: "#2563EB" }}>hello@eegbase.com</a>.
          </p>
        </Section>

        <Section title="Compliance documents">
          <p>The following are NDA-gated. Sign a mutual NDA via <a href="mailto:hello@eegbase.com?subject=Mutual%20NDA%20%2B%20compliance%20docs" style={{ color: "#2563EB" }}>hello@eegbase.com</a> to receive on completion:</p>
          <ul style={{ listStyle: "disc", paddingLeft: 20, marginTop: 6, lineHeight: 1.8 }}>
            <li>SOC 2 report (Coalfire) — Type I scoping in progress, Type II to follow · target Q3 2026</li>
            <li>Independent pen-test attestation + remediation log — vendor selection in progress · target Q3 2026</li>
            <li>HIPAA risk assessment + Security Rule audit (available today)</li>
            <li>GDPR Data Processing Addendum + EU SCCs (2021/914) (available today)</li>
            <li>VPAT 2.4 (WCAG 2.2 AA · Deque audit planned Q3 2026)</li>
            <li>Disaster recovery runbook (available today) · tabletop exercise notes once exercises are run</li>
          </ul>
        </Section>

        <Section title="What you can do today">
          <p>Concrete steps for clinics setting up:</p>
          <ul style={{ listStyle: "disc", paddingLeft: 20, marginTop: 6, lineHeight: 1.8 }}>
            <li>Enforce 2FA for all clinical seats (default on)</li>
            <li>Configure IP allowlist for clinic-network access</li>
            <li>Enable SAML SSO via Okta or Google Workspace</li>
            <li>Subscribe to incident updates by emailing hello@eegbase.com (subject: Status updates subscribe)</li>
            <li>Audit role assignments quarterly via Settings → Team</li>
          </ul>
        </Section>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/privacy" style={{ color: "#9CA3AF" }}>Privacy</Link> · <Link href="/terms" style={{ color: "#9CA3AF" }}>Terms</Link>
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

function Stat({ val, label, color }: { val: string; label: string; color: string }) {
  return (
    <div style={{ background: "white", border: `1px solid ${color}40`, borderRadius: 12, padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{val}</div>
      <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{label}</div>
    </div>
  );
}
