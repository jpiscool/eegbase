import { AudienceLanding, type AudienceContent } from "@/components/AudienceLanding";

export const metadata = {
  title: "For enterprise · EEGBase",
  description: "Hospital and health-system deployment of EEGBase. White-label, SLA, SSO, multi-region, dedicated CSM.",
};

const C: AudienceContent = {
  eyebrow: "For enterprise",
  eyebrowColor: "#7C3AED",
  hero: { line1: "Multi-clinic. Multi-region.", line2: "White-label ready.", line2Color: "#7C3AED" },
  lede: "Enterprise deployment of EEGBase for health systems, multi-location practices, and corporate-wellness programs. White-label theme, SSO, HIPAA BAA on enrolment, multi-region architecture, and a target SLA that activates the day a clinic onboards.",
  pillars: [
    { title: "White-label ready",          desc: "Theme switcher rebrands across all 11 tabs, patient portal, booking page, share-link viewer, outbound email. ~2-week launch.", color: "#7C3AED" },
    { title: "Procurement-track compliance", desc: "HIPAA BAA on enrolment · EU SCCs (2021/914) · Schrems II posture documented · SOC 2 + independent pen-test + WCAG 2.2 AA audit scoping in progress, target start Q3 2026 · SIG-LITE/HECVAT questionnaire support on request.", color: "#10B981" },
    { title: "Target SLA + CSM",            desc: "Target SLA on launch: 15-min P0 ack · 4h mitigation · 5-day public RCA · multi-region failover. Real uptime numbers will be published on /status once we carry production traffic.", color: "#06B6D4" },
  ],
  features: [
    "SAML SSO (Okta, Google Workspace, Microsoft Entra)",
    "IP allowlist + 2FA enforced for all clinical seats",
    "Multi-region architecture · us-east-1 · eu-west-3 · ca-central-1",
    "Cross-AZ failover · target RTO 15 min · target RPO 5 min",
    "Custom DPA + HIPAA BAA on enrolment",
    "Volume licensing (50+ clinicians) with admin console",
    "Corporate-wellness deployment mode (cohort dashboard)",
    "Embedded analytics + custom reporting",
  ],
  cta: { label: "Talk to sales →", href: "/contact?role=partner" },
  secondaryCta: { label: "Trust center", href: "/trust-center" },
  proofPoints: [
    { val: "Pre-launch", lbl: "Real uptime publishes on /status once we carry production traffic" },
    { val: "15 min",     lbl: "P0 incident ack · target SLA on launch" },
    { val: "3",          lbl: "Planned regions · multi-AZ failover" },
  ],
  footnote: "Pre-launch posture: no real production traffic yet. SOC 2, independent pen-test, and WCAG 2.2 AA audits are scoping with vendors and target Q3 2026. SIG-LITE and HECVAT questionnaire support available on request.",
};

export default function EnterprisePage() {
  return <AudienceLanding c={C} />;
}
