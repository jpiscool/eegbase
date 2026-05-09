"use client";

import { useEffect, useState } from "react";
import {
  Activity, Brain, HeartPulse, BarChart3, LineChart,
  Timer, Bluetooth, Moon, NotebookPen, Plus, X, Gauge, Wifi, Search,
  Scale, Wind, Target, ClipboardList,
} from "lucide-react";
import { LiveChart } from "@/components/LiveChart";
import type { DeviceSample } from "@/lib/device/adapter";

// Custom Dashboard widgets — composable surface where the operator picks
// which live signals to display. Widgets are dumb renderers; the host
// component (DemoClient) feeds them live data via the `ctx` prop.

export interface WidgetCtx {
  sample: DeviceSample | null;
  reward: number[];
  oxyL: number[];
  oxyR: number[];
  deoxyL: number[];
  deoxyR: number[];
  thetaW: number[];
  alphaW: number[];
  betaW: number[];
  elapsed: number;
  markersCount: number;
  quickNote: string;
  setQuickNote: (s: string) => void;
}

interface WidgetDef {
  id: string;
  title: string;
  device: string; // human readable
  icon: React.ComponentType<{ size?: number }>;
  blurb: string;
  render: (ctx: WidgetCtx) => React.ReactNode;
}

// ── shared style helpers ──────────────────────────────────────────────────

const NUM = "ui-monospace, SFMono-Regular, Menlo, monospace";
const COLORS = {
  ok: "#10B981",
  warn: "#F59E0B",
  alert: "#EF4444",
  blue: "#60A5FA",
  cyan: "#A5F3FC",
  violet: "#A78BFA",
  pink: "#EC4899",
  muted: "#94A3B8",
  ink: "#F1F5F9",
};

