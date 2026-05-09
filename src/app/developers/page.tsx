import { AudienceLanding, type AudienceContent } from "@/components/AudienceLanding";

export const metadata = {
  title: "For developers · EEGBase",
  description: "Build on top of EEGBase. REST + WebSocket API, TypeScript SDK, BIDS-fNIRS native, MIT-licensed source.",
};

const C: AudienceContent = {
  eyebrow: "For developers",
  eyebrowColor: "#06B6D4",
  hero: { line1: "Build on the open-source", line2: "clinical neurofeedback stack.", line2Color: "#06B6D4" },
  lede: "MIT-licensed source. REST + WebSocket API. TypeScript SDK with WebSocket helpers. BIDS-fNIRS native. Add a new BLE device adapter in ~200 lines. Self-host on Vercel + Neon in 10 minutes.",
  pillars: [
    { title: "Source on GitHub",            desc: "Full app source, MIT license, open issues, accepted PRs. Branch-protected main, semantic-versioned releases, CodeQL scanning.",            color: "#06B6D4" },
    { title: "TS SDK + WebSocket helpers",  desc: "@eegbase/sdk for stable v1 (Q1 2027 GA, beta now). Subscribe to live signal samples, threshold events, session lifecycle.",                  color: "#10B981" },
    { title: "BLE adapter SDK",             desc: "Public TypeScript adapter interface. CI runs synthetic streams against every PR. Community drivers auto-merge on green.",                  color: "#7C3AED" },
  ],
  features: [
    "REST API · 11 endpoints · Bearer auth · OpenAPI 3.1 spec",
    "WebSocket streaming · 50k req/min · 250k concurrent",
    "12 webhook events · HMAC-SHA256 signed bodies",
    "Postman + Insomnia collections · npm install @eegbase/sdk",
    "BIDS-fNIRS export · SNIRF binaries · BEP-030 compliant",
    "Docker Compose · self-host on any Linux server",
    "Vercel + Neon one-click deploy in <10 min",
    "MNE-Python interop · MNE-NIRS 0.5+ pipeline",
  ],
  cta: { label: "Read API docs →", href: "/api-docs" },
  secondaryCta: { label: "Talk to us", href: "/contact" },
  proofPoints: [
    { val: "MIT",     lbl: "Open-source license" },
    { val: "<10 min", lbl: "Vercel + Neon deploy" },
    { val: "200",     lbl: "LOC for new device adapter" },
    { val: "11",      lbl: "REST endpoints in v1" },
  ],
  footnote: "API v1 stable Q1 2027 · enterprise + Mendi partners get beta keys today via api@eegbase.com.",
};

export default function DevelopersPage() {
  return <AudienceLanding c={C} />;
}
