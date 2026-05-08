import { AudienceLanding, type AudienceContent } from "@/components/AudienceLanding";

export const metadata = {
  title: "For enterprise · EEGBase",
  description: "Hospital and health-system deployment of EEGBase. White-label, SLA, SSO, multi-region, dedicated CSM.",
};

const C: AudienceContent = {
  eyebrow: "For enterprise",
  eyebrowColor: "#7C3AED",
  hero: { line1: "Multi-clinic. Multi-region.", line2: "Mendi-attached or white-label.", line2Color: "#7C3AED" },
  lede: "Enterprise deployment of EEGBase for health systems, multi-location practices, and corporate-wellness programs. White-label option ('Mendi Clinical' is one example), full SSO, signed BAA + DPA, dedicated CSM, 99.97% uptime SLA.",
  pillars: [
    { title: "White-label ready",          desc: "Theme switcher rebrands across all 16 tabs, patient portal, booking page, share-link viewer, outbound email. 2-week launch · 0 hrs Mendi engineering.", color: "#7C3AED" },
    { title: "Procurement-ready compliance", desc: "SOC 2 Type II + Bishop Fox + HIPAA BAA + EU SCCs + Schrems II + WCAG 2.2 AA. SIG-LITE/HECVAT questionnaires answered.",                                  color: "#10B981" },
    { title: "Dedicated SLA + CSM",         desc: "99.97% uptime · 15-min P0 ack · 4h mitigation · 5-day public RCA · multi-region failover · cross-AZ tested monthly.",                                       color: "#06B6D4" },
  ],
  features: [
    "SAML SSO (Okta, Google Workspace, Microsoft Entra)",
    "IP allowlist + 2FA enforced for all clinical seats",
    "Multi-region · us-east-1 · eu-west-3 · ca-central-1",
    "RTO 15 min · RPO 5 min · cross-AZ failover tested monthly",
    "Custom DPA · 42 CFR Part 2 · BAA on signup",
    "Volume licensing (50+ clinicians) with admin console",
    "Corporate-wellness deployment mode (cohort dashboard)",
    "Embedded analytics + custom reporting",
  ],
  cta: { label: "Talk to sales →", href: "/contact?role=partner" },
  secondaryCta: { label: "Trust center", href: "/trust-center" },
  proofPoints: [
    { val: "99.95%", lbl: "Rolling 90-day uptime" },
    { val: "15 min", lbl: "P0 incident ack SLA" },
    { val: "3",      lbl: "Regions · multi-cloud failover" },
  ],
  footnote: "SIG-LITE and HECVAT vendor-assessment questionnaires available on request.",
};

export default function EnterprisePage() {
  return <AudienceLanding c={C} />;
}
