// Sample wearable sync data. Real app pulls these from each integration's
// API; the demo uses fixed illustrative numbers so the story is always shown.
//
// One row per wearable. Only renders if the device is paired (DevicesCard).

export type WearableSync = {
  deviceId: string;
  syncedAgo: string;
  metrics: { label: string; value: string; sub?: string }[];
};

export const WEARABLE_SYNC: Record<string, WearableSync> = {
  apple: {
    deviceId: "apple",
    syncedAgo: "8 min ago",
    metrics: [
      { label: "Sleep",     value: "7h 12m", sub: "84% efficiency" },
      { label: "Resting HR", value: "54",     sub: "bpm" },
      { label: "Steps",     value: "6,210",  sub: "today" },
    ],
  },
  oura: {
    deviceId: "oura",
    syncedAgo: "21 min ago",
    metrics: [
      { label: "Sleep",     value: "8h 04m", sub: "deep 1h 12m" },
      { label: "HRV",       value: "52 ms",  sub: "↑ 4 vs avg" },
      { label: "Readiness", value: "84",     sub: "/ 100" },
    ],
  },
  whoop: {
    deviceId: "whoop",
    syncedAgo: "1h ago",
    metrics: [
      { label: "Strain",    value: "14.2",   sub: "moderate" },
      { label: "Recovery",  value: "67%",    sub: "yellow" },
      { label: "Sleep",     value: "7h 48m", sub: "" },
    ],
  },
  polar: {
    deviceId: "polar",
    syncedAgo: "Live",
    metrics: [
      { label: "Heart rate", value: "62",    sub: "bpm" },
      { label: "HRV-RMSSD",  value: "47 ms", sub: "" },
      { label: "Coherence",  value: "0.71",  sub: "" },
    ],
  },
};