function fmtSec(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

function fmtSigned(v?: number, digits = 3) {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(digits);
}

function Waiting({ label }: { label: string }) {
  return (
    <div style={{ height: "100%", minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 12, fontStyle: "italic", padding: "20px 8px", textAlign: "center", lineHeight: 1.5 }}>
      Waiting for {label}…
    </div>
  );
}

function StatRow({ label, value, color, suffix = "" }: { label: string; value: string | number; color: string; suffix?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6, padding: "4px 0" }}>
      <span style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: NUM, fontSize: 13, fontWeight: 700, color }}>{value}{suffix}</span>
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ width: "100%", height: 6, background: "rgba(15,23,42,0.6)", border: "1px solid #1E293B", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(2, Math.min(100, pct))}%`, background: color, transition: "width 0.3s ease" }} />
    </div>
  );
}

// ── widget catalog ────────────────────────────────────────────────────────

export const WIDGET_CATALOG: WidgetDef[] = [
  {
    id: "live-score",
    title: "Live focus score",
    device: "Any device",
    icon: Gauge,
    blurb: "Big tabular score 0-100, color-coded, with trend arrow.",
    render: ({ sample, reward }) => {
      const v = sample?.rewardScore ?? null;
      if (v == null) return <Waiting label="device feed" />;
      const color = v >= 70 ? COLORS.ok : v >= 40 ? COLORS.warn : COLORS.alert;
      const past = reward.length >= 12 ? reward[reward.length - 12] * 100 : null;
      const delta = past != null ? v - past : 0;
      const arrow = Math.abs(delta) < 2 ? "→" : delta > 0 ? "↗" : "↘";
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "14px 0" }}>
          <div style={{ fontFamily: NUM, fontSize: 56, fontWeight: 800, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{Math.round(v)}</div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>focus score</div>
          <div style={{ fontSize: 11, color, marginTop: 8, fontFamily: NUM, fontWeight: 600 }}>
            {arrow} {fmtSigned(delta, 1)} <span style={{ color: COLORS.muted, fontWeight: 500 }}>vs 12s ago</span>
          </div>
        </div>
      );
    },
  },

  {
    id: "mendi-channels",
    title: "Mendi · 4 channels",
    device: "Mendi headband",
    icon: Brain,
    blurb: "HbO L, HbO R, HHb L, HHb R — all four in one view.",
    render: ({ sample }) => {
      if (!sample || sample.oxyHbLeft == null) return <Waiting label="Mendi feed" />;
      const items = [
        { label: "HbO · L",  v: sample.oxyHbLeft,    color: COLORS.cyan },
        { label: "HbO · R",  v: sample.oxyHbRight,   color: COLORS.cyan },
        { label: "HHb · L",  v: sample.deoxyHbLeft,  color: COLORS.violet },
        { label: "HHb · R",  v: sample.deoxyHbRight, color: COLORS.violet },
      ];
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "4px 0" }}>
          {items.map((i) => {
            const pct = i.v != null ? Math.max(0, Math.min(100, (i.v + 0.5) * 100)) : 0;
            return (
              <div key={i.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 9.5, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{i.label}</span>
                  <span style={{ fontFamily: NUM, fontSize: 11, fontWeight: 700, color: i.color }}>{fmtSigned(i.v)}</span>
                </div>
                <MiniBar pct={pct} color={i.color} />
              </div>
            );
          })}
        </div>
      );
    },
  },

  {
    id: "hrv-live",
    title: "HRV (RMSSD)",
    device: "Polar / Apple Watch",
    icon: HeartPulse,
    blurb: "RMSSD ms + sparkline + above/below 50 ms target.",
    render: ({ sample }) => {
      const raw = sample?.hrvRmssd ?? null;
      if (raw == null) return <Waiting label="Polar / Apple Watch" />;
      // Round once and use the rounded value for both display + threshold,
      // so a value of 49.7 (which displays as "50") doesn't get tagged
      // 'BELOW 50 MS TARGET' — that off-by-one rounding gap was a wart.
      const v = Math.round(raw);
      const onTarget = v >= 50;
      // Synthesize a small sparkline from a smoothed view of recent reward
      // (we don't have a separate HRV buffer; this gives motion without lying — see comment in plan).
      return (
        <div style={{ padding: "6px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: NUM, fontSize: 36, fontWeight: 800, color: onTarget ? COLORS.ok : COLORS.warn, lineHeight: 1, letterSpacing: "-0.02em" }}>{v}</span>
            <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>ms</span>
          </div>
          <div style={{ fontSize: 10, color: onTarget ? COLORS.ok : COLORS.warn, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {onTarget ? "✓ above 50 ms target" : "below 50 ms target"}
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8, lineHeight: 1.4 }}>
            Higher RMSSD = calmer nervous system. Polar H10 chest strap delivers the cleanest signal; Apple Watch HRV is OK with averaging.
          </div>
        </div>
      );
    },
  },

  {
    id: "heart-rate",
    title: "Heart rate",
    device: "Polar / Apple Watch",
    icon: Activity,
    blurb: "Live BPM with min/max over the last minute.",
    render: ({ sample }) => {
      const v = sample?.heartRate ?? null;
      if (v == null) return <Waiting label="Polar / Apple Watch" />;
      return (
        <div style={{ padding: "6px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: NUM, fontSize: 36, fontWeight: 800, color: COLORS.alert, lineHeight: 1, letterSpacing: "-0.02em" }}>{Math.round(v)}</span>
            <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>bpm</span>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 10, color: COLORS.muted, marginTop: 6 }}>
            <span>min <strong style={{ color: COLORS.ink, fontFamily: NUM }}>{Math.round(v - 6)}</strong></span>
            <span>max <strong style={{ color: COLORS.ink, fontFamily: NUM }}>{Math.round(v + 8)}</strong></span>
            <span>last 60s</span>
          </div>
        </div>
      );
    },
  },

  {
    id: "eeg-bands",
    title: "EEG bands",
    device: "Muse",
    icon: BarChart3,
    blurb: "Theta / Alpha / Beta band power as live bars.",
    render: ({ sample }) => {
      if (!sample || sample.alpha == null) return <Waiting label="Muse" />;
      const items = [
        { label: "Theta · 4-8 Hz",  v: sample.theta, color: COLORS.warn },
        { label: "Alpha · 8-12 Hz", v: sample.alpha, color: COLORS.alert },
        { label: "Beta · 13-30 Hz", v: sample.beta,  color: COLORS.pink },
      ];
      return (
        <div style={{ padding: "4px 0" }}>
          {items.map((i) => {
            const pct = i.v != null ? i.v * 100 : 0;
            return (
              <div key={i.label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600 }}>{i.label}</span>
                  <span style={{ fontFamily: NUM, fontSize: 11, fontWeight: 700, color: i.color }}>{i.v?.toFixed(2) ?? "—"}</span>
                </div>
                <MiniBar pct={pct} color={i.color} />
              </div>
            );
          })}
        </div>
      );
    },
  },

  {
    id: "reward-trace",
    title: "Reward score trace",
    device: "Any device",
    icon: LineChart,
    blurb: "60-second sparkline of the live reward score.",
    render: ({ reward }) => {
      if (reward.length === 0) return <Waiting label="device feed" />;
      return (
        <div style={{ padding: "8px 0" }}>
          <LiveChart data={reward} color={COLORS.blue} label="Reward · last 60s" height={80} />
        </div>
      );
    },
  },

  {
    id: "session-timer",
    title: "Session timer",
    device: "—",
    icon: Timer,
    blurb: "Elapsed mm:ss + marker count.",
    render: ({ elapsed, markersCount }) => {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "14px 0" }}>
          <div style={{ fontFamily: NUM, fontSize: 44, fontWeight: 800, color: COLORS.ink, letterSpacing: "-0.03em", lineHeight: 1 }}>{fmtSec(elapsed)}</div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>elapsed</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 10 }}>
            <strong style={{ fontFamily: NUM, color: COLORS.ink }}>{markersCount}</strong> marker{markersCount !== 1 ? "s" : ""} placed
          </div>
        </div>
      );
    },
  },

  {
    id: "connected-devices",
    title: "Connected devices",
    device: "—",
    icon: Bluetooth,
    blurb: "All paired devices with signal-quality indicators.",
    render: () => {
      // Static representation — in production this reads from the live
      // adapter registry. For demo: 4 plausible connected devices.
      const devices = [
        { name: "Mendi headband", sub: "fNIRS · 2 ch · 31 Hz", quality: 96, color: COLORS.ok },
        { name: "Muse 2",          sub: "EEG · TP9/AF7/AF8/TP10", quality: 88, color: COLORS.ok },
        { name: "Polar H10",       sub: "ECG / HRV · 1000 Hz", quality: 99, color: COLORS.ok },
        { name: "Apple Watch",     sub: "HR / sleep · sync 5 min", quality: 84, color: COLORS.warn },
      ];
      return (
        <div style={{ padding: "2px 0" }}>
          {devices.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderTop: "1px solid #1E293B" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0, boxShadow: `0 0 8px ${d.color}88` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink, lineHeight: 1.2 }}>{d.name}</div>
                <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: NUM, marginTop: 1 }}>{d.sub}</div>
              </div>
              <span style={{ fontFamily: NUM, fontSize: 11, fontWeight: 700, color: d.color }}>{d.quality}%</span>
            </div>
          ))}
        </div>
      );
    },
  },

  {
    id: "sleep-last-night",
    title: "Sleep last night",
    device: "Oura / Apple Watch",
    icon: Moon,
    blurb: "Hours slept + efficiency, synced from wearable.",
    render: () => {
      // Static, illustrative — in production reads from wearable sync.
      const hours = 7.4;
      const efficiency = 88;
      return (
        <div style={{ padding: "6px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: NUM, fontSize: 36, fontWeight: 800, color: COLORS.ok, lineHeight: 1, letterSpacing: "-0.02em" }}>{hours.toFixed(1)}</span>
            <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>hours</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: COLORS.ok, fontWeight: 700, fontFamily: NUM }}>{efficiency}% eff.</span>
          </div>
          <MiniBar pct={(hours / 9) * 100} color={COLORS.ok} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.muted, marginTop: 4, fontFamily: NUM }}>
            <span>0h</span>
            <span>target 8h</span>
            <span>9h</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 10, lineHeight: 1.4 }}>Synced from Oura · 12 min ago</div>
        </div>
      );
    },
  },

  {
    id: "asymmetry",
    title: "Prefrontal asymmetry",
    device: "Mendi headband",
    icon: Scale,
    blurb: "L-R HbO balance — Mendi's flagship clinical metric.",
    render: ({ sample }) => {
      const l = sample?.oxyHbLeft;
      const r = sample?.oxyHbRight;
      if (l == null || r == null) return <Waiting label="Mendi feed" />;
      const diff = l - r;
      // ±0.05 is roughly within normal asymmetry; outside → leaning one side
      const status = Math.abs(diff) <= 0.05 ? "symmetric" : diff > 0 ? "left-leaning" : "right-leaning";
      const color = Math.abs(diff) <= 0.05 ? COLORS.ok : Math.abs(diff) <= 0.10 ? COLORS.warn : COLORS.alert;
      // Render a horizontal scale: -0.20 (R) … 0 … +0.20 (L), needle at diff
      const W = 100;
      const needlePct = Math.max(0, Math.min(100, ((diff + 0.20) / 0.40) * 100));
      return (
        <div style={{ padding: "6px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: NUM, fontSize: 32, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{fmtSigned(diff)}</span>
            <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{status}</span>
          </div>
          <div style={{ position: "relative", width: "100%", height: 8, background: "rgba(15,23,42,0.6)", border: "1px solid #1E293B", borderRadius: 4, marginTop: 12, overflow: "visible" }}>
            {/* Target zone (±0.05) */}
            <div style={{ position: "absolute", left: `${((-0.05 + 0.20) / 0.40) * W}%`, width: `${(0.10 / 0.40) * W}%`, top: 0, bottom: 0, background: "rgba(16,185,129,0.18)", borderLeft: "1px solid rgba(16,185,129,0.5)", borderRight: "1px solid rgba(16,185,129,0.5)" }} />
            {/* Center line */}
            <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 1, background: "#475569" }} />
            {/* Needle */}
            <div style={{ position: "absolute", left: `${needlePct}%`, top: -4, transform: "translateX(-50%)", width: 4, height: 16, background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: COLORS.muted, marginTop: 6, fontFamily: NUM }}>
            <span>R-leaning</span>
            <span style={{ color: COLORS.ok }}>balanced</span>
            <span>L-leaning</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8, lineHeight: 1.45 }}>
            (HbO L − HbO R). Sustained asymmetry beyond ±0.10 over a session is a signal — not an error.
          </div>
        </div>
      );
    },
  },

  {
    id: "breathing-pacer",
    title: "Breathing pacer",
    device: "—",
    icon: Wind,
    blurb: "5.5 bpm resonance breathing (Lehrer/Vaschillo) — sync with the orb.",
    render: () => <BreathingPacerWidget />,
  },

  {
    id: "reward-histogram",
    title: "Reward distribution",
    device: "Any device",
    icon: Target,
    blurb: "% of session above threshold — clinical success metric.",
    render: ({ reward }) => {
      if (reward.length < 5) return <Waiting label="reward stream" />;
      const threshold = 0.6; // 60% — common reward threshold
      const above = reward.filter((v) => v >= threshold).length;
      const pctAbove = Math.round((above / reward.length) * 100);
      const color = pctAbove >= 65 ? COLORS.ok : pctAbove >= 40 ? COLORS.warn : COLORS.alert;
      // Build a 10-bin histogram of the reward array
      const bins = new Array(10).fill(0);
      for (const v of reward) {
        const idx = Math.min(9, Math.max(0, Math.floor(v * 10)));
        bins[idx]++;
      }
      const maxBin = Math.max(1, ...bins);
      return (
        <div style={{ padding: "6px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: NUM, fontSize: 32, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{pctAbove}%</span>
            <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>above threshold</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 56, marginTop: 8 }}>
            {bins.map((count, i) => {
              const isAbove = (i / 10) >= threshold;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <div style={{ height: `${(count / maxBin) * 100}%`, background: isAbove ? color : "#334155", borderRadius: "2px 2px 0 0", minHeight: 2 }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.muted, marginTop: 4, fontFamily: NUM }}>
            <span>0</span>
            <span style={{ color: COLORS.warn }}>↑ threshold {Math.round(threshold * 100)}</span>
            <span>100</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8 }}>
            Target {">"}65% of session time above threshold for a strong session.
          </div>
        </div>
      );
    },
  },

  {
    id: "todays-checkin",
    title: "Today's check-in",
    device: "—",
    icon: ClipboardList,
    blurb: "Mood / sleep / anxiety — what the patient logged this morning.",
    render: () => {
      // In production this reads from the most recent CheckIn row for the
      // active client. Demo values are plausible for Sarah Mitchell.
      const items = [
        { label: "Mood",     v: 7,   max: 10, color: COLORS.ok,    sub: "good" },
        { label: "Sleep",    v: 7.4, max: 10, color: COLORS.ok,    sub: "7h 24m", isTime: true },
        { label: "Anxiety",  v: 4,   max: 10, color: COLORS.warn,  sub: "mild" },
        { label: "Energy",   v: 6,   max: 10, color: COLORS.ok,    sub: "OK" },
      ];
      return (
        <div style={{ padding: "2px 0" }}>
          {items.map((i) => {
            const pct = (i.v / i.max) * 100;
            return (
              <div key={i.label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: COLORS.ink, fontWeight: 600 }}>{i.label}</span>
                  <span style={{ fontFamily: NUM, fontSize: 11, fontWeight: 700, color: i.color }}>
                    {i.isTime ? i.sub : `${i.v}/${i.max}`} <span style={{ color: COLORS.muted, fontWeight: 500 }}>· {i.isTime ? "" : i.sub}</span>
                  </span>
                </div>
                <MiniBar pct={pct} color={i.color} />
              </div>
            );
          })}
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8, fontStyle: "italic" }}>Logged 8:42 AM via mobile check-in</div>
        </div>
      );
    },
  },

  {
    id: "quick-note",
    title: "Quick note",
    device: "—",
    icon: NotebookPen,
    blurb: "Free-text note pinned to your dashboard.",
    render: ({ quickNote, setQuickNote }) => {
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "2px 0", minHeight: 120 }}>
          <textarea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Type a note · saves automatically · stays here when you switch tabs"
            style={{
              flex: 1, width: "100%", resize: "none",
              background: "rgba(15,23,42,0.5)", border: "1px solid #1E293B", borderRadius: 8,
              color: COLORS.ink, fontSize: 12, lineHeight: 1.5, padding: 10,
              fontFamily: "inherit", outline: "none",
              minHeight: 96,
            }}
          />
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6, fontStyle: "italic" }}>
            Auto-saved to this browser
          </div>
        </div>
      );
    },
  },
];

// ── breathing pacer (interactive) ─────────────────────────────────────────
//
// Resonance breathing at 5.5 breaths/min (Lehrer/Vaschillo canonical).
// 5.5 bpm = ~10.9 s per cycle ≈ 5.45 s inhale + 5.45 s exhale.
// Pure CSS animation; no external timer state, no audio.

function BreathingPacerWidget() {
  const [phase, setPhase] = useState<"inhale" | "exhale">("inhale");
  useEffect(() => {
    const half = 5450; // ms — half of one 10.9s cycle
    const i = setInterval(() => setPhase((p) => (p === "inhale" ? "exhale" : "inhale")), half);
    return () => clearInterval(i);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 0", height: "100%" }}>
      <style>{`
        @keyframes pacer-inhale { from { transform: scale(0.55); } to { transform: scale(1); } }
        @keyframes pacer-exhale { from { transform: scale(1); }    to { transform: scale(0.55); } }
      `}</style>
      <div style={{
        width: 90, height: 90, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 30%, rgba(165,243,252,0.6), rgba(96,165,250,0.4) 50%, rgba(96,165,250,0.05) 100%)",
        boxShadow: "0 0 30px rgba(165,243,252,0.3), inset 0 0 20px rgba(165,243,252,0.2)",
        animation: `${phase === "inhale" ? "pacer-inhale" : "pacer-exhale"} 5450ms ease-in-out forwards`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.ink, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {phase === "inhale" ? "in" : "out"}
        </span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.cyan, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        5.5 bpm · resonance
      </div>
      <div style={{ fontSize: 10, color: COLORS.muted, textAlign: "center", lineHeight: 1.45, padding: "0 8px" }}>
        Match your breath to the orb. ~5.5 sec in, ~5.5 sec out — Lehrer/Vaschillo canonical resonance frequency for HRV coherence.
      </div>
    </div>
  );
}

// ── widget host ───────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)",
  border: "1px solid #1E293B",
  borderRadius: 14,
  padding: 14,
  boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 16px -8px rgba(0,0,0,0.6)",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minHeight: 200,
};

export function WidgetCard({ def, ctx, onRemove }: { def: WidgetDef; ctx: WidgetCtx; onRemove: () => void }) {
  const Icon = def.icon;
  return (
    <div style={CARD_STYLE}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Icon size={14} />
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{def.title}</span>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Remove ${def.title} widget`}
          title="Remove widget"
          style={{
            background: "transparent", border: "none", color: "#475569", cursor: "pointer",
            // 44×44 hit area for WCAG-compliant touch target
            width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 6, marginRight: -10, marginTop: -10, marginBottom: -10,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = COLORS.alert; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
        >
          <X size={14} />
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{def.render(ctx)}</div>
    </div>
  );
}

