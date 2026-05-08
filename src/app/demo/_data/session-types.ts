// The 4 session types you can pick before starting. Plain-English purpose
// (no protocol jargon) + a default + 3 preset durations + accent color.
// Real app would map these to actual protocol IDs via /lib/protocols.

export type SessionType = {
  id: string;
  name: string;
  emoji: string;
  purpose: string;
  defaultMin: number;
  presets: number[];
  accent: string;
};

export const SESSION_TYPES: SessionType[] = [
  {
    id: "focus",
    name: "Focus",
    emoji: "\u{1F3AF}", // 🎯
    purpose: "Train attention. Useful for ADHD-style scattering or work prep.",
    defaultMin: 12,
    presets: [5, 12, 20],
    accent: "#2563EB",
  },
  {
    id: "calm",
    name: "Calm",
    emoji: "\u{1F343}", // 🍃
    purpose: "Down-regulate. Useful for stress, anxiety, before bed.",
    defaultMin: 10,
    presets: [5, 10, 20],
    accent: "#10B981",
  },
  {
    id: "sleep",
    name: "Sleep",
    emoji: "\u{1F319}", // 🌙
    purpose: "Wind down for the night. Slows the brain and the breath.",
    defaultMin: 15,
    presets: [10, 15, 25],
    accent: "#7C3AED",
  },
  {
    id: "performance",
    name: "Performance",
    emoji: "\u{26A1}", // ⚡
    purpose: "Pre-game / pre-stage. Quick activation, high alertness.",
    defaultMin: 8,
    presets: [3, 8, 15],
    accent: "#F59E0B",
  },
];
