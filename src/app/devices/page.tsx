import type { Metadata } from "next";
import { Bluetooth, Wifi, Cpu, CheckCircle2, Clock, Zap, Brain, Activity, TrendingUp, TrendingDown, FlaskConical, ListChecks } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Supported Devices · EEGBase",
  description:
    "Hardware-agnostic neurofeedback. Native support for Mendi fNIRS, Muse EEG, Polar HRV, OpenBCI, Apple Health/Oura/Whoop. Adding a new device is a small TypeScript adapter.",
  alternates: { canonical: "/devices" },
  openGraph: {
    title: "Supported Devices · EEGBase",
    description: "One clinical layer for any neurofeedback hardware.",
    url: "/devices",
    type: "website",
  },
};

const devices = [
  {
    id: "mendi",
    name: "Mendi fNIRS",
    manufacturer: "Mendi AB",
    tagline: "Functional near-infrared spectroscopy headband",
    status: "integration_ready" as const,
    statusLabel: "Integration in progress",
    statusNote: "Independent BLE integration (Myndlift-style) — talks to the headband directly over Web Bluetooth, no Mendi app or cloud in the loop. Adapter scaffolded with packet decoder + Beer-Lambert + unit tests; only blocker is hardware-capture of the BLE GATT protocol from a physical Mendi (no public SDK exists). See AUDIT-2026-MENDI-BLE-PROTOCOL.md.",
    signals: ["OxyHb Left", "OxyHb Right", "DeoxyHb Left", "DeoxyHb Right", "Reward score"],
    connection: "Web Bluetooth (BLE GATT)",
    sampleRate: "~10 Hz",
    accentColor: "#7C3AED",
    iconBg: "#7C3AED",
    docs: "https://mendi.io",
    adapterPath: "src/lib/device/mendi.ts",
    showMendiBanner: false,
  },
  {
    id: "muse",
    name: "Muse 2 / Muse S",
    manufacturer: "InteraXon Inc.",
    tagline: "Consumer-grade EEG headband",
    status: "integrated" as const,
    statusLabel: "Integrated",
    statusNote: "Streams brainwaves and motion data over Bluetooth. The system computes the 5 standard frequency bands automatically.",
    signals: ["Delta", "Theta", "Alpha", "Beta", "Gamma", "Accelerometer"],
    connection: "Web Bluetooth via muse-js",
    sampleRate: "256 Hz EEG",
    accentColor: "#2563EB",
    iconBg: "#2563EB",
    docs: "https://github.com/urish/muse-js",
    adapterPath: "src/lib/device/muse.ts",
    showMendiBanner: false,
  },
  {
    id: "simulator",
    name: "Signal Simulator",
    manufacturer: "EEGBase built-in",
    tagline: "Realistic synthetic fNIRS + EEG for development and demo",
    status: "integrated" as const,
    statusLabel: "Ready",
    statusNote: "Random-walk signal generator that produces fNIRS OxyHb/DeoxyHb and full EEG band powers. Use this during demos when hardware isn't available.",
    signals: ["OxyHb Left", "OxyHb Right", "DeoxyHb Left", "DeoxyHb Right", "Delta", "Theta", "Alpha", "Beta", "Gamma", "Reward score"],
    connection: "Software (no hardware required)",
    sampleRate: "10 Hz",
    accentColor: "#64748B",
    iconBg: "#64748B",
    docs: null,
    adapterPath: "src/lib/device/simulator.ts",
    showMendiBanner: false,
  },
  {
    id: "muse-athena",
    name: "Muse S Athena",
    manufacturer: "InteraXon Inc.",
    tagline: "Combined EEG + fNIRS headband (2025)",
    status: "planned" as const,
    statusLabel: "Planned",
    statusNote: "Muse S Athena adds an fNIRS channel to the EEG headband. EEGBase already supports both signal types — adapter update planned once the BLE spec is published.",
    signals: ["Delta", "Theta", "Alpha", "Beta", "Gamma", "OxyHb (new)", "DeoxyHb (new)"],
    connection: "Web Bluetooth via muse-js (update pending)",
    sampleRate: "256 Hz EEG + ~10 Hz fNIRS",
    accentColor: "#0891B2",
    iconBg: "#0891B2",
    docs: "https://choosemuse.com",
    adapterPath: "src/lib/device/muse.ts (update pending)",
    showMendiBanner: false,
  },
];