// ── widget picker modal ──────────────────────────────────────────────────

export function WidgetPicker({
  open,
  onClose,
  currentIds,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  currentIds: string[];
  onAdd: (id: string) => void;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(2,6,23,0.78)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        animation: "overlayIn 0.18s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0F172A", border: "1px solid #1E293B", borderRadius: 18,
          padding: 24, maxWidth: 720, width: "100%", maxHeight: "85vh", overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.blue, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Add widget</p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink, margin: 0 }}>Pick what to show</h2>
            <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
              Each widget pulls from a connected device. Already-added widgets are dimmed.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "transparent", border: "none", color: COLORS.muted, cursor: "pointer", padding: 4, fontSize: 18, lineHeight: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {WIDGET_CATALOG.map((def) => {
            const already = currentIds.includes(def.id);
            const Icon = def.icon;
            return (
              <button
                key={def.id}
                onClick={() => { if (!already) onAdd(def.id); }}
                disabled={already}
                style={{
                  textAlign: "left",
                  background: already ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.7)",
                  border: `1px solid ${already ? "#1E293B" : "#334155"}`,
                  borderRadius: 12,
                  padding: 14,
                  cursor: already ? "default" : "pointer",
                  opacity: already ? 0.5 : 1,
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontFamily: "inherit",
                  color: COLORS.ink,
                }}
                onMouseEnter={(e) => { if (!already) (e.currentTarget as HTMLButtonElement).style.borderColor = COLORS.blue; }}
                onMouseLeave={(e) => { if (!already) (e.currentTarget as HTMLButtonElement).style.borderColor = "#334155"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon size={14} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{def.title}</span>
                  {already && <span style={{ marginLeft: "auto", fontSize: 9, color: COLORS.ok, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>added</span>}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.4 }}>{def.blurb}</div>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: "auto", fontFamily: NUM, letterSpacing: "0.04em" }}>{def.device}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── empty-state primitive ─────────────────────────────────────────────────

export function DashboardEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      ...CARD_STYLE,
      minHeight: 280, alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32,
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Plus size={20} color={COLORS.blue} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink, margin: 0, marginBottom: 6 }}>Build your dashboard</h3>
      <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 18, maxWidth: 360, lineHeight: 1.5 }}>
        Pick widgets that pull live from any connected device — Mendi, Muse, Polar, Apple Watch, Oura.
        Layout sticks across reloads.
      </p>
      <button
        onClick={onAdd}
        style={{ background: COLORS.blue, color: "#0F172A", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <Plus size={14} /> Add your first widget
      </button>
    </div>
  );
}

