export interface ProtocolTemplate {
  id: string;
  name: string;
  description: string;
  deviceType: "eeg" | "fnirs" | "both";
  targetBand: string;
  electrodes: string;
  sessionDurationMinutes: number;
  rewardThreshold: number;
  inhibitThreshold: number;
  category: string;
  evidence: string;
}

export const PROTOCOL_TEMPLATES: ProtocolTemplate[] = [
  {
    id: "smr-beta-adhd",
    name: "SMR/Beta ADHD",
    description: "Reward 12–15 Hz SMR and suppress 4–8 Hz theta. Gold-standard protocol for ADHD and attention difficulties.",
    deviceType: "eeg",
    targetBand: "SMR (12–15 Hz)",
    electrodes: "Cz, C3, C4",
    sessionDurationMinutes: 30,
    rewardThreshold: 65,
    inhibitThreshold: 35,
    category: "Attention",
    evidence: "Level 4 — Best Support (ISNR)",
  },
  {
    id: "alpha-theta-trauma",
    name: "Alpha/Theta Trauma",
    description: "Cross-over training between alpha (8–12 Hz) and theta (4–8 Hz) to facilitate trauma processing and relaxation.",
    deviceType: "eeg",
    targetBand: "Alpha (8–12 Hz) / Theta (4–8 Hz)",
    electrodes: "Pz",
    sessionDurationMinutes: 30,
    rewardThreshold: 70,
    inhibitThreshold: 30,
    category: "Trauma & PTSD",
    evidence: "Level 3 — Probably Efficacious",
  },
  {
    id: "frontal-alpha-depression",
    name: "Frontal Alpha Asymmetry",
    description: "Increase left frontal alpha relative to right to address depressive symptoms. Targets F3/F4 asymmetry.",
    deviceType: "eeg",
    targetBand: "Alpha Asymmetry (F3–F4)",
    electrodes: "F3, F4",
    sessionDurationMinutes: 25,
    rewardThreshold: 60,
    inhibitThreshold: 40,
    category: "Depression",
    evidence: "Level 2 — Possibly Efficacious",
  },
  {
    id: "beta-gamma-tbi",
    name: "Beta/Gamma TBI",
    description: "Upregulate 18–40 Hz beta/gamma to support cognitive recovery post-TBI. Inhibit excess theta.",
    deviceType: "eeg",
    targetBand: "Beta/Gamma (18–40 Hz)",
    electrodes: "Fz, Cz",
    sessionDurationMinutes: 20,
    rewardThreshold: 55,
    inhibitThreshold: 45,
    category: "TBI / Cognitive",
    evidence: "Level 2 — Possibly Efficacious",
  },
  {
    id: "delta-sleep",
    name: "Delta Suppression (Insomnia)",
    description: "Reduce daytime delta (1–4 Hz) which correlates with hypersomnolence; enhance SMR for sleep regulation.",
    deviceType: "eeg",
    targetBand: "Delta (1–4 Hz) suppression",
    electrodes: "Cz",
    sessionDurationMinutes: 30,
    rewardThreshold: 65,
    inhibitThreshold: 35,
    category: "Sleep",
    evidence: "Level 2 — Possibly Efficacious",
  },
  {
    id: "fnirs-frontal-attention",
    name: "fNIRS Frontal Attention",
    description: "Upregulate prefrontal OxyHb during cognitive tasks. Targets sustained attention and executive function.",
    deviceType: "fnirs",
    targetBand: "OxyHb (PFC)",
    electrodes: "Prefrontal bilateral",
    sessionDurationMinutes: 20,
    rewardThreshold: 60,
    inhibitThreshold: 40,
    category: "Attention",
    evidence: "Level 2 — Possibly Efficacious",
  },
  {
    id: "theta-burst-anxiety",
    name: "Theta Suppression (Anxiety)",
    description: "Inhibit excess frontal theta (4–8 Hz) associated with rumination and anxious arousal. Reward beta.",
    deviceType: "eeg",
    targetBand: "Theta (4–8 Hz) suppression",
    electrodes: "Fz, F3, F4",
    sessionDurationMinutes: 25,
    rewardThreshold: 60,
    inhibitThreshold: 40,
    category: "Anxiety",
    evidence: "Level 3 — Probably Efficacious",
  },
  {
    id: "peak-performance",
    name: "Peak Performance / Flow",
    description: "Optimise theta-alpha ratio at Fz for flow state induction. Used in sports and performance contexts.",
    deviceType: "eeg",
    targetBand: "Theta/Alpha ratio",
    electrodes: "Fz, Pz",
    sessionDurationMinutes: 20,
    rewardThreshold: 70,
    inhibitThreshold: 30,
    category: "Performance",
    evidence: "Level 2 — Possibly Efficacious",
  },
];
