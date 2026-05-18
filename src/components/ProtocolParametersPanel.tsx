"use client";
import { useState, useTransition } from "react";
import { Settings2, Save, RotateCcw, Plus, X, ArrowUp, ArrowDown, ListOrdered } from "lucide-react";
import { updateProtocolParameters } from "@/app/protocols/actions";
import { parseProtocolBlocks, type ProtocolBlock, type ProtocolBlockKind } from "@/components/ProtocolBlockTimer";

// ── Block-authoring helpers ───────────────────────────────────────────────────
const BLOCK_KIND_OPTIONS: { value: ProtocolBlockKind; label: string }[] = [
  { value: "baseline", label: "Baseline" },
  { value: "focus",    label: "Focus" },
  { value: "rest",     label: "Rest" },
  { value: "calm",     label: "Calm" },
  { value: "task",     label: "Task" },
];
const DEFAULT_BLOCK: ProtocolBlock = { kind: "focus", label: "Focus training", durationSeconds: 300 };
function fmtMmSs(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Type definitions ──────────────────────────────────────────────────────────

interface MendiParams {
  rewardThreshold: number;   // μM oxyHb delta required for reward (default 0.05)
  smoothingWindow: number;   // samples to average (default 5, ≈500 ms at 10 Hz)
  baselineSeconds: number;   // resting-state baseline before training begins (default 60)
  feedbackMode: "visual" | "audio" | "both";
}

interface MuseParams {
  targetBand: "alpha" | "theta" | "smr" | "beta" | "gamma";
  inhibitBand: "delta" | "theta" | "alpha" | "beta" | "gamma" | "";
  rewardThreshold: number;   // relative amplitude multiplier (default 1.0)
  smoothingWindow: number;   // samples (default 8)
  feedbackMode: "visual" | "audio" | "both";
}

interface SimulatorParams {
  noiseLevel: number;        // 0–1 (default 0.3)
  trendStrength: number;     // 0–1, how quickly the signal improves (default 0.5)
}

type AnyParams = MendiParams | MuseParams | SimulatorParams;

// ── Defaults ──────────────────────────────────────────────────────────────────

const MENDI_DEFAULTS: MendiParams = {
  rewardThreshold: 0.05,
  smoothingWindow: 5,
  baselineSeconds: 60,
  feedbackMode: "visual",
};

const MUSE_DEFAULTS: MuseParams = {
  targetBand: "alpha",
  inhibitBand: "",
  rewardThreshold: 1.0,
  smoothingWindow: 8,
  feedbackMode: "visual",
};

const SIM_DEFAULTS: SimulatorParams = {
  noiseLevel: 0.3,
  trendStrength: 0.5,
};

function mergeDefaults<T extends object>(saved: unknown, defaults: T): T {
  if (!saved || typeof saved !== "object") return defaults;
  return { ...defaults, ...(saved as Partial<T>) };
}

// ── Helper components ─────────────────────────────────────────────────────────

const controlStyle: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  background: "var(--surface-sunken)",
  color: "var(--text-primary)",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{hint}</p>}
    </div>
  );
}

function NumInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step ?? 1}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={controlStyle}
    />
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={controlStyle}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Presets ───────────────────────────────────────────────────────────────────

const MENDI_PRESETS: Array<{ label: string; desc: string; params: MendiParams }> = [
  {
    label: "Attention Training",
    desc: "Standard prefrontal upregulation for focus and cognitive performance",
    params: { rewardThreshold: 0.05, smoothingWindow: 8, baselineSeconds: 60, feedbackMode: "visual" },
  },
  {
    label: "Relaxation",
    desc: "Gentle threshold with extended baseline — for stress reduction and calm states",
    params: { rewardThreshold: 0.02, smoothingWindow: 15, baselineSeconds: 90, feedbackMode: "both" },
  },
  {
    label: "ADHD Protocol",
    desc: "Responsive threshold, shorter baseline — optimised for sustained-attention training",
    params: { rewardThreshold: 0.06, smoothingWindow: 5, baselineSeconds: 45, feedbackMode: "both" },
  },
  {
    label: "Anxiety Reduction",
    desc: "Low threshold with long baseline for anxious clients needing gentle feedback",
    params: { rewardThreshold: 0.03, smoothingWindow: 12, baselineSeconds: 120, feedbackMode: "visual" },
  },
];

