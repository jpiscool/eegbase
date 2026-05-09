import { AudienceLanding, type AudienceContent } from "@/components/AudienceLanding";

export const metadata = {
  title: "For clinicians · EEGBase",
  description: "Built for licensed neurofeedback clinicians. CPT 90901 + 90875 + 90876 ready · CMS-1500 + ERA · BIDS / SNIRF / EDF+ export.",
};

const C: AudienceContent = {
  eyebrow: "For clinicians",
  eyebrowColor: "#2563EB",
  hero: { line1: "Run your whole neurofeedback practice", line2: "from one app.", line2Color: "#2563EB" },
  lede: "Stop juggling four tools to run one session. Live signal capture, AI session notes, insurance billing, outcome reports, and HIPAA video — all in one hosted SaaS built for licensed BCN/LPC/MD clinicians.",
  pillars: [
    { title: "Bill insurance built-in",    desc: "CMS-1500 + ERA auto-posting · CPT 90901, 90875, 90876, 90849 auto-suggested per session · ICD-10 codes pulled from chart",       color: "#10B981" },
    { title: "AI scribe in 6 formats",     desc: "SOAP / DAP / BIRP / GIRP / PIE / SIRP from session audio · clinician approves before save · Claude Haiku + GPT-4o fallback",   color: "#7C3AED" },
    { title: "Open data · zero lock-in",   desc: "BIDS / SNIRF / EDF+ export anytime · standardised formats · take your data with you whenever you want",  color: "#06B6D4" },
  ],
  features: [
    "Native Mendi fNIRS support · Muse · Polar HRV · OpenBCI · BYO BLE",
    "HIPAA video co-feedback during telehealth sessions",
    "Cross-session pattern detector across signal + Apple Health + Oura",
    "Pre/post outcome scales · PHQ-9, GAD-7, ADHD-RS-IV, MBI-EE, custom",
    "Group, couples, family modes (CPT 90849 reimbursable)",
    "Branded one-click PDF reports for clients + referrers",
    "Stedi + Office Ally clearinghouse integration",
    "Free for every clinic · no card · 38-min migration from BrainPaint/EEGer",
  ],
  cta: { label: "Try the live demo →", href: "/demo" },
  secondaryCta: { label: "Read the docs", href: "/api-docs" },
  proofPoints: [
    { val: "11",     lbl: "Tabs in the live demo" },
    { val: "6 min",  lbl: "Avg time to first session" },
    { val: "Free",   lbl: "Every feature, every device" },
    { val: "Hosted", lbl: "U.S. infrastructure · HIPAA-friendly" },
  ],
  footnote: "BCIA-listed coming Q3 2026 · ISNR + AAPB directories pending.",
};

export default function CliniciansPage() {
  return <AudienceLanding c={C} />;
}
