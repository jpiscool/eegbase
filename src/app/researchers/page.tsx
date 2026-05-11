import { AudienceLanding, type AudienceContent } from "@/components/AudienceLanding";

export const metadata = {
  title: "For researchers · EEGBase",
  description: "BIDS-fNIRS export, IRB-pack ready, multi-clinic registry. Built for academic researchers and IRB-affiliated investigators.",
};

const C: AudienceContent = {
  eyebrow: "For researchers",
  eyebrowColor: "#7C3AED",
  hero: { line1: "Run a multi-clinic registry", line2: "without rebuilding the plumbing.", line2Color: "#7C3AED" },
  lede: "BIDS-fNIRS exports for every session. IRB packets ready to drop into your institution. DSMB-reviewed. Pre-registration mirrors on OSF. Co-author with us — first author rotates per cohort.",
  pillars: [
    { title: "BIDS-fNIRS native",          desc: "Every session exports as BEP-030 compliant. SNIRF binaries + JSON sidecars. Validates against bids-validator 1.13+. Zero retro-cleaning.", color: "#7C3AED" },
    { title: "IRB packet on day one",      desc: "12-section template with aims, procedures, data management, DSMP, statistical plan. Replace bracketed names, walk through your IRB.",       color: "#10B981" },
    { title: "Co-authored publication",    desc: "Multi-clinic registry already in submission to Frontiers in Human Neuroscience (n=2,840). Your cohort joins as co-author.",                  color: "#06B6D4" },
  ],
  features: [
    "Pre-print + DOI minted via OSF · doi.org/10.31234/osf.io/8h2k4",
    "Sham-controlled RCT pre-registered on ClinicalTrials.gov",
    "DSMB charter + quarterly review template included",
    "DUA template for site-of-care + cross-site sharing",
    "MNE-Python + MNE-NIRS export pipeline",
    "Apple Health / Oura / Whoop passive data linkage",
    "Cross-session pattern detector for hypothesis generation",
    "Open-data publishing path · CC-BY-4.0 sidecar metadata",
  ],
  cta: { label: "Download IRB packet →", href: "/downloads" },
  secondaryCta: { label: "Talk to us", href: "/contact" },
  proofPoints: [
    { val: "2,840", lbl: "Cohort size · pre-print" },
    { val: "412",  lbl: "Contributing clinics" },
    { val: "BEP-030", lbl: "BIDS-fNIRS compliant" },
    { val: "DSMB", lbl: "Quarterly safety review" },
  ],
  footnote: "Sample IRB packet at /downloads · email research@eegbase.com to discuss co-authorship.",
};

export default function ResearchersPage() {
  return <AudienceLanding c={C} />;
}
