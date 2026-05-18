// ── Default protocol seeding ────────────────────────────────────────────────
// Each new clinic gets a handful of starter protocols so the library is
// never empty. The same set is used by scripts/seed.ts (CLI provisioning)
// and any future sign-up / clinic-creation server actions.
//
// Each protocol carries:
//   - device + duration + clinical description
//   - device-specific tuning params (Mendi reward threshold / Muse target
//     band etc) shaped to match the ProtocolParametersPanel forms
//   - a scripted `blocks` array consumed by ProtocolBlockTimer at run time
//     so clinicians can press Start and follow the on-screen pacing
//
// All values are conservative starting points — clinicians should tune
// per client in /protocols/[id].

import { db } from "@/lib/db";
import { protocols } from "@/lib/db/schema";

interface ProtocolSeed {
  name: string;
  description: string;
  deviceType: "mendi" | "muse" | "simulator";
  durationSeconds: number;
  parameters: Record<string, unknown>;
}

const FNIRS_ATTENTION: ProtocolSeed = {
  name: "fNIRS · Attention Training",
  description: "Prefrontal upregulation for sustained focus and cognitive performance. Standard 15-minute protocol with baseline → 3× focus blocks separated by rest.",
  deviceType: "mendi",
  durationSeconds: 15 * 60,
  parameters: {
    rewardThreshold: 0.05,
    smoothingWindow: 8,
    baselineSeconds: 60,
    feedbackMode: "visual",
    blocks: [
      { kind: "baseline", label: "Resting baseline",      durationSeconds: 60 },
      { kind: "focus",    label: "Focus block 1",         durationSeconds: 240 },
      { kind: "rest",     label: "Eyes-closed rest",       durationSeconds: 60 },
      { kind: "focus",    label: "Focus block 2",         durationSeconds: 240 },
      { kind: "rest",     label: "Eyes-closed rest",       durationSeconds: 60 },
      { kind: "focus",    label: "Focus block 3",         durationSeconds: 240 },
    ],
  },
};

const FNIRS_RELAX: ProtocolSeed = {
  name: "fNIRS · Relaxation",
  description: "Gentle reward threshold with extended baseline — designed for stress reduction, parasympathetic upregulation, and calm-state training.",
  deviceType: "mendi",
  durationSeconds: 12 * 60,
  parameters: {
    rewardThreshold: 0.02,
    smoothingWindow: 15,
    baselineSeconds: 90,
    feedbackMode: "both",
    blocks: [
      { kind: "baseline", label: "Extended baseline",      durationSeconds: 90 },
      { kind: "calm",     label: "Calm-state training",    durationSeconds: 300 },
      { kind: "rest",     label: "Eyes-closed rest",       durationSeconds: 90 },
      { kind: "calm",     label: "Calm-state training",    durationSeconds: 240 },
    ],
  },
};

const FNIRS_QUICKSTART: ProtocolSeed = {
  name: "fNIRS · 5-Minute Quickstart",
  description: "Brief introductory session for new clients — single focus block after a 1-minute baseline. Ideal for first appointment / device familiarisation.",
  deviceType: "mendi",
  durationSeconds: 5 * 60,
  parameters: {
    rewardThreshold: 0.04,
    smoothingWindow: 10,
    baselineSeconds: 60,
    feedbackMode: "visual",
    blocks: [
      { kind: "baseline", label: "Baseline",               durationSeconds: 60 },
      { kind: "focus",    label: "Focus training",         durationSeconds: 240 },
    ],
  },
};

const EEG_SMR: ProtocolSeed = {
  name: "EEG · SMR Up-Training",
  description: "Sensorimotor rhythm (12–15 Hz) reward training with theta inhibition — used for impulsivity, hyperarousal, and inattention.",
  deviceType: "muse",
  durationSeconds: 20 * 60,
  parameters: {
    targetBand: "smr",
    inhibitBand: "theta",
    rewardThreshold: 1.0,
    smoothingWindow: 8,
    feedbackMode: "both",
    blocks: [
      { kind: "baseline", label: "Eyes-open baseline",     durationSeconds: 120 },
      { kind: "focus",    label: "SMR up-training",        durationSeconds: 360 },
      { kind: "rest",     label: "Short rest",             durationSeconds: 60 },
      { kind: "focus",    label: "SMR up-training",        durationSeconds: 360 },
      { kind: "rest",     label: "Short rest",             durationSeconds: 60 },
      { kind: "focus",    label: "SMR up-training",        durationSeconds: 240 },
    ],
  },
};

const EEG_ALPHA: ProtocolSeed = {
  name: "EEG · Alpha Enhancement",
  description: "Eyes-closed alpha (8–12 Hz) up-training for anxiety reduction and relaxation. Common adjunct to anxiety / sleep protocols.",
  deviceType: "muse",
  durationSeconds: 15 * 60,
  parameters: {
    targetBand: "alpha",
    inhibitBand: "",
    rewardThreshold: 1.2,
    smoothingWindow: 10,
    feedbackMode: "audio",
    blocks: [
      { kind: "baseline", label: "Eyes-closed baseline",   durationSeconds: 120 },
      { kind: "calm",     label: "Alpha up-training",      durationSeconds: 360 },
      { kind: "rest",     label: "Brief rest",             durationSeconds: 60 },
      { kind: "calm",     label: "Alpha up-training",      durationSeconds: 360 },
    ],
  },
};

const SIM_DEMO: ProtocolSeed = {
  name: "Simulator · Demo Session",
  description: "Synthetic clean session for staff training / SQI validation. Runs without a physical device.",
  deviceType: "simulator",
  durationSeconds: 10 * 60,
  parameters: {
    noiseLevel: 0.25,
    trendStrength: 0.6,
    blocks: [
      { kind: "baseline", label: "Baseline",               durationSeconds: 60 },
      { kind: "focus",    label: "Focus training",         durationSeconds: 240 },
      { kind: "rest",     label: "Rest",                   durationSeconds: 60 },
      { kind: "focus",    label: "Focus training",         durationSeconds: 240 },
    ],
  },
};

export const DEFAULT_PROTOCOL_SEEDS: ProtocolSeed[] = [
  FNIRS_QUICKSTART,
  FNIRS_ATTENTION,
  FNIRS_RELAX,
  EEG_SMR,
  EEG_ALPHA,
  SIM_DEMO,
];

export async function seedDefaultProtocols(clinicId: string): Promise<number> {
  if (DEFAULT_PROTOCOL_SEEDS.length === 0) return 0;
  await db.insert(protocols).values(
    DEFAULT_PROTOCOL_SEEDS.map((p) => ({
      clinicId,
      name: p.name,
      description: p.description,
      deviceType: p.deviceType,
      durationSeconds: p.durationSeconds,
      parameters: p.parameters,
    }))
  );
  return DEFAULT_PROTOCOL_SEEDS.length;
}