const MUSE_PRESETS: Array<{ label: string; desc: string; params: MuseParams }> = [
  {
    label: "Alpha Relaxation",
    desc: "Upregulate calm-alertness alpha while inhibiting active-thinking beta",
    params: { targetBand: "alpha", inhibitBand: "beta", rewardThreshold: 1.1, smoothingWindow: 10, feedbackMode: "visual" },
  },
  {
    label: "Focus / SMR",
    desc: "Sensorimotor rhythm training for focus and motor inhibition",
    params: { targetBand: "smr", inhibitBand: "theta", rewardThreshold: 1.2, smoothingWindow: 8, feedbackMode: "visual" },
  },
  {
    label: "Theta Meditation",
    desc: "Deep relaxation and creativity — theta upregulation without inhibition",
    params: { targetBand: "theta", inhibitBand: "", rewardThreshold: 1.1, smoothingWindow: 15, feedbackMode: "both" },
  },
  {
    label: "Peak Performance",
    desc: "High-beta training for sustained cognitive output",
    params: { targetBand: "beta", inhibitBand: "delta", rewardThreshold: 1.2, smoothingWindow: 6, feedbackMode: "audio" },
  },
];

function PresetChips<T extends object>({
  presets,
  current,
  onApply,
}: {
  presets: Array<{ label: string; desc: string; params: T }>;
  current: T;
  onApply: (p: T) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Quick Presets</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const isActive = JSON.stringify(current) === JSON.stringify(p.params);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onApply(p.params)}
              onMouseEnter={() => setHovered(p.label)}
              onMouseLeave={() => setHovered(null)}
              className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all"
              style={isActive
                ? { background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }
                : { background: "var(--surface-raised)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {hovered && (
        <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
          {presets.find((p) => p.label === hovered)?.desc}
        </p>
      )}
    </div>
  );
}

// ── Device-specific forms ────────────────────────────────────────────────────

function MendiForm({
  params,
  onChange,
}: {
  params: MendiParams;
  onChange: (p: MendiParams) => void;
}) {
  const set = <K extends keyof MendiParams>(key: K, val: MendiParams[K]) =>
    onChange({ ...params, [key]: val });

  return (
    <div>
      <PresetChips presets={MENDI_PRESETS} current={params} onApply={onChange} />
      <div className="grid grid-cols-2 gap-4">
      <Field
        label="Reward Threshold (μM)"
        hint="Minimum oxyHb increase required to trigger a reward signal."
      >
        <NumInput
          value={params.rewardThreshold}
          min={0}
          max={5}
          step={0.01}
          onChange={(v) => set("rewardThreshold", v)}
        />
      </Field>

      <Field
        label="Smoothing Window (samples)"
        hint="Number of samples to average before computing reward. 10 samples ≈ 1 s."
      >
        <NumInput
          value={params.smoothingWindow}
          min={1}
          max={50}
          onChange={(v) => set("smoothingWindow", v)}
        />
      </Field>

      <Field
        label="Baseline Period (seconds)"
        hint="Resting-state recording before training feedback begins."
      >
        <NumInput
          value={params.baselineSeconds}
          min={0}
          max={300}
          onChange={(v) => set("baselineSeconds", v)}
        />
      </Field>

      <Field label="Feedback Mode">
        <Select
          value={params.feedbackMode}
          options={[
            { value: "visual", label: "Visual only" },
            { value: "audio", label: "Audio only" },
            { value: "both", label: "Visual + Audio" },
          ]}
          onChange={(v) => set("feedbackMode", v as MendiParams["feedbackMode"])}
        />
      </Field>
      </div>
    </div>
  );
}

