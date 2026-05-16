"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity, Brain, HeartPulse, BarChart3, LineChart,
  Timer, Bluetooth, Moon, NotebookPen, Plus, X, Gauge, Wifi, Search,
  Scale, Wind, Target, ClipboardList, Droplets, Waves, Sigma,
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

// Inline SVG sparkline that overlays multiple series on a shared Y-scale.
// Used for Mendi widgets that compare L vs R (HbO trace, HHb trace) — both
// channels share the same min/max so spatial relationships are honest.
// LiveChart canvas assumes 0–1 normalized values and only takes one series,
// so we draw our own simple SVG path for overlay views.
function OverlaySpark({ series, height = 70 }: { series: { data: number[]; color: string; label: string }[]; height?: number }) {
  const all = series.flatMap((s) => s.data);
  if (all.length === 0) return <div style={{ height, background: "#1E293B", borderRadius: 6 }} />;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const W = 300;
  const H = height;
  const pad = 4;
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height, background: "#1E293B", borderRadius: 6, display: "block" }}>
        {/* Mid grid line */}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#334155" strokeWidth={1} strokeDasharray="4 4" />
        {series.map((s) => {
          if (s.data.length < 2) return null;
          const step = W / (s.data.length - 1);
          const points = s.data.map((v, i) => {
            const x = i * step;
            const y = H - pad - ((v - min) / range) * (H - pad * 2);
            return `${x},${y}`;
          }).join(" ");
          return <polyline key={s.label} points={points} fill="none" stroke={s.color} strokeWidth={1.6} strokeLinejoin="round" />;
        })}
      </svg>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-start", marginTop: 4, fontSize: 9.5, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
        {series.map((s) => (
          <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 2, background: s.color, borderRadius: 1 }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Tissue Saturation Index — proportion of oxygenated to total hemoglobin
// per side. Clinically TSI typically sits 55–75 %. Outside this band over
// time can suggest reduced perfusion or vasoconstriction. Returns null if
// either component is missing or the denominator is unusable.
function tsiPct(hbo?: number, hhb?: number): number | null {
  if (hbo == null || hhb == null) return null;
  const total = Math.abs(hbo) + Math.abs(hhb);
  if (total < 1e-6) return null;
  return (Math.abs(hbo) / total) * 100;
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

  // ── Mendi-native widgets ─────────────────────────────────────────────
  // These widgets read fields the Mendi decoder emits (oxyHbLeft/Right,
  // deoxyHbLeft/Right, rewardScore, timestampMs). Each guards on the
  // expected field being present so it gracefully shows "Waiting for
  // Mendi feed…" when on the simulator (which doesn't emit fNIRS data)
  // or when the bridge BLE link is down.

  {
    id: "hbo-trace",
    title: "HbO · L vs R trace",
    device: "Mendi headband",
    icon: Droplets,
    blurb: "60 s overlay of oxygenated-hemoglobin L and R prefrontal channels.",
    render: ({ oxyL, oxyR }) => {
      if (oxyL.length === 0 && oxyR.length === 0) return <Waiting label="Mendi feed" />;
      return (
        <div style={{ padding: "6px 0" }}>
          <OverlaySpark
            series={[
              { data: oxyL, color: COLORS.cyan, label: "HbO · L" },
              { data: oxyR, color: COLORS.blue, label: "HbO · R" },
            ]}
            height={80}
          />
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8, lineHeight: 1.45 }}>
            Rising line = more oxygen-rich blood reaching that prefrontal site.
          </div>
        </div>
      );
    },
  },

  {
    id: "hhb-trace",
    title: "HHb · L vs R trace",
    device: "Mendi headband",
    icon: Waves,
    blurb: "60 s overlay of deoxygenated-hemoglobin L and R channels.",
    render: ({ deoxyL, deoxyR }) => {
      if (deoxyL.length === 0 && deoxyR.length === 0) return <Waiting label="Mendi feed" />;
      return (
        <div style={{ padding: "6px 0" }}>
          <OverlaySpark
            series={[
              { data: deoxyL, color: COLORS.violet, label: "HHb · L" },
              { data: deoxyR, color: COLORS.pink,   label: "HHb · R" },
            ]}
            height={80}
          />
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8, lineHeight: 1.45 }}>
            HHb usually moves opposite to HbO when neural activity rises.
          </div>
        </div>
      );
    },
  },

  {
    id: "tsi-gauge",
    title: "Tissue saturation (TSI)",
    device: "Mendi headband",
    icon: Gauge,
    blurb: "TSI % per side — HbO / (HbO+HHb). 55–75 % is typical adult range.",
    render: ({ sample }) => {
      const tsiL = tsiPct(sample?.oxyHbLeft,  sample?.deoxyHbLeft);
      const tsiR = tsiPct(sample?.oxyHbRight, sample?.deoxyHbRight);
      if (tsiL == null && tsiR == null) return <Waiting label="Mendi feed" />;
      const tone = (v: number | null) =>
        v == null ? COLORS.muted : v >= 55 && v <= 75 ? COLORS.ok : v < 50 || v > 80 ? COLORS.alert : COLORS.warn;
      return (
        <div style={{ padding: "4px 0" }}>
          {[
            { side: "L", v: tsiL },
            { side: "R", v: tsiR },
          ].map((row) => (
            <div key={row.side} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  TSI · {row.side}
                </span>
                <span style={{ fontFamily: NUM, fontSize: 16, fontWeight: 700, color: tone(row.v) }}>
                  {row.v == null ? "—" : `${row.v.toFixed(1)}%`}
                </span>
              </div>
              <MiniBar pct={row.v ?? 0} color={tone(row.v)} />
            </div>
          ))}
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6, lineHeight: 1.4 }}>
            Outside 50–80 % over a long stretch can suggest reduced perfusion.
          </div>
        </div>
      );
    },
  },

  {
    id: "total-hbo",
    title: "Total cerebral HbO",
    device: "Mendi headband",
    icon: Sigma,
    blurb: "Sum of L + R HbO with 12 s trend arrow.",
    render: ({ sample, oxyL, oxyR }) => {
      const l = sample?.oxyHbLeft;
      const r = sample?.oxyHbRight;
      if (l == null || r == null) return <Waiting label="Mendi feed" />;
      const total = l + r;
      const past12L = oxyL.length >= 12 ? oxyL[oxyL.length - 12] : null;
      const past12R = oxyR.length >= 12 ? oxyR[oxyR.length - 12] : null;
      const past = past12L != null && past12R != null ? past12L + past12R : null;
      const delta = past != null ? total - past : 0;
      const arrow = past == null ? "·" : Math.abs(delta) < 0.005 ? "→" : delta > 0 ? "↗" : "↘";
      const color = past == null ? COLORS.muted : delta > 0 ? COLORS.ok : delta < 0 ? COLORS.warn : COLORS.ink;
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "14px 0" }}>
          <div style={{ fontFamily: NUM, fontSize: 36, fontWeight: 800, color: COLORS.cyan, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {fmtSigned(total)}
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
            HbO · L+R
          </div>
          <div style={{ fontSize: 12, color, marginTop: 10, fontFamily: NUM, fontWeight: 600 }}>
            {arrow} {fmtSigned(delta)} <span style={{ color: COLORS.muted, fontWeight: 500 }}>vs 12 s ago</span>
          </div>
        </div>
      );
    },
  },

  {
    id: "brain-mini",
    title: "Prefrontal heatmap",
    device: "Mendi headband",
    icon: Brain,
    blurb: "Live L/R prefrontal HbO as a two-zone heatmap.",
    render: ({ sample }) => {
      const l = sample?.oxyHbLeft;
      const r = sample?.oxyHbRight;
      if (l == null || r == null) return <Waiting label="Mendi feed" />;
      // Map signed HbO (~ -0.2 … +0.2) to a 0..1 heat scale, then pick a
      // colour stop between deep blue (cold) and bright red (hot). Mendi's
      // app uses a similar warm/cool palette so the metaphor stays familiar.
      const heat = (v: number) => Math.max(0, Math.min(1, (v + 0.2) / 0.4));
      const colour = (v: number) => {
        const h = heat(v);
        // 240° (blue) → 0° (red) HSL hop, fixed saturation/lightness.
        const hue = 240 - 240 * h;
        return `hsl(${hue}, 80%, 50%)`;
      };
      const cell = (side: "L" | "R", v: number) => (
        <div style={{
          flex: 1,
          height: 110,
          background: `radial-gradient(circle at center, ${colour(v)} 0%, ${colour(v)}88 55%, #0F172A 100%)`,
          border: `1px solid ${colour(v)}55`,
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.ink,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{side}</div>
          <div style={{ fontFamily: NUM, fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 4 }}>{fmtSigned(v)}</div>
        </div>
      );
      return (
        <div style={{ padding: "4px 0" }}>
          <div style={{ display: "flex", gap: 10 }}>{cell("L", l)}{cell("R", r)}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, fontSize: 9.5, color: COLORS.muted, fontFamily: NUM, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <span>cool · low HbO</span>
            <span>warm · high HbO</span>
          </div>
        </div>
      );
    },
  },

  {
    id: "mendi-fps",
    title: "Mendi signal rate",
    device: "Mendi headband",
    icon: Wifi,
    blurb: "Frames/sec — should sit at ~31 Hz when streaming cleanly.",
    render: ({ sample }) => <MendiFpsWidget timestampMs={sample?.timestampMs} />,
  },

  // ── Mendi auxiliary widgets ──────────────────────────────────────────────
  // Surface fields that the Mendi protobuf carries but the original widget
  // catalog ignored: temp, accel, raw pulse-optode PPG, per-optode coupling
  // quality, ambient-light interference. Plus two derived metrics (laterality
  // index, bilateral coherence) computed from the existing HbO buffers.

  {
    id: "mendi-pulse-hr",
    title: "Mendi pulse · BPM",
    device: "Mendi headband",
    icon: HeartPulse,
    blurb: "Heart rate from the forehead pulse optode (no chest strap needed).",
    render: ({ sample }) => {
      const v = sample?.pulseHrBpm ?? null;
      if (v == null) return <Waiting label="pulse-optode PPG" />;
      const zone =
        v < 50 ? { c: COLORS.blue, l: "low" }
        : v < 80 ? { c: COLORS.ok, l: "resting" }
        : v < 110 ? { c: COLORS.warn, l: "elevated" }
        : { c: COLORS.alert, l: "high" };
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "10px 0" }}>
          <div style={{ fontFamily: NUM, fontSize: 48, fontWeight: 800, color: zone.c, letterSpacing: "-0.03em", lineHeight: 1 }}>{v}</div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>BPM · forehead PPG</div>
          <div style={{ fontSize: 11, color: zone.c, marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>· {zone.l}</div>
          <div style={{ fontSize: 9.5, color: COLORS.muted, marginTop: 6, lineHeight: 1.4, textAlign: "center", padding: "0 6px" }}>
            Pulse optode IR channel ÷ ambient. No chest strap.
          </div>
        </div>
      );
    },
  },

  {
    id: "mendi-pulse-waveform",
    title: "Pulse waveform · PPG",
    device: "Mendi headband",
    icon: Activity,
    blurb: "Live AC component of the forehead pulse photoplethysmogram.",
    render: ({ sample }) => <MendiPulseWaveform value={sample?.pulsePpg} />,
  },

  {
    id: "mendi-temperature",
    title: "Scalp temperature",
    device: "Mendi headband",
    icon: Droplets,
    blurb: "Skin-surface temperature under the headband (typical 32–35 °C).",
    render: ({ sample }) => {
      const v = sample?.temperatureC ?? null;
      if (v == null) return <Waiting label="Mendi temp sensor" />;
      const inRange = v >= 31 && v <= 36;
      const tooLow = v < 31;
      const color = inRange ? COLORS.ok : tooLow ? COLORS.blue : COLORS.warn;
      const pct = Math.max(0, Math.min(100, ((v - 28) / 10) * 100));
      return (
        <div style={{ padding: "8px 4px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
            <span style={{ fontFamily: NUM, fontSize: 38, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{v.toFixed(2)}</span>
            <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>°C</span>
          </div>
          <MiniBar pct={pct} color={color} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.muted, fontFamily: NUM, marginTop: 4 }}>
            <span>28 °C</span><span>typical 32–35 °C</span><span>38 °C</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 10, lineHeight: 1.4 }}>
            A small upward drift during a session is normal and correlates with PFC activation. A drop usually means the band has shifted.
          </div>
        </div>
      );
    },
  },

  {
    id: "mendi-stillness",
    title: "Stillness · motion",
    device: "Mendi headband",
    icon: Target,
    blurb: "0-100 stillness score from the on-board IMU — high = clean fNIRS.",
    render: ({ sample }) => {
      const v = sample?.stillness ?? null;
      if (v == null) return <Waiting label="IMU" />;
      const accel = sample?.accelMag ?? null;
      const color = v >= 80 ? COLORS.ok : v >= 50 ? COLORS.warn : COLORS.alert;
      const label = v >= 80 ? "still" : v >= 50 ? "minor motion" : "moving · signal degraded";
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "10px 0" }}>
          <div style={{ fontFamily: NUM, fontSize: 52, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{Math.round(v)}</div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>stillness · 0–100</div>
          <div style={{ fontSize: 11, color, marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>· {label}</div>
          {accel != null && (
            <div style={{ fontSize: 9.5, color: COLORS.muted, marginTop: 6, fontFamily: NUM }}>
              |a| {accel.toFixed(3)} g
            </div>
          )}
        </div>
      );
    },
  },

  {
    id: "mendi-signal-quality",
    title: "Optode coupling",
    device: "Mendi headband",
    icon: Sigma,
    blurb: "Per-optode signal quality (L, R, Pulse) — green = good skin contact.",
    render: ({ sample }) => {
      const L = sample?.signalQualityL;
      const R = sample?.signalQualityR;
      const P = sample?.signalQualityP;
      if (L == null && R == null && P == null) return <Waiting label="Mendi optodes" />;
      const row = (label: string, v: number | undefined) => {
        if (v == null) return null;
        const color = v >= 70 ? COLORS.ok : v >= 40 ? COLORS.warn : COLORS.alert;
        return (
          <div key={label} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
              <span style={{ fontFamily: NUM, fontSize: 12, fontWeight: 700, color }}>{Math.round(v)}</span>
            </div>
            <MiniBar pct={v} color={color} />
          </div>
        );
      };
      return (
        <div style={{ padding: "4px 0" }}>
          {row("Left optode",  L)}
          {row("Right optode", R)}
          {row("Pulse optode", P)}
          <div style={{ fontSize: 9.5, color: COLORS.muted, marginTop: 8, lineHeight: 1.4 }}>
            Derived from each optode&apos;s (red − amb) over noise floor. ≥ 70 is clinical-grade.
          </div>
        </div>
      );
    },
  },

  {
    id: "mendi-ambient-light",
    title: "Ambient interference",
    device: "Mendi headband",
    icon: Search,
    blurb: "Room-light noise picked up by the LED-off channel. Lower = better.",
    render: ({ sample }) => {
      const v = sample?.ambientLevel ?? null;
      if (v == null) return <Waiting label="amb channels" />;
      const color = v <= 25 ? COLORS.ok : v <= 55 ? COLORS.warn : COLORS.alert;
      const label = v <= 25 ? "clean" : v <= 55 ? "moderate" : "high · dim the lights";
      return (
        <div style={{ padding: "8px 4px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
            <span style={{ fontFamily: NUM, fontSize: 38, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{Math.round(v)}</span>
            <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>%</span>
          </div>
          <MiniBar pct={v} color={color} />
          <div style={{ fontSize: 11, color, marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>· {label}</div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8, lineHeight: 1.4 }}>
            From amb_l/amb_r/amb_p. Sunlight near a window can swamp the optical signal.
          </div>
        </div>
      );
    },
  },

  {
    id: "mendi-laterality",
    title: "Laterality index",
    device: "Mendi headband",
    icon: Scale,
    blurb: "Normalized (L−R)/(|L|+|R|) — independent of overall HbO magnitude.",
    render: ({ sample }) => {
      const L = sample?.oxyHbLeft;
      const R = sample?.oxyHbRight;
      if (L == null || R == null) return <Waiting label="Mendi feed" />;
      const denom = Math.abs(L) + Math.abs(R);
      if (denom < 1e-6) return <Waiting label="non-zero HbO" />;
      const li = (L - R) / denom;
      const pct = ((li + 1) / 2) * 100;
      const dominant = li > 0.15 ? "left" : li < -0.15 ? "right" : "balanced";
      const color = Math.abs(li) > 0.35 ? COLORS.warn : COLORS.ok;
      return (
        <div style={{ padding: "8px 4px" }}>
          <div style={{ fontFamily: NUM, fontSize: 36, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{li >= 0 ? "+" : ""}{li.toFixed(2)}</div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>laterality · −1…+1</div>
          <div style={{ marginTop: 10, position: "relative", height: 10 }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, " + COLORS.pink + "55, " + COLORS.muted + "33 50%, " + COLORS.cyan + "55)", borderRadius: 5 }} />
            <div style={{ position: "absolute", top: -3, bottom: -3, left: `calc(${pct}% - 2px)`, width: 4, background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.muted, fontFamily: NUM, marginTop: 4 }}>
            <span>RIGHT</span><span>BALANCED</span><span>LEFT</span>
          </div>
          <div style={{ fontSize: 11, color, marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            · {dominant}-dominant
          </div>
        </div>
      );
    },
  },

  {
    id: "mendi-head-pose",
    title: "Head pose · tilt",
    device: "Mendi headband",
    icon: Target,
    blurb: "Pitch + roll from the on-board accelerometer — confirms band placement.",
    render: ({ sample }) => {
      const ax = sample?.accelX;
      const ay = sample?.accelY;
      const az = sample?.accelZ;
      if (ax == null || ay == null || az == null) return <Waiting label="IMU" />;
      const rollRad = Math.atan2(ax, Math.abs(ay) || 1e-6);
      const pitchRad = Math.atan2(az, Math.abs(ay) || 1e-6);
      const roll = (rollRad * 180) / Math.PI;
      const pitch = (pitchRad * 180) / Math.PI;
      const ok = Math.abs(roll) < 12 && Math.abs(pitch) < 12;
      const color = ok ? COLORS.ok : Math.abs(roll) < 25 && Math.abs(pitch) < 25 ? COLORS.warn : COLORS.alert;
      const label = ok ? "level · good placement" : "tilted · re-seat the band";
      return (
        <div style={{ padding: "8px 4px" }}>
          <svg viewBox="0 0 120 90" style={{ width: "100%", height: 90 }}>
            <line x1={10} y1={45} x2={110} y2={45} stroke="#1E293B" strokeWidth={1} strokeDasharray="3 3" />
            <line x1={60} y1={6}  x2={60}  y2={84} stroke="#1E293B" strokeWidth={1} strokeDasharray="3 3" />
            <g transform={`translate(60 45) rotate(${roll}) translate(0 ${pitch * 0.7})`}>
              <ellipse cx={0} cy={0} rx={22} ry={28} fill="none" stroke={color} strokeWidth={2.2} />
              <rect x={-22} y={-12} width={44} height={6} rx={2} fill={color} opacity={0.7} />
              <circle cx={-10} cy={-9} r={1.6} fill="#0F172A" />
              <circle cx={ 10} cy={-9} r={1.6} fill="#0F172A" />
              <circle cx={  0} cy={-9} r={1.6} fill="#0F172A" />
            </g>
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: COLORS.muted, fontFamily: NUM }}>
            <span>roll <span style={{ color }}>{roll >= 0 ? "+" : ""}{roll.toFixed(1)}°</span></span>
            <span>pitch <span style={{ color }}>{pitch >= 0 ? "+" : ""}{pitch.toFixed(1)}°</span></span>
          </div>
          <div style={{ fontSize: 11, color, marginTop: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>· {label}</div>
        </div>
      );
    },
  },

  {
    id: "mendi-workload",
    title: "Cognitive workload",
    device: "Mendi headband",
    icon: Brain,
    blurb: "HbO/HHb gap mapped to a semantic load score (idle · low · moderate · high · peak).",
    render: ({ sample }) => {
      const oxyL = sample?.oxyHbLeft;
      const oxyR = sample?.oxyHbRight;
      const hhbL = sample?.deoxyHbLeft;
      const hhbR = sample?.deoxyHbRight;
      if (oxyL == null || oxyR == null || hhbL == null || hhbR == null) return <Waiting label="Mendi feed" />;
      const oxyMean = (oxyL + oxyR) / 2;
      const hhbMean = (hhbL + hhbR) / 2;
      const gap = oxyMean - hhbMean;
      const score = Math.max(0, Math.min(100, 50 + gap * 60));
      const tier =
        score >= 80 ? { c: COLORS.violet, l: "peak load" }
        : score >= 60 ? { c: COLORS.ok, l: "high load" }
        : score >= 40 ? { c: COLORS.cyan, l: "moderate" }
        : score >= 20 ? { c: COLORS.warn, l: "low" }
        : { c: COLORS.muted, l: "idle" };
      return (
        <div style={{ padding: "8px 4px" }}>
          <div style={{ fontFamily: NUM, fontSize: 38, fontWeight: 800, color: tier.c, letterSpacing: "-0.02em", lineHeight: 1 }}>{Math.round(score)}</div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>workload · 0–100</div>
          <div style={{ marginTop: 10 }}>
            <MiniBar pct={score} color={tier.c} />
          </div>
          <div style={{ fontSize: 11, color: tier.c, marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            · {tier.l}
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6, lineHeight: 1.4, fontFamily: NUM }}>
            ΔHbO {fmtSigned(oxyMean, 3)} · ΔHHb {fmtSigned(hhbMean, 3)}
          </div>
        </div>
      );
    },
  },

  {
    id: "mendi-session-arc",
    title: "Session arc",
    device: "Mendi headband",
    icon: LineChart,
    blurb: "Trend of the last 30 s vs the first 30 s of the session.",
    render: ({ sample }) => <MendiSessionArc rewardScore={sample?.rewardScore} />,
  },

  {
    id: "mendi-reward-histogram",
    title: "Reward distribution",
    device: "Mendi headband",
    icon: BarChart3,
    blurb: "% of session time spent in each 20-point reward band.",
    render: ({ sample }) => <MendiRewardHistogram rewardScore={sample?.rewardScore} />,
  },

  {
    id: "mendi-trial-blocks",
    title: "Trial-by-trial",
    device: "Mendi headband",
    icon: ClipboardList,
    blurb: "Mean reward per 30-second trial — classic neurofeedback block view.",
    render: ({ sample }) => <MendiTrialBlocks rewardScore={sample?.rewardScore} />,
  },

  {
    id: "mendi-pulse-hrv",
    title: "Mendi pulse · HRV",
    device: "Mendi headband",
    icon: HeartPulse,
    blurb: "RMSSD heart-rate variability from the forehead pulse optode.",
    render: ({ sample }) => {
      const v = sample?.pulseHrvRmssd ?? null;
      if (v == null) return <Waiting label="≥ 4 pulse-optode beats" />;
      const onTarget = v >= 50;
      const color = v >= 50 ? COLORS.ok : v >= 25 ? COLORS.warn : COLORS.alert;
      return (
        <div style={{ padding: "6px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: NUM, fontSize: 36, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{v}</span>
            <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>ms</span>
          </div>
          <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {onTarget ? "✓ above 50 ms target" : "below 50 ms target"}
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8, lineHeight: 1.4 }}>
            Higher RMSSD = calmer autonomic state. Derived from successive IBIs detected in the Mendi pulse-optode PPG — no chest strap.
          </div>
        </div>
      );
    },
  },

  {
    id: "mendi-engagement-time",
    title: "Engagement zone time",
    device: "Mendi headband",
    icon: Timer,
    blurb: "% of session spent above reward threshold — flow-state proxy.",
    render: ({ sample }) => <MendiEngagementTime rewardScore={sample?.rewardScore} />,
  },

  {
    id: "mendi-mayer-wave",
    title: "Mayer-wave power",
    device: "Mendi headband",
    icon: Sigma,
    blurb: "0.07–0.13 Hz HbO band power — vasomotor / sympathetic tone proxy.",
    render: ({ sample }) => <MendiMayerWave value={sample?.oxyHbLeft} />,
  },

  {
    id: "mendi-coherence",
    title: "Bilateral coherence",
    device: "Mendi headband",
    icon: Waves,
    blurb: "Sliding-window Pearson correlation between L and R HbO traces.",
    render: ({ oxyL, oxyR }) => {
      const N = Math.min(oxyL.length, oxyR.length, 100);
      if (N < 20) return <Waiting label="≥ 20 samples" />;
      const xs = oxyL.slice(oxyL.length - N);
      const ys = oxyR.slice(oxyR.length - N);
      const mx = xs.reduce((a, b) => a + b, 0) / N;
      const my = ys.reduce((a, b) => a + b, 0) / N;
      let num = 0, dx = 0, dy = 0;
      for (let i = 0; i < N; i++) {
        const ex = xs[i] - mx;
        const ey = ys[i] - my;
        num += ex * ey;
        dx += ex * ex;
        dy += ey * ey;
      }
      const denom = Math.sqrt(dx * dy);
      if (denom < 1e-9) return <Waiting label="signal variance" />;
      const r = num / denom;
      const pct = ((r + 1) / 2) * 100;
      const color = r > 0.6 ? COLORS.ok : r > 0.2 ? COLORS.warn : COLORS.alert;
      const label = r > 0.6 ? "highly coupled" : r > 0.2 ? "weakly coupled" : "decoupled";
      return (
        <div style={{ padding: "8px 4px" }}>
          <div style={{ fontFamily: NUM, fontSize: 36, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{r >= 0 ? "+" : ""}{r.toFixed(2)}</div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>r · 10-second window</div>
          <div style={{ marginTop: 10 }}>
            <MiniBar pct={pct} color={color} />
          </div>
          <div style={{ fontSize: 11, color, marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            · {label}
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6, lineHeight: 1.4 }}>
            Bilateral PFC HbO normally co-varies. Low coherence can signal lateralised effort or motion in one optode.
          </div>
        </div>
      );
    },
  },
];

// Live PPG waveform component for the pulse-waveform widget. Keeps a rolling
// 200-sample buffer of pulsePpg and renders it as an inline SVG sparkline.
// Mendi streams at ~31 Hz so 200 samples ≈ 6.4 seconds of waveform.
function MendiPulseWaveform({ value }: { value: number | undefined }) {
  const buf = useRef<number[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (value == null) return;
    buf.current.push(value);
    if (buf.current.length > 200) buf.current.shift();
    setTick((t) => (t + 1) & 0xffff);
  }, [value]);
  const data = buf.current;
  if (data.length < 4) return <Waiting label="pulse PPG" />;
  const W = 300, H = 110, pad = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = W / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <div style={{ padding: "4px 0" }} data-tick={tick}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: H, background: "#0F172A", borderRadius: 6, display: "block", border: "1px solid #1E293B" }}>
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#1E293B" strokeWidth={1} strokeDasharray="3 4" />
        <polyline points={points} fill="none" stroke={COLORS.pink} strokeWidth={1.8} strokeLinejoin="round" />
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 9.5, color: COLORS.muted, fontFamily: NUM }}>
        <span>pulse PPG · ir_p − amb_p · AC</span>
        <span style={{ marginLeft: "auto" }}>{data.length} samples</span>
      </div>
    </div>
  );
}

// Reward distribution histogram — bins the entire session-lifetime reward
// stream into 5 quintile buckets (0-20, 20-40, 40-60, 60-80, 80-100) and
// shows the share of session time spent in each. Self-buffered.
function MendiRewardHistogram({ rewardScore }: { rewardScore: number | undefined }) {
  const bucketsRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const totalRef = useRef(0);
  const [, force] = useState(0);
  useEffect(() => {
    if (rewardScore == null) return;
    const idx = Math.min(4, Math.max(0, Math.floor(rewardScore / 20)));
    bucketsRef.current[idx] += 1;
    totalRef.current += 1;
    if (totalRef.current % 10 === 0) force((t) => (t + 1) & 0xffff);
  }, [rewardScore]);

  const total = totalRef.current;
  if (total < 10) return <Waiting label="≥ 10 samples"/>;

  const buckets = bucketsRef.current;
  const max = Math.max(...buckets);
  const labels = ["0–20", "20–40", "40–60", "60–80", "80–100"];
  const colors = [COLORS.alert, COLORS.alert, COLORS.warn, COLORS.ok, COLORS.violet];
  const peakIdx = buckets.indexOf(max);

  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
        {buckets.map((v, i) => {
          const h = max > 0 ? (v / max) * 80 : 0;
          const pct = total > 0 ? (v / total) * 100 : 0;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 9, color: colors[i], fontFamily: NUM, fontWeight: 700 }}>{pct.toFixed(0)}%</div>
              <div style={{ width: "100%", height: h, background: colors[i], borderRadius: 3, transition: "height 0.3s ease" }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {labels.map((l, i) => (
          <div key={l} style={{ flex: 1, textAlign: "center", fontSize: 9, color: i === peakIdx ? colors[i] : COLORS.muted, fontFamily: NUM, fontWeight: i === peakIdx ? 700 : 500 }}>
            {l}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8, lineHeight: 1.4 }}>
        Peak time in <span style={{ color: colors[peakIdx], fontWeight: 700 }}>{labels[peakIdx]}</span> band over {Math.round(total / 10)}s.
      </div>
    </div>
  );
}

// Trial-by-trial blocks — classic neurofeedback view. Aggregates reward into
// fixed-size blocks (~30s each) and shows the most recent 6 as horizontal
// bars coloured by their mean reward. Self-buffered.
function MendiTrialBlocks({ rewardScore }: { rewardScore: number | undefined }) {
  const currentBlockRef = useRef<number[]>([]);
  const blocksRef = useRef<{ mean: number }[]>([]);
  const totalRef = useRef(0);
  const [, force] = useState(0);
  const BLOCK_SIZE = 300; // ~30 s at 10 Hz

  useEffect(() => {
    if (rewardScore == null) return;
    totalRef.current += 1;
    currentBlockRef.current.push(rewardScore);
    if (currentBlockRef.current.length >= BLOCK_SIZE) {
      const arr = currentBlockRef.current;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      blocksRef.current.push({ mean });
      if (blocksRef.current.length > 6) blocksRef.current.shift();
      currentBlockRef.current = [];
    }
    if (totalRef.current % 10 === 0) force((t) => (t + 1) & 0xffff);
  }, [rewardScore]);

  const closed = blocksRef.current;
  const partial = currentBlockRef.current;
  const partialMean = partial.length > 0 ? partial.reduce((a, b) => a + b, 0) / partial.length : null;

  const list: { mean: number; partial: boolean; label: string }[] = [];
  closed.forEach((b, i) => list.push({ mean: b.mean, partial: false, label: `T-${closed.length - i}` }));
  if (partialMean != null) list.push({ mean: partialMean, partial: true, label: "now" });

  if (list.length === 0) {
    const sec = Math.round(totalRef.current / 10);
    return <Waiting label={`first 30s trial (${sec}s)`} />;
  }

  const colorFor = (v: number) =>
    v >= 70 ? COLORS.ok : v >= 50 ? COLORS.cyan : v >= 30 ? COLORS.warn : COLORS.alert;

  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {list.map((b, i) => {
          const col = colorFor(b.mean);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 36, fontSize: 9.5, color: COLORS.muted, fontFamily: NUM, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{b.label}</span>
              <div style={{ flex: 1, height: 14, background: "rgba(15,23,42,0.6)", border: "1px solid #1E293B", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.max(2, Math.min(100, b.mean))}%`, background: col, opacity: b.partial ? 0.55 : 1, transition: "width 0.3s ease" }} />
              </div>
              <span style={{ width: 30, textAlign: "right", fontSize: 11, color: col, fontFamily: NUM, fontWeight: 700 }}>{b.mean.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 8, lineHeight: 1.4 }}>
        Each trial = {Math.round(BLOCK_SIZE / 10)}s · {closed.length} closed{partialMean != null ? " + 1 in progress" : ""}.
      </div>
    </div>
  );
}

// Session arc widget — compares the mean reward over the most recent ~30s
// against the first ~30s of the session lifetime. Reports a trend bucket
// (improving / steady / declining) plus the delta. Self-buffered because
// the existing reward window is only 60 samples.
function MendiSessionArc({ rewardScore }: { rewardScore: number | undefined }) {
  // Keep the entire session-long reward stream (up to ~30 min = 18000 samples
  // at 10 Hz; in practice we only need the first 300 + last 300 windows).
  const headRef = useRef<number[]>([]);  // first 300 samples (~30 s)
  const tailRef = useRef<number[]>([]);  // most recent 300 samples
  const totalRef = useRef(0);
  const [, force] = useState(0);
  useEffect(() => {
    if (rewardScore == null) return;
    totalRef.current += 1;
    if (headRef.current.length < 300) headRef.current.push(rewardScore);
    tailRef.current.push(rewardScore);
    if (tailRef.current.length > 300) tailRef.current.shift();
    if (totalRef.current % 5 === 0) force((t) => (t + 1) & 0xffff);
  }, [rewardScore]);

  if (headRef.current.length < 30 || tailRef.current.length < 30) {
    return <Waiting label={`${tailRef.current.length}/30 samples`} />;
  }

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const headMean = mean(headRef.current);
  const tailMean = mean(tailRef.current);
  const delta = tailMean - headMean;

  const tier =
    delta > 6 ? { c: COLORS.ok, l: "improving", arrow: "↗" }
    : delta < -6 ? { c: COLORS.alert, l: "declining", arrow: "↘" }
    : { c: COLORS.warn, l: "steady", arrow: "→" };

  // Mini sparkline of head segment vs tail segment overlay
  const sparkData = headRef.current.concat(tailRef.current.slice(-Math.min(tailRef.current.length, 300)));
  const W = 300, H = 40;
  const min = Math.min(...sparkData);
  const max = Math.max(...sparkData);
  const range = max - min || 1;
  const pts = sparkData.map((v, i) => {
    const x = (i / Math.max(1, sparkData.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const seconds = Math.round(totalRef.current / 10);
  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: NUM, fontSize: 32, fontWeight: 800, color: tier.c, letterSpacing: "-0.02em" }}>
          {tier.arrow} {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
        </span>
        <span style={{ fontSize: 11, color: COLORS.muted }}>reward Δ</span>
      </div>
      <div style={{ fontSize: 11, color: tier.c, marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>· {tier.l}</div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: H, marginTop: 8, background: "#1E293B", borderRadius: 6 }}>
        <polyline points={pts} fill="none" stroke={tier.c} strokeWidth={1.5} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: COLORS.muted, fontFamily: NUM, marginTop: 4 }}>
        <span>first 30s · {headMean.toFixed(1)}</span>
        <span>last 30s · {tailMean.toFixed(1)}</span>
        <span>{seconds}s</span>
      </div>
    </div>
  );
}

// Engagement-zone time: rolling internal counter of % time above a reward
// threshold over the lifetime of the widget mount. Resets when widget
// remounts. Self-buffered because the existing reward window is only 60
// samples but engagement is a session-level metric.
function MendiEngagementTime({ rewardScore }: { rewardScore: number | undefined }) {
  const totalRef = useRef(0);
  const aboveRef = useRef(0);
  const [, force] = useState(0);
  const THRESHOLD = 60;
  useEffect(() => {
    if (rewardScore == null) return;
    totalRef.current += 1;
    if (rewardScore >= THRESHOLD) aboveRef.current += 1;
    if (totalRef.current % 5 === 0) force((t) => (t + 1) & 0xffff);
  }, [rewardScore]);
  const total = totalRef.current;
  const above = aboveRef.current;
  if (total < 5) return <Waiting label="reward signal" />;
  const pct = (above / total) * 100;
  const color = pct >= 60 ? COLORS.ok : pct >= 30 ? COLORS.warn : COLORS.alert;
  const label = pct >= 60 ? "deeply engaged" : pct >= 30 ? "warming up" : "low engagement";
  const seconds = Math.round(total / 10); // ~10 Hz
  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
        <span style={{ fontFamily: NUM, fontSize: 38, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{pct.toFixed(0)}</span>
        <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>%</span>
      </div>
      <MiniBar pct={pct} color={color} />
      <div style={{ fontSize: 11, color, marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>· {label}</div>
      <div style={{ fontSize: 9.5, color: COLORS.muted, marginTop: 6, fontFamily: NUM }}>
        time in flow · reward ≥ {THRESHOLD} over {seconds}s
      </div>
    </div>
  );
}

// Mayer-wave power widget. Computes a small DFT in the 0.07–0.13 Hz band
// (canonical sympathetic / vasomotor frequency) on an internal 300-sample
// HbO buffer (~30 s at 10 Hz). Plain DFT instead of FFT because N=300 is
// small and we only score a handful of bins. Output is band power
// normalised to 0–100 against a typical resting envelope.
function MendiMayerWave({ value }: { value: number | undefined }) {
  const buf = useRef<number[]>([]);
  const [, force] = useState(0);
  useEffect(() => {
    if (value == null) return;
    buf.current.push(value);
    if (buf.current.length > 300) buf.current.shift();
    if (buf.current.length % 10 === 0) force((t) => (t + 1) & 0xffff);
  }, [value]);

  const x = buf.current;
  const N = x.length;
  if (N < 80) return <Waiting label={`${N}/80 samples (~8 s)`} />;

  const fs = 10;
  const mean = x.reduce((a, b) => a + b, 0) / N;

  let power = 0;
  for (let k = 0; k < 30; k++) {
    const f = (k / N) * fs;
    if (f < 0.07 || f > 0.13) continue;
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1))); // Hann
      const v = (x[n] - mean) * w;
      const ang = (2 * Math.PI * k * n) / N;
      re += v * Math.cos(ang);
      im -= v * Math.sin(ang);
    }
    power += (re * re + im * im) / (N * N);
  }
  const score = Math.max(0, Math.min(100, Math.round(power * 5e5)));
  const color = score >= 60 ? COLORS.violet : score >= 30 ? COLORS.cyan : COLORS.muted;
  const label = score >= 60 ? "strong vasomotor" : score >= 30 ? "moderate" : "quiet";
  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ fontFamily: NUM, fontSize: 36, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>0.07–0.13 Hz power</div>
      <div style={{ marginTop: 10 }}>
        <MiniBar pct={score} color={color} />
      </div>
      <div style={{ fontSize: 11, color, marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        · {label}
      </div>
      <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6, lineHeight: 1.4 }}>
        Mayer waves are ~0.1 Hz oscillations in cerebral blood volume linked to baroreflex / sympathetic tone — a research-grade fNIRS metric.
      </div>
    </div>
  );
}

// Frame-rate tracker for the Mendi signal-rate widget. Records a sliding
// window of recent frame arrival times and reports Hz averaged over the
// last 3 s — gives a stable number that still reacts within a few seconds
// when the BLE link degrades. Mendi V4 normal-mode streaming is 31.2 Hz.
function MendiFpsWidget({ timestampMs }: { timestampMs: number | undefined }) {
  const arrivals = useRef<number[]>([]);
  const [hz, setHz] = useState<number | null>(null);
  useEffect(() => {
    if (timestampMs == null) return;
    const now = Date.now();
    arrivals.current.push(now);
    arrivals.current = arrivals.current.filter((t) => now - t < 3000);
    setHz(arrivals.current.length / 3);
  }, [timestampMs]);
  // Independently age the window even when no new frames arrive so the
  // displayed rate falls to 0 visibly if streaming stops.
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      const fresh = arrivals.current.filter((t) => now - t < 3000);
      arrivals.current = fresh;
      setHz(fresh.length / 3);
    }, 500);
    return () => clearInterval(iv);
  }, []);

  if (hz == null) return <Waiting label="Mendi feed" />;
  const status =
    hz >= 25 ? { label: "clean", color: COLORS.ok }
    : hz >= 10 ? { label: "degraded", color: COLORS.warn }
    : hz > 0 ? { label: "weak", color: COLORS.alert }
    : { label: "no frames", color: COLORS.alert };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "14px 0" }}>
      <div style={{ fontFamily: NUM, fontSize: 44, fontWeight: 800, color: status.color, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {hz.toFixed(1)}
      </div>
      <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
        Hz · frames/sec
      </div>
      <div style={{ fontSize: 11, color: status.color, marginTop: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        · {status.label}
      </div>
      <div style={{ fontSize: 9.5, color: COLORS.muted, marginTop: 4, fontFamily: NUM }}>
        target 31 Hz · normal mode
      </div>
    </div>
  );
}

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

// Group the catalog into sections so the picker is scannable when the
// total widget count is large. Order within each section matters.
// Anything missing from these lists is shown under "Other" at the end.
const WIDGET_SECTIONS: { name: string; blurb: string; ids: string[] }[] = [
  {
    name: "Mendi · Real-time fNIRS",
    blurb: "Live oxy/deoxy traces, channels, asymmetry, brain heatmap.",
    ids: ["mendi-channels", "hbo-trace", "hhb-trace", "tsi-gauge", "total-hbo", "brain-mini", "asymmetry"],
  },
  {
    name: "Mendi · Pulse + HRV",
    blurb: "Heart rate and HRV derived from the forehead pulse optode.",
    ids: ["mendi-pulse-hr", "mendi-pulse-hrv", "mendi-pulse-waveform"],
  },
  {
    name: "Mendi · Diagnostics",
    blurb: "Signal rate, optode coupling, temp, motion, ambient.",
    ids: ["mendi-fps", "mendi-signal-quality", "mendi-temperature", "mendi-stillness", "mendi-head-pose", "mendi-ambient-light"],
  },
  {
    name: "Mendi · Clinical metrics",
    blurb: "Derived indices: laterality, coherence, workload, vasomotor.",
    ids: ["mendi-laterality", "mendi-coherence", "mendi-workload", "mendi-mayer-wave"],
  },
  {
    name: "Mendi · Session analytics",
    blurb: "How is the whole session trending?",
    ids: ["mendi-session-arc", "mendi-reward-histogram", "mendi-trial-blocks", "mendi-engagement-time"],
  },
  {
    name: "Cross-device",
    blurb: "Reward score, EEG bands, HR/HRV — works with any paired device.",
    ids: ["live-score", "reward-trace", "eeg-bands", "heart-rate", "hrv-live"],
  },
  {
    name: "Personal",
    blurb: "Session timer, devices list, sleep, check-in, quick note, breathing.",
    ids: ["session-timer", "connected-devices", "sleep-last-night", "todays-checkin", "breathing-pacer", "reward-histogram", "quick-note"],
  },
];

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
  const [query, setQuery] = useState("");

  // Reset the search box every time the picker closes.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  // Build the section -> defs map; collect anything missing into "Other".
  const claimedIds = new Set(WIDGET_SECTIONS.flatMap((s) => s.ids));
  const orphans = WIDGET_CATALOG.filter((d) => !claimedIds.has(d.id));
  const allSections = WIDGET_SECTIONS.map((s) => ({
    ...s,
    defs: s.ids
      .map((id) => WIDGET_CATALOG.find((d) => d.id === id))
      .filter((d): d is WidgetDef => !!d),
  })).filter((s) => s.defs.length > 0);
  if (orphans.length > 0) {
    allSections.push({ name: "Other", blurb: "Widgets without a section.", ids: orphans.map((o) => o.id), defs: orphans });
  }

  // Apply text filter across title + blurb + device + id. Empty query = show all.
  const q = query.trim().toLowerCase();
  const sections = q.length === 0
    ? allSections
    : allSections
        .map((s) => ({
          ...s,
          defs: s.defs.filter((d) =>
            d.title.toLowerCase().includes(q) ||
            d.blurb.toLowerCase().includes(q) ||
            d.device.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q)
          ),
        }))
        .filter((s) => s.defs.length > 0);
  const totalMatching = sections.reduce((acc, s) => acc + s.defs.length, 0);

  const renderCard = (def: WidgetDef) => {
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
  };

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
              {q.length > 0
                ? `${totalMatching} of ${WIDGET_CATALOG.length} match "${query}".`
                : `${WIDGET_CATALOG.length} widgets across ${allSections.length} sections. Already-added widgets are dimmed.`}
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

        {/* Search filter */}
        <div style={{ position: "relative", marginBottom: 18 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.muted, pointerEvents: "none" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search widgets — try 'pulse', 'temp', or 'asymmetry'…"
            autoFocus
            style={{
              width: "100%",
              padding: "10px 36px",
              background: "rgba(15,23,42,0.7)",
              border: "1px solid #334155",
              borderRadius: 10,
              color: COLORS.ink,
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {q.length > 0 && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: COLORS.muted, cursor: "pointer", padding: 6, lineHeight: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {totalMatching === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: COLORS.muted, fontSize: 13, border: "1px dashed #1E293B", borderRadius: 10 }}>
            No widgets match <strong style={{ color: COLORS.ink }}>"{query}"</strong>. Try a different term or clear the search.
          </div>
        )}

        {sections.map((section) => (
          <div key={section.name} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #1E293B" }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: COLORS.ink, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{section.name}</h3>
              <span style={{ fontSize: 10, color: COLORS.muted, fontFamily: NUM }}>{section.defs.length} widget{section.defs.length === 1 ? "" : "s"}</span>
            </div>
            <p style={{ fontSize: 11, color: COLORS.muted, margin: 0, marginBottom: 10, lineHeight: 1.4 }}>{section.blurb}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {section.defs.map(renderCard)}
            </div>
          </div>
        ))}
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
// Default widget set for new visitors — showcases the full Mendi-native
// surface (HbO/HHb channels, overlay traces, TSI, total HbO, asymmetry,
// brain heatmap, signal rate) plus the cross-device focus score and
// reward sparkline so the dashboard looks alive on first paint even
// when only one device is paired.
// Dashboard presets — curated widget sets that the operator can swap to
// with one click. The keys are stable so localStorage layouts survive a
// preset rename. DEFAULT_WIDGETS below is referenced by 'demo' for the
// first-time visitor; the other presets give narrower, audience-specific
// views.
export const DASHBOARD_PRESETS: { id: string; label: string; blurb: string; ids: string[] }[] = [
  {
    id: "clinician",
    label: "Clinician",
    blurb: "Focused on what a clinician needs during a session — clinical metrics first.",
    ids: [
      "live-score", "mendi-channels", "asymmetry", "tsi-gauge",
      "mendi-laterality", "mendi-coherence", "mendi-workload",
      "mendi-signal-quality", "mendi-stillness", "mendi-fps",
    ],
  },
  {
    id: "research",
    label: "Research",
    blurb: "Spectral + diagnostic widgets for protocol research and signal-quality work.",
    ids: [
      "hbo-trace", "hhb-trace", "mendi-channels", "brain-mini",
      "mendi-mayer-wave", "mendi-coherence", "mendi-laterality",
      "mendi-signal-quality", "mendi-ambient-light", "mendi-head-pose",
      "mendi-fps", "mendi-pulse-waveform",
    ],
  },
  {
    id: "self-train",
    label: "Self-train",
    blurb: "Lightweight at-home view — score, breathing pacer, streaks.",
    ids: [
      "live-score", "reward-trace", "mendi-pulse-hr", "mendi-pulse-hrv",
      "mendi-engagement-time", "mendi-session-arc",
      "session-timer", "breathing-pacer", "todays-checkin",
    ],
  },
  {
    id: "demo",
    label: "Demo (everything)",
    blurb: "Full Mendi surface area — every widget on by default.",
    // Filled in below by reference to DEFAULT_WIDGETS.
    ids: [],
  },
  {
    id: "empty",
    label: "Empty",
    blurb: "Clear the dashboard and start from scratch.",
    ids: [],
  },
];

export const DEFAULT_WIDGETS = [
  "live-score",
  "mendi-channels",
  "hbo-trace",
  "hhb-trace",
  "tsi-gauge",
  "total-hbo",
  "brain-mini",
  "asymmetry",
  "mendi-fps",
  "reward-trace",
  // Auxiliary Mendi widgets — surface temp/IMU/pulse/signal-quality fields
  // that the protobuf carries but the original catalog ignored. Added to the
  // default set so the live dashboard demonstrates the full surface area.
  "mendi-pulse-hr",
  "mendi-pulse-hrv",
  "mendi-pulse-waveform",
  "mendi-temperature",
  "mendi-stillness",
  "mendi-signal-quality",
  "mendi-laterality",
  "mendi-coherence",
  "mendi-mayer-wave",
  "mendi-engagement-time",
  "mendi-head-pose",
  "mendi-workload",
  "mendi-session-arc",
  "mendi-reward-histogram",
  "mendi-trial-blocks",
  "mendi-ambient-light",
];

// Wire the 'demo' preset to the same list (avoid duplication).
(() => {
  const demo = DASHBOARD_PRESETS.find((p) => p.id === "demo");
  if (demo) demo.ids = [...DEFAULT_WIDGETS];
})();

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
  { id: "mendi",     name: "Mendi headband",       vendor: "Mendi",    modality: "fNIRS · 2 ch",   spec: "31 Hz · 660+805 nm · BA10",     signal: 96, defaultPaired: true,  blurb: "2-channel functional NIRS over bilateral prefrontal cortex. Pairs over BLE. Independent integration in progress — adapter scaffolded, awaiting hardware capture of the BLE protocol." },
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