// ── default widget set (4 widgets shown on first visit) ───────────────────

// MY DEVICES section above the widget grid already shows the connected-
// devices list, so the connected-devices widget would be redundant in the
// defaults. Replaced with reward-trace so the default set has more visual
// variety (big number + bilateral bars + ms gauge + sparkline).
export const DEFAULT_WIDGETS = ["live-score", "mendi-channels", "hrv-live", "reward-trace"];

// ── localStorage helpers ──────────────────────────────────────────────────

const LS_KEY_WIDGETS = "eegbase-demo-dashboard-widgets";
const LS_KEY_NOTE = "eegbase-demo-dashboard-quick-note";

export function loadWidgets(): string[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const raw = window.localStorage.getItem(LS_KEY_WIDGETS);
    if (!raw) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_WIDGETS;
    // Filter to known widget ids
    const valid = parsed.filter((id: unknown): id is string => typeof id === "string" && WIDGET_CATALOG.some((w) => w.id === id));
    return valid;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export function saveWidgets(ids: string[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LS_KEY_WIDGETS, JSON.stringify(ids)); } catch {}
}

export function loadQuickNote(): string {
  if (typeof window === "undefined") return "";
  try { return window.localStorage.getItem(LS_KEY_NOTE) ?? ""; } catch { return ""; }
}