function MuseForm({
  params,
  onChange,
}: {
  params: MuseParams;
  onChange: (p: MuseParams) => void;
}) {
  const set = <K extends keyof MuseParams>(key: K, val: MuseParams[K]) =>
    onChange({ ...params, [key]: val });

  const bandOptions = [
    { value: "delta", label: "Delta (0.5–4 Hz)" },
    { value: "theta", label: "Theta (4–8 Hz)" },
    { value: "alpha", label: "Alpha (8–12 Hz)" },
    { value: "smr", label: "SMR (12–15 Hz)" },
    { value: "beta", label: "Beta (15–30 Hz)" },
    { value: "gamma", label: "Gamma (30–44 Hz)" },
  ];

  return (
    <div>
      <PresetChips presets={MUSE_PRESETS} current={params} onApply={onChange} />
      <div className="grid grid-cols-2 gap-4">
      <Field label="Target Band (upregulate)" hint="Increase this frequency band amplitude.">
        <Select
          value={params.targetBand}
          options={bandOptions.filter((b) => b.value !== "delta")}
          onChange={(v) => set("targetBand", v as MuseParams["targetBand"])}
        />
      </Field>

      <Field label="Inhibit Band (downregulate)" hint="Penalise this frequency band. Leave blank to disable.">
        <Select
          value={params.inhibitBand}
          options={[{ value: "", label: "None" }, ...bandOptions]}
          onChange={(v) => set("inhibitBand", v as MuseParams["inhibitBand"])}
        />
      </Field>

      <Field
        label="Reward Threshold (×)"
        hint="Amplitude multiplier relative to baseline. 1.0 = match baseline."
      >
        <NumInput
          value={params.rewardThreshold}
          min={0.1}
          max={5}
          step={0.1}
          onChange={(v) => set("rewardThreshold", v)}
        />
      </Field>

      <Field label="Smoothing Window (samples)">
        <NumInput
          value={params.smoothingWindow}
          min={1}
          max={100}
          onChange={(v) => set("smoothingWindow", v)}
        />
      </Field>

      <Field label="Feedback Mode">
        <Select
          value={params.feedbackMode}
          options={[
            { value: "visual", label: "Visual only" },
            { value: "audio", label: "Audio only" },
            { value: "both", label: "Visual + Audio" },
          ]}
          onChange={(v) => set("feedbackMode", v as MuseParams["feedbackMode"])}
        />
      </Field>
      </div>
    </div>
  );
}

function SimulatorForm({
  params,
  onChange,
}: {
  params: SimulatorParams;
  onChange: (p: SimulatorParams) => void;
}) {
  const set = <K extends keyof SimulatorParams>(key: K, val: SimulatorParams[K]) =>
    onChange({ ...params, [key]: val });

  return (
    <div className="grid grid-cols-2 gap-4">
      <Field
        label="Noise Level (0–1)"
        hint="Higher = more signal noise. 0 = perfectly smooth, 1 = very noisy."
      >
        <NumInput
          value={params.noiseLevel}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => set("noiseLevel", Math.min(1, Math.max(0, v)))}
        />
      </Field>

      <Field
        label="Trend Strength (0–1)"
        hint="How quickly the simulator signal drifts upward over the session."
      >
        <NumInput
          value={params.trendStrength}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => set("trendStrength", Math.min(1, Math.max(0, v)))}
        />
      </Field>
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

interface Props {
  protocolId: string;
  deviceType: string;
  savedParams: unknown;
}

