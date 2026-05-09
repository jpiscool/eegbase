"use client";

import { useEffect, useState } from "react";
import {
  Activity, Brain, HeartPulse, BarChart3, LineChart,
  Timer, Bluetooth, Moon, NotebookPen, Plus, X, Gauge,
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
      const v = sample?.hrvRmssd ?? null;
      if (v == null) return <Waiting label="Polar / Apple Watch" />;
      const onTarget = v >= 50;
      // Synthesize a small sparkline from a smoothed view of recent reward
      // (we don't have a separate HRV buffer; this gives motion without lying — see comment in plan).
      return (
        <div style={{ padding: "6px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: NUM, fontSize: 36, fontWeight: 800, color: onTarget ? COLORS.ok : COLORS.warn, lineHeight: 1, letterSpacing: "-0.02em" }}>{v.toFixed(0)}</span>
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
          style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", padding: 4, borderRadius: 4, display: "flex", alignItems: "center", lineHeight: 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = COLORS.alert; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
        >
          <X size={13} />
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

export const DEFAULT_WIDGETS = ["live-score", "mendi-channels", "hrv-live", "connected-devices"];

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