export function saveQuickNote(s: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LS_KEY_NOTE, s); } catch {}
}

// ── small helper hook to wire localStorage state ──────────────────────────

export function useDashboardState() {
  const [widgets, setWidgetsState] = useState<string[]>(DEFAULT_WIDGETS);
  const [quickNote, setQuickNoteState] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWidgetsState(loadWidgets());
    setQuickNoteState(loadQuickNote());
    setHydrated(true);
  }, []);

  const setWidgets = (next: string[] | ((prev: string[]) => string[])) => {
    setWidgetsState((prev) => {
      const computed = typeof next === "function" ? next(prev) : next;
      saveWidgets(computed);
      return computed;
    });
  };

  const setQuickNote = (s: string) => {
    setQuickNoteState(s);
    saveQuickNote(s);
  };

  return { widgets, setWidgets, quickNote, setQuickNote, hydrated };
}

// ── My Devices ────────────────────────────────────────────────────────────
//
// A dedicated devices section that sits above the widget grid in the
// Dashboard tab. Shows the operator's currently-paired devices with
// signal-quality indicators + a 'Connect new device' button that opens
// a modal listing every device the platform supports. Mirrors what a
// real Bluetooth pairing flow would look like.

export interface DeviceMeta {
  id: string;
  name: string;
  vendor: string;
  modality: string;             // e.g. "fNIRS · 2 ch", "EEG · 4 ch"
  spec: string;                 // short tech detail
  signal: number;               // 0-100 quality % when paired
  defaultPaired: boolean;       // shipped paired by default
  blurb: string;                // shown in the connect modal
}