export function ProtocolParametersPanel({ protocolId, deviceType, savedParams }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scripted block sequence (baseline → focus → rest …). Stored alongside
  // device-specific params in the same jsonb column.
  const [blocks, setBlocks] = useState<ProtocolBlock[]>(() => parseProtocolBlocks(savedParams));
  const updateBlock = (i: number, patch: Partial<ProtocolBlock>) =>
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const moveBlock = (i: number, dir: -1 | 1) =>
    setBlocks((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const removeBlock = (i: number) =>
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
  const totalBlockSeconds = blocks.reduce((a, b) => a + b.durationSeconds, 0);

  const [mendiParams, setMendiParams] = useState<MendiParams>(() =>
    mergeDefaults(savedParams, MENDI_DEFAULTS)
  );
  const [museParams, setMuseParams] = useState<MuseParams>(() =>
    mergeDefaults(savedParams, MUSE_DEFAULTS)
  );
  const [simParams, setSimParams] = useState<SimulatorParams>(() =>
    mergeDefaults(savedParams, SIM_DEFAULTS)
  );

  function getCurrentParams(): AnyParams {
    if (deviceType === "mendi") return mendiParams;
    if (deviceType === "muse") return museParams;
    return simParams;
  }

  function handleReset() {
    if (deviceType === "mendi") setMendiParams(MENDI_DEFAULTS);
    else if (deviceType === "muse") setMuseParams(MUSE_DEFAULTS);
    else setSimParams(SIM_DEFAULTS);
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        // Merge device-specific params with the block sequence so the
        // protocol's parameters jsonb carries both. Empty blocks array
        // is allowed — the runtime simply hides the timer.
        const payload: Record<string, unknown> = {
          ...(getCurrentParams() as unknown as Record<string, unknown>),
          blocks,
        };
        await updateProtocolParameters(protocolId, payload);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <Settings2 size={15} style={{ color: "var(--text-tertiary)" }} />
        <h2 className="text-sm font-semibold flex-1" style={{ color: "var(--text-secondary)" }}>Training Parameters</h2>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {deviceType === "mendi"
            ? "Mendi fNIRS"
            : deviceType === "muse"
            ? "Muse EEG"
            : "Simulator"}
        </span>
      </div>

      <div className="p-6">
        {/* ── Scripted block sequence editor ─────────────────────────────
            Authors the protocol.parameters.blocks array consumed by the
            ProtocolBlockTimer during a live session. Each row = one
            timed block (baseline / focus / rest / calm / task) with a
            human-readable label + duration. Total auto-sums below. */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ListOrdered size={14} style={{ color: "var(--text-tertiary)" }} />
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Block Sequence
            </h3>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              ({blocks.length} block{blocks.length === 1 ? "" : "s"}{blocks.length > 0 ? ` · ${fmtMmSs(totalBlockSeconds)} total` : ""})
            </span>
            <button
              type="button"
              onClick={() => setBlocks((prev) => [...prev, { ...DEFAULT_BLOCK }])}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
              style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <Plus size={12} /> Add block
            </button>
          </div>
          {blocks.length === 0 ? (
            <p className="text-xs italic" style={{ color: "var(--text-tertiary)" }}>
              No blocks — the live session will run as a single open-ended training period.
              Add blocks to script baseline / focus / rest pacing.
            </p>
          ) : (
            <div className="space-y-2">
              {blocks.map((b, i) => (
                <div
                  key={i}
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: "auto 120px 1fr 110px auto", padding: "8px 10px", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: 8 }}
                >
                  <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)", minWidth: 22 }}>
                    {i + 1}.
                  </span>
                  <Select
                    value={b.kind}
                    options={BLOCK_KIND_OPTIONS}
                    onChange={(v) => updateBlock(i, { kind: v as ProtocolBlockKind })}
                  />
                  <input
                    type="text"
                    value={b.label}
                    placeholder="Block label (e.g. Focus training)"
                    onChange={(e) => updateBlock(i, { label: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={controlStyle}
                  />
                  <div className="flex items-center gap-1">
                    <NumInput
                      value={b.durationSeconds}
                      min={5}
                      max={3600}
                      onChange={(v) => updateBlock(i, { durationSeconds: Math.max(5, v) })}
                    />
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>s</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0}
                      className="p-1 rounded transition-colors disabled:opacity-30" style={{ color: "var(--text-tertiary)" }}>
                      <ArrowUp size={13} />
                    </button>
                    <button type="button" onClick={() => moveBlock(i, +1)} disabled={i === blocks.length - 1}
                      className="p-1 rounded transition-colors disabled:opacity-30" style={{ color: "var(--text-tertiary)" }}>
                      <ArrowDown size={13} />
                    </button>
                    <button type="button" onClick={() => removeBlock(i)}
                      className="p-1 rounded transition-colors ml-1" style={{ color: "var(--danger)" }}>
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {deviceType === "mendi" && (
          <MendiForm params={mendiParams} onChange={setMendiParams} />
        )}
        {deviceType === "muse" && (
          <MuseForm params={museParams} onChange={setMuseParams} />
        )}
        {deviceType === "simulator" && (
          <SimulatorForm params={simParams} onChange={setSimParams} />
        )}

        <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ background: "var(--brand)", color: "#fff" }}
          >
            <Save size={14} />
            {isPending ? "Saving…" : saved ? "Saved ✓" : "Save Parameters"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <RotateCcw size={13} />
            Reset to defaults
          </button>

          {error && <span className="text-xs" style={{ color: "var(--danger)" }}>{error}</span>}
        </div>
      </div>
    </div>
  );
}