function StatusBadge({ status, label }: { status: string; label: string }) {
  if (status === "integrated") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--success-subtle)", color: "var(--success)" }}>
        <CheckCircle2 size={11} />
        {label}
      </span>
    );
  }
  if (status === "integration_ready") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "color-mix(in srgb, #2563EB 12%, transparent)", color: "#2563EB" }}>
        <Zap size={11} />
        {label}
      </span>
    );
  }
  if (status === "pending_sdk") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--warning-subtle)", color: "var(--warning)" }}>
        <Clock size={11} />
        {label}
      </span>
    );
  }
  if (status === "planned") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "color-mix(in srgb, #64748B 12%, transparent)", color: "#64748B" }}>
        <Clock size={11} />
        {label}
      </span>
    );
  }
  return null;
}

function MendiBanner() {
  return (
    <div
      className="rounded-2xl p-6 mb-5"
      style={{
        border: "2px dashed color-mix(in srgb, #2563EB 40%, transparent)",
        background: "color-mix(in srgb, #2563EB 4%, var(--surface-raised))",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} style={{ color: "#2563EB" }} />
        <h3 className="text-sm font-bold" style={{ color: "#2563EB" }}>
          What we need from Mendi — one afternoon of engineering time
        </h3>
      </div>
      <div className="space-y-3 mb-4">
        {[
          { num: "1", label: "BLE Service UUID", placeholder: "e.g. 0000fe00-0000-1000-8000-00805f9b34fb" },
          { num: "2", label: "GATT Characteristic UUID", placeholder: "e.g. 0000fe01-0000-1000-8000-00805f9b34fb" },
        ].map(({ num, label, placeholder }) => (
          <div key={num} className="flex items-center gap-3">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "#2563EB", color: "white" }}
            >
              {num}
            </span>
            <span className="text-sm font-medium w-52 shrink-0" style={{ color: "var(--text-primary)" }}>{label}</span>
            <div
              className="flex-1 rounded-lg px-3 py-1.5 text-xs font-mono"
              style={{
                border: "1px dashed color-mix(in srgb, #2563EB 35%, transparent)",
                background: "var(--surface-sunken)",
                color: "var(--text-tertiary)",
              }}
            >
              {placeholder}
            </div>
          </div>
        ))}
        <div className="flex items-start gap-3">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
            style={{ background: "#2563EB", color: "white" }}
          >
            3
          </span>
          <div className="flex-1">
            <span className="text-sm font-medium block mb-1" style={{ color: "var(--text-primary)" }}>Byte layout</span>
            <div
              className="rounded-lg px-3 py-2 text-xs"
              style={{
                border: "1px dashed color-mix(in srgb, #2563EB 35%, transparent)",
                background: "var(--surface-sunken)",
                color: "var(--text-secondary)",
              }}
            >
              float32 LE assumed — confirm or correct{" "}
              <span className="font-mono" style={{ color: "#2563EB" }}>[oxyHbL, oxyHbR, deoxyHbL, deoxyHbR, reward]</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        Once confirmed, real hardware sessions replace the simulator automatically.
      </p>
    </div>
  );
}