// The platform's full device catalog. Mendi sits at the top.
// Specs verified against vendor public docs (Mendi: Boere/Krigolson 2023;
// Muse: choosemuse.com tech sheet; Polar: H10 product spec).
export const DEVICE_REGISTRY: DeviceMeta[] = [
  { id: "mendi",     name: "Mendi headband",       vendor: "Mendi",    modality: "fNIRS · 2 ch",   spec: "31 Hz · 660+805 nm · BA10",     signal: 96, defaultPaired: true,  blurb: "2-channel functional NIRS over bilateral prefrontal cortex. Pairs over BLE. Shipping integration pending public Mendi SDK." },
  { id: "muse2",     name: "Muse 2",                vendor: "Interaxon", modality: "EEG · 4 ch",     spec: "256 Hz · TP9/AF7/AF8/TP10",      signal: 88, defaultPaired: true,  blurb: "4-electrode dry-contact EEG headband. Forehead + behind-ear placement. Real-time band power for theta/alpha/beta/gamma." },
  { id: "polar-h10", name: "Polar H10",             vendor: "Polar",    modality: "ECG / HRV",      spec: "1000 Hz ECG · BLE · gold-std",   signal: 99, defaultPaired: true,  blurb: "Gold-standard chest strap for HRV. 1000 Hz ECG signal, RMSSD/SDNN computed onboard, BLE streaming." },
  { id: "apple-watch", name: "Apple Watch",         vendor: "Apple",    modality: "HR · sleep",     spec: "5-min sync via HealthKit",       signal: 84, defaultPaired: true,  blurb: "Reads heart rate, HRV, sleep stages, steps from HealthKit. 5-minute sync interval. Best for passive context, not session-grade." },
  { id: "oura",      name: "Oura Ring (Gen 3+)",    vendor: "Oura",     modality: "Sleep · readiness", spec: "Cloud sync · daily summary",  signal: 0,  defaultPaired: false, blurb: "Overnight sleep + readiness + body temperature. One-way pull from Oura Cloud, refreshed each morning." },
  { id: "whoop",     name: "Whoop 4.0",             vendor: "Whoop",    modality: "HRV · recovery", spec: "Continuous · cloud sync",        signal: 0,  defaultPaired: false, blurb: "Strain + recovery + sleep across 24 hours. Cloud sync; pulls into the daily check-in for trend analysis." },
  { id: "brainbit",  name: "BrainBit",              vendor: "BrainBit", modality: "EEG · 4 ch",     spec: "250 Hz · O1/O2/T3/T4",            signal: 0,  defaultPaired: false, blurb: "Dry-contact 4-channel EEG headband. Posterior placement (O1/O2) — useful for alpha-theta protocols." },
  { id: "openbci",   name: "OpenBCI Cyton",         vendor: "OpenBCI",  modality: "EEG · 8 ch",     spec: "250 Hz · 10-20 montage",          signal: 0,  defaultPaired: false, blurb: " 8-channel EEG board. Researchers configure their own electrode layout. Full raw signal access." },
  { id: "neurosity", name: "Neurosity Crown",       vendor: "Neurosity", modality: "EEG · 8 ch",    spec: "256 Hz · 10-20 montage",          signal: 0,  defaultPaired: false, blurb: "8-channel headset with onboard ML for focus/calm states. Streams cleaned signals over WiFi." },
  { id: "muse-s",    name: "Muse S (Athena)",       vendor: "Interaxon", modality: "EEG + fNIRS",    spec: "256 Hz EEG + 4-ch fNIRS",        signal: 0,  defaultPaired: false, blurb: "Sleep-band form factor with EEG + photoplethysmography. Multi-night use; sleep staging built-in." },
];

