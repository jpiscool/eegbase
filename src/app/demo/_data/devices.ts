// Devices supported in the demo. The "hardware-agnostic" story shown, not told.
// `connected` is local demo state — real app pulls from a per-user devices table.

export type DeviceKind = "headset" | "wearable" | "hr-strap";

export type Device = {
  id: string;
  name: string;
  kind: DeviceKind;
  what: string;        // one-line plain-English description
  initial: boolean;    // pre-connected at first paint
  badge: string;       // 2-letter monogram on the avatar
  badgeBg: string;
  badgeFg: string;
};

export const DEVICES: Device[] = [
  { id: "mendi",  name: "Mendi",        kind: "headset",  what: "Forehead brain training",      initial: true,  badge: "Me", badgeBg: "#7C3AED1A", badgeFg: "#7C3AED" },
  { id: "muse",   name: "Muse",         kind: "headset",  what: "EEG headband · 4 channels",    initial: false, badge: "Mu", badgeBg: "#06B6D41A", badgeFg: "#06B6D4" },
  { id: "polar",  name: "Polar H10",    kind: "hr-strap", what: "Heart-rate chest strap",       initial: true,  badge: "Po", badgeBg: "#EF44441A", badgeFg: "#EF4444" },
  { id: "apple",  name: "Apple Watch",  kind: "wearable", what: "Sleep, HR, recovery",          initial: false, badge: "Aw", badgeBg: "#0F172A1A", badgeFg: "#0F172A" },
  { id: "oura",   name: "Oura Ring",    kind: "wearable", what: "Sleep, HRV, readiness",        initial: false, badge: "Or", badgeBg: "#1E293B1A", badgeFg: "#1E293B" },
  { id: "whoop",  name: "Whoop",        kind: "wearable", what: "Strain, recovery, sleep",      initial: false, badge: "Wh", badgeBg: "#10B9811A", badgeFg: "#10B981" },
  { id: "openbci", name: "OpenBCI",     kind: "headset",  what: "Open-source EEG · 8/16 ch.",   initial: false, badge: "Ob", badgeBg: "#F59E0B1A", badgeFg: "#F59E0B" },
];