export default function DevicesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)" }}>
          <Bluetooth size={20} style={{ color: "var(--brand)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Devices &amp; Integrations</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Supported hardware adapters and their connection status.</p>
        </div>
      </div>

      {/* Architecture banner */}
      <div className="rounded-2xl p-6 mb-8 mt-6 text-white" style={{ background: "linear-gradient(135deg, var(--brand) 0%, #4338CA 100%)" }}>
        <h2 className="text-base font-bold mb-1">Plug-and-play architecture</h2>
        <p className="text-sm mb-4 max-w-xl" style={{ color: "rgba(255,255,255,0.8)" }}>
          All devices share a common <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.15)" }}>DeviceAdapter</code> interface. Swap hardware without changing a line of clinical code.
        </p>
        <div className="flex items-center gap-3 text-sm flex-wrap" style={{ color: "rgba(255,255,255,0.8)" }}>
          {[
            { icon: Bluetooth, label: "BLE GATT" },
            { icon: Brain, label: "fNIRS signals" },
            { icon: Activity, label: "EEG bands" },
            { icon: Zap, label: "Real-time reward" },
            { icon: Cpu, label: "Software simulator" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.12)" }}>
              <Icon size={13} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Device cards */}
      <div className="grid grid-cols-1 gap-5 mb-8">
        {devices.map((d) => (
          <div key={d.id}>
            <div
              className="rounded-2xl overflow-hidden border"
              style={{
                background: `color-mix(in srgb, ${d.accentColor} 5%, var(--surface-raised))`,
                borderColor: `color-mix(in srgb, ${d.accentColor} 20%, var(--border-subtle))`,
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: d.iconBg }}>
                      <Bluetooth size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{d.name}</h3>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{d.manufacturer}</p>
                    </div>
                  </div>
                  <StatusBadge status={d.status} label={d.statusLabel} />
                </div>

                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{d.tagline}</p>

                {/* Status note */}
                <div className="rounded-xl p-3 mb-4 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.5)", color: "var(--text-secondary)" }}>
                  {d.statusNote}
                </div>

                {/* Signals + specs */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Signals</p>
                    <div className="flex flex-wrap gap-1.5">
                      {d.signals.map((s) => (
                        <span
                          key={s}
                          className="inline-block px-2 py-0.5 rounded-full text-xs"
                          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Specs</p>
                    <div className="space-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <div className="flex items-center gap-2">
                        <Wifi size={11} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
                        <span>{d.connection}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap size={11} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
                        <span>{d.sampleRate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cpu size={11} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
                        <code className="font-mono" style={{ color: "var(--text-tertiary)" }}>{d.adapterPath}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 flex items-center justify-between border-t" style={{ background: "rgba(255,255,255,0.25)", borderColor: "rgba(255,255,255,0.4)" }}>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/sessions/live?device=${d.id}`}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: d.accentColor }}
                  >
                    Start session with {d.name.split(" ")[0]} →
                  </Link>
                </div>
                {d.docs && (
                  <a href={d.docs} target="_blank" rel="noopener noreferrer" className="text-xs transition-colors" style={{ color: "var(--text-tertiary)" }}>
                    Device docs ↗
                  </a>
                )}
              </div>
            </div>

            {/* Mendi integration banner — shown below the Mendi card */}
            {d.showMendiBanner && <div className="mt-4"><MendiBanner /></div>}
          </div>
        ))}
      </div>

      {/* BLE architecture diagram */}
      <div className="rounded-2xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>BLE Data Flow</h2>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            { label: "Mendi / Muse device", color: "#7C3AED", bg: "color-mix(in srgb, #7C3AED 10%, transparent)", border: "color-mix(in srgb, #7C3AED 25%, transparent)" },
            { label: "→", arrow: true },
            { label: "WebBluetooth API", color: "var(--brand)", bg: "color-mix(in srgb, var(--brand) 10%, transparent)", border: "color-mix(in srgb, var(--brand) 25%, transparent)" },
            { label: "→", arrow: true },
            { label: "DeviceAdapter", color: "#4338CA", bg: "color-mix(in srgb, #4338CA 10%, transparent)", border: "color-mix(in srgb, #4338CA 25%, transparent)" },
            { label: "→", arrow: true },
            { label: "LiveSessionView", color: "var(--text-secondary)", bg: "var(--surface-sunken)", border: "var(--border-subtle)" },
            { label: "→", arrow: true },
            { label: "POST /api/v1/sessions/data", color: "var(--text-secondary)", bg: "var(--surface-sunken)", border: "var(--border-subtle)" },
            { label: "→", arrow: true },
            { label: "PostgreSQL", color: "var(--success)", bg: "var(--success-subtle)", border: "color-mix(in srgb, var(--success) 25%, transparent)" },
          ].map((item, i) =>
            (item as { arrow?: boolean }).arrow ? (
              <span key={i} className="font-medium" style={{ color: "var(--text-tertiary)" }}>→</span>
            ) : (
              <span key={i} className="px-2.5 py-1 rounded-lg border font-medium" style={{ color: item.color, background: item.bg, borderColor: item.border }}>
                {item.label}
              </span>
            )
          )}
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>
          Each sample from the device flows straight to the live view, then saves to your database every second. Clinicians see the data in real time; the full session is searchable later.
        </p>
      </div>

      {/* fNIRS neuroscience explainer */}
      <div className="rounded-2xl border p-6 mb-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={15} style={{ color: "#7C3AED" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>fNIRS Signal Reference</h2>
          <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>— what each channel means clinically</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* OxyHb */}
          <div className="rounded-xl p-4" style={{ background: "color-mix(in srgb, #EF4444 8%, transparent)", border: "1px solid color-mix(in srgb, #EF4444 18%, transparent)" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} style={{ color: "#EF4444" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#DC2626" }}>OxyHb — Oxyhemoglobin</span>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              Measures oxygenated blood in the prefrontal cortex. Rising OxyHb indicates increased neural activity and cerebral blood flow — the hallmark of engaged, focused cognition.
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#F87171" }} />
                <span style={{ color: "var(--text-secondary)" }}><strong>↑ Rising</strong> — prefrontal engagement, task focus</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--border-default)" }} />
                <span style={{ color: "var(--text-secondary)" }}><strong>↓ Falling</strong> — mental fatigue, distraction, over-arousal</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#FCD34D" }} />
                <span style={{ color: "var(--text-secondary)" }}><strong>Asymmetry L vs R</strong> — lateralisation, approach/avoidance</span>
              </div>
            </div>
          </div>

          {/* DeoxyHb */}
          <div className="rounded-xl p-4" style={{ background: "color-mix(in srgb, #4338CA 8%, transparent)", border: "1px solid color-mix(in srgb, #4338CA 18%, transparent)" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={14} style={{ color: "#4338CA" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3730A3" }}>DeoxyHb — Deoxyhemoglobin</span>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              Measures blood without oxygen. Usually drops when someone is thinking hard. Can rise if the brain is working too hard or inefficiently.
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#818CF8" }} />
                <span style={{ color: "var(--text-secondary)" }}><strong>↓ Falling</strong> — healthy haemodynamic response, activity onset</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--border-default)" }} />
                <span style={{ color: "var(--text-secondary)" }}><strong>↑ Rising</strong> — metabolic strain, sustained high effort</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#6EE7B7" }} />
                <span style={{ color: "var(--text-secondary)" }}><strong>OxyHb↑ + DeoxyHb↓</strong> — optimal neurovascular coupling</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reward score logic */}
        <div className="rounded-xl p-4" style={{ background: "var(--warning-subtle)", border: "1px solid color-mix(in srgb, var(--warning) 20%, transparent)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} style={{ color: "var(--warning)" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--warning)" }}>Reward Score (0–100)</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Mendi derives a single 0–100 score from the bilateral OxyHb channels. EEGBase stores this as{" "}
            <code className="px-1 rounded font-mono" style={{ background: "color-mix(in srgb, var(--warning) 15%, transparent)" }}>reward_score</code> per session, drives the
            in-session reward gauge, and feeds the AI progress summary. A score above 60 during a session indicates
            sustained prefrontal up-regulation — the target state for most attention and regulation protocols.
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: "#FCA5A5" }} />
              <span style={{ color: "var(--text-secondary)" }}>0–40 low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: "#FCD34D" }} />
              <span style={{ color: "var(--text-secondary)" }}>40–60 moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: "#6EE7B7" }} />
              <span style={{ color: "var(--text-secondary)" }}>60–80 good</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: "#059669" }} />
              <span style={{ color: "var(--text-secondary)" }}>80–100 excellent</span>
            </div>
          </div>
        </div>

        {/* Prefrontal diagram */}
        <div className="mt-4 rounded-xl p-4" style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>Measured region — prefrontal cortex (PFC)</p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {[
              { label: "Forehead sensor array", color: "#7C3AED", bg: "color-mix(in srgb, #7C3AED 10%, transparent)", border: "color-mix(in srgb, #7C3AED 25%, transparent)" },
              { label: "→", arrow: true },
              { label: "Near-infrared light (700–900 nm)", color: "#DC2626", bg: "color-mix(in srgb, #DC2626 10%, transparent)", border: "color-mix(in srgb, #DC2626 25%, transparent)" },
              { label: "→", arrow: true },
              { label: "Light bounces off brain tissue", color: "var(--text-secondary)", bg: "var(--surface-raised)", border: "var(--border-default)" },
              { label: "→", arrow: true },
              { label: "Light absorption math", color: "#4338CA", bg: "color-mix(in srgb, #4338CA 10%, transparent)", border: "color-mix(in srgb, #4338CA 25%, transparent)" },
              { label: "→", arrow: true },
              { label: "Brain blood flow values", color: "var(--success)", bg: "var(--success-subtle)", border: "color-mix(in srgb, var(--success) 25%, transparent)" },
            ].map((item, i) =>
              (item as { arrow?: boolean }).arrow ? (
                <span key={i} className="font-medium" style={{ color: "var(--text-tertiary)" }}>→</span>
              ) : (
                <span key={i} className="px-2.5 py-1 rounded-lg border font-medium" style={{ color: item.color, background: item.bg, borderColor: item.border }}>
                  {item.label}
                </span>
              )
            )}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
            Mendi sensors sit on both sides of the forehead — the brain region tied to focus and emotional control.
          </p>
        </div>
      </div>

      {/* Mendi integration roadmap */}
      <div className="rounded-2xl border p-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2 mb-4">
          <ListChecks size={15} style={{ color: "var(--brand)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Mendi Integration Roadmap</h2>
          <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>— status as of May 2026</span>
        </div>
        <div className="space-y-2">
          {[
            { done: true,  label: "MendiAdapter class — full BLE GATT lifecycle (connect / disconnect / re-connect)" },
            { done: true,  label: "DeviceSample interface — OxyHb L/R, DeoxyHb L/R, reward score, timestamp" },
            { done: true,  label: "Live session view — real-time signal charts + reward gauge" },
            { done: true,  label: "Session persistence — samples → PostgreSQL via POST /api/v1/sessions/data" },
            { done: true,  label: "Analytics page — per-session reward trend, bilateral OxyHb comparison" },
            { done: true,  label: "AI session summary — Claude interprets fNIRS trajectory in plain English" },
            { done: true,  label: "Signal simulator — realistic fNIRS random-walk for demos without hardware" },
            { done: true,  label: "Public share reports — include fNIRS session data in clinician-to-client PDF" },
            { done: true,  label: "Pure decoder split — MendiPacketDecoder + Beer-Lambert helper, unit-tested (11/11 passing)" },
            { done: false, label: "BLE protocol capture — Wireshark + Android HCI snoop log per AUDIT-2026-MENDI-BLE-PROTOCOL.md" },
            { done: false, label: "Plug captured UUIDs + packet layout into mendi.ts / mendi-decoder.ts (5-line change)" },
            { done: false, label: "Validation run — record 1 live session with real Mendi headband per validation-runbook.md" },
          ].map(({ done, label }, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
              <div
                className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: done ? "var(--success-subtle)" : "var(--surface-sunken)" }}
              >
                {done
                  ? <CheckCircle2 size={11} style={{ color: "var(--success)" }} />
                  : <Clock size={11} style={{ color: "var(--text-tertiary)" }} />}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: done ? "var(--text-secondary)" : "var(--text-tertiary)" }}>{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl p-3" style={{ background: "color-mix(in srgb, var(--brand) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--brand) 18%, transparent)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--brand)" }}>
            <strong>9 of 12 items complete.</strong> Mendi confirmed (May 2026) the supported model is an independent BLE integration — the same approach Myndlift took with Muse. The remaining work is hardware-capture of the BLE protocol from a physical Mendi (the founder owns one) using the runbook in <code style={{ background: "transparent" }}>AUDIT-2026-MENDI-BLE-PROTOCOL.md</code>. After capture, the only code changes are the two UUID constants and a packet-layout flip — everything else is production-ready and demo-able today via the simulator.
          </p>
        </div>
      </div>
    </div>
  );
}