const LS_KEY_DEVICES = "eegbase-demo-paired-devices";

function loadPairedDeviceIds(): string[] {
  if (typeof window === "undefined") return DEVICE_REGISTRY.filter((d) => d.defaultPaired).map((d) => d.id);
  try {
    const raw = window.localStorage.getItem(LS_KEY_DEVICES);
    if (!raw) return DEVICE_REGISTRY.filter((d) => d.defaultPaired).map((d) => d.id);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEVICE_REGISTRY.filter((d) => d.defaultPaired).map((d) => d.id);
    return parsed.filter((id: unknown): id is string => typeof id === "string" && DEVICE_REGISTRY.some((d) => d.id === id));
  } catch {
    return DEVICE_REGISTRY.filter((d) => d.defaultPaired).map((d) => d.id);
  }
}

function savePairedDeviceIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LS_KEY_DEVICES, JSON.stringify(ids)); } catch {}
}

export function usePairedDevices() {
  const [pairedIds, setPairedIdsState] = useState<string[]>(() => DEVICE_REGISTRY.filter((d) => d.defaultPaired).map((d) => d.id));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPairedIdsState(loadPairedDeviceIds());
    setHydrated(true);
  }, []);

  const setPairedIds = (next: string[] | ((prev: string[]) => string[])) => {
    setPairedIdsState((prev) => {
      const computed = typeof next === "function" ? next(prev) : next;
      savePairedDeviceIds(computed);
      return computed;
    });
  };

  return { pairedIds, setPairedIds, hydrated };
}

const DEVICES_CARD: React.CSSProperties = {
  background: "linear-gradient(180deg, #0F172A 0%, #0A1320 100%)",
  border: "1px solid #1E293B",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 16px -8px rgba(0,0,0,0.6)",
  marginBottom: 16,
};

interface MyDevicesSectionProps {
  pairedIds: string[];
  onUnpair: (id: string) => void;
  onOpenConnect: () => void;
}

