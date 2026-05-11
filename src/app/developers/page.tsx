import { AudienceLanding, type AudienceContent } from "@/components/AudienceLanding";

export const metadata = {
  title: "For developers · EEGBase",
  description: "Build on top of EEGBase. REST + WebSocket API, TypeScript SDK, BIDS-fNIRS native, hosted SaaS.",
};

const C: AudienceContent = {
  eyebrow: "For developers",
  eyebrowColor: "#06B6D4",
  hero: { line1: "Build on top of the", line2: "clinical neurofeedback stack.", line2Color: "#06B6D4" },
  lede: "Hosted SaaS with a public REST + WebSocket API. TypeScript SDK with WebSocket helpers. BIDS-fNIRS native. Add a new BLE device adapter in ~200 lines.",
  pillars: [
    { title: "Public REST + WS API",         desc: "11 REST endpoints + WebSocket streaming. Bearer auth, HMAC-signed webhooks, OpenAPI 3.1 spec. Bring your own client.",     color: "#06B6D4" },
    { title: "TS SDK + WebSocket helpers",   desc: "@eegbase/sdk for stable v1 (Q1 2027 GA, beta now). Subscribe to live signal samples, threshold events, session lifecycle.",  color: "#10B981" },
    { title: "BLE adapter SDK",              desc: "Public TypeScript adapter interface. CI runs synthetic streams against every PR. Community drivers ship via partnership.",   color: "#7C3AED" },
  ],
  features: [
    "REST API · 11 endpoints · Bearer auth · OpenAPI 3.1 spec",
    "WebSocket streaming · 50k req/min · 250k concurrent",
    "12 webhook events · HMAC-SHA256 signed bodies",
    "Postman + Insomnia collections · npm install @eegbase/sdk",
    "BIDS-fNIRS export · SNIRF binaries · BEP-030 compliant",
    "MNE-Python interop · MNE-NIRS 0.5+ pipeline",
    "Sandbox API keys for partners — no production data required",
    "Stable v1 API contract guarantee from Q1 2027 GA",
  ],
  cta: { label: "Talk to us about early API access →", href: "/contact" },
  secondaryCta: { label: "Talk to us", href: "/contact" },
  proofPoints: [
    { val: "11",      lbl: "REST endpoints in v1" },
    { val: "200",     lbl: "LOC for new device adapter" },
    { val: "BIDS",    lbl: "fNIRS-native exports" },
    { val: "Q1 2027", lbl: "v1 GA · beta keys today" },
  ],
  footnote: "API v1 stable Q1 2027 · enterprise + Mendi partners get beta keys today.",
};

export default function DevelopersPage() {
  return <AudienceLanding c={C} />;
}