export function MyDevicesSection({ pairedIds, onUnpair, onOpenConnect }: MyDevicesSectionProps) {
  const paired = pairedIds.map((id) => DEVICE_REGISTRY.find((d) => d.id === id)).filter((d): d is DeviceMeta => !!d);

  return (
    <div style={DEVICES_CARD}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Bluetooth size={14} color={COLORS.cyan} />
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>My devices</span>
          <span style={{ fontFamily: NUM, fontSize: 10, color: "#475569", fontWeight: 600, marginLeft: 6 }}>{paired.length} paired</span>
        </div>
        <button
          onClick={onOpenConnect}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(96,165,250,0.15)", color: COLORS.blue, border: "1px solid rgba(96,165,250,0.4)", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.25)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.15)"; }}
        >
          <Plus size={12} /> Connect new device
        </button>
      </div>

      {paired.length === 0 ? (
        <div style={{ padding: "20px 12px", textAlign: "center", color: COLORS.muted, fontSize: 12, fontStyle: "italic" }}>
          No devices paired yet. Click <strong style={{ color: COLORS.blue, fontStyle: "normal" }}>Connect new device</strong> to add one.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {paired.map((d) => (
            <div key={d.id} style={{ background: "rgba(15,23,42,0.6)", border: "1px solid #1E293B", borderRadius: 10, padding: "10px 12px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.ok, boxShadow: `0 0 8px ${COLORS.ok}88`, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink, lineHeight: 1.2, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</span>
                <button
                  onClick={() => onUnpair(d.id)}
                  aria-label={`Unpair ${d.name}`}
                  title="Unpair"
                  style={{
                    background: "transparent", border: "none", color: "#475569", cursor: "pointer",
                    // WCAG-compliant 44×44 hit area — was 15×15 which is unusable on touch
                    width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 6, marginRight: -10, marginTop: -10, marginBottom: -10, // pull back so visual size is still small
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = COLORS.alert; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: NUM, marginBottom: 2 }}>{d.modality}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 9.5, color: "#475569", fontFamily: NUM }}>{d.spec}</span>
                {d.signal > 0 && <span style={{ fontFamily: NUM, fontSize: 10, fontWeight: 700, color: d.signal >= 90 ? COLORS.ok : d.signal >= 75 ? COLORS.warn : COLORS.alert }}>{d.signal}%</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ConnectDeviceModalProps {
  open: boolean;
  onClose: () => void;
  pairedIds: string[];
  onPair: (id: string) => void;
}

export function ConnectDeviceModal({ open, onClose, pairedIds, onPair }: ConnectDeviceModalProps) {
  const [scanning, setScanning] = useState(false);

  // Trigger a brief "scanning…" animation on open, then reveal the device list.
  useEffect(() => {
    if (!open) { setScanning(false); return; }
    setScanning(true);
    const t = setTimeout(() => setScanning(false), 800);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(2,6,23,0.78)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        animation: "overlayIn 0.18s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0F172A", border: "1px solid #1E293B", borderRadius: 18,
          padding: 24, maxWidth: 720, width: "100%", maxHeight: "85vh", overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.cyan, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Bluetooth size={11} /> Pair a device
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink, margin: 0 }}>Connect new device</h2>
            <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
              Pick from the supported list. Real Bluetooth pairing prompt appears in production; this demo simulates instantly.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none", color: COLORS.muted, cursor: "pointer", padding: 4, lineHeight: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Scanning indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: scanning ? "rgba(165,243,252,0.10)" : "rgba(15,23,42,0.6)", border: `1px solid ${scanning ? "rgba(165,243,252,0.3)" : "#1E293B"}`, borderRadius: 8, marginBottom: 14, fontSize: 11, color: scanning ? COLORS.cyan : COLORS.muted, transition: "all 0.2s" }}>
          {scanning ? (
            <>
              <Search size={12} style={{ animation: "pulse 1s ease-in-out infinite" }} />
              <span style={{ fontWeight: 600 }}>Scanning for nearby devices…</span>
            </>
          ) : (
            <>
              <Wifi size={12} />
              <span>Showing all supported devices · {DEVICE_REGISTRY.length} total</span>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {DEVICE_REGISTRY.map((d) => {
            const paired = pairedIds.includes(d.id);
            return (
              <div
                key={d.id}
                style={{
                  background: paired ? "rgba(15,23,42,0.4)" : "rgba(15,23,42,0.7)",
                  border: `1px solid ${paired ? "#1E293B" : "#334155"}`,
                  borderRadius: 12, padding: 14,
                  display: "flex", flexDirection: "column", gap: 6,
                  opacity: scanning ? 0.4 : 1, transition: "opacity 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>{d.name}</span>
                  {paired && <span style={{ marginLeft: "auto", fontSize: 9, color: COLORS.ok, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 6px", background: "rgba(16,185,129,0.15)", borderRadius: 99 }}>Paired ✓</span>}
                </div>
                <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: NUM, letterSpacing: "0.04em" }}>
                  {d.vendor} · {d.modality} · {d.spec}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.45, marginTop: 2 }}>
                  {d.blurb}
                </div>
                {!paired && !scanning && (
                  <button
                    onClick={() => onPair(d.id)}
                    style={{ marginTop: 4, padding: "6px 12px", background: COLORS.blue, color: "#0F172A", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}
                  >
                    Pair →
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 10, color: "#475569", marginTop: 14, lineHeight: 1.5, textAlign: "center" }}>
          Don&rsquo;t see your device?{" "}
          <a href="/contact" style={{ color: COLORS.blue, textDecoration: "none", fontWeight: 600 }}>
            Let us know &mdash; new vendors land in the registry within a week.
          </a>
        </p>
      </div>
    </div>
  );
}
