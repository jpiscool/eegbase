"use client";
import { useState, useTransition } from "react";
import { Settings2, Save, RotateCcw } from "lucide-react";
import { updateProtocolParameters } from "@/app/protocols/actions";

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
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
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
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Presets</p>
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
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {hovered && (
        <p className="text-xs text-gray-400 mt-2">
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
        await updateProtocolParameters(protocolId, getCurrentParams() as unknown as Record<string, unknown>);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <Settings2 size={15} className="text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-700 flex-1">Training Parameters</h2>
        <span className="text-xs text-gray-400">
          {deviceType === "mendi"
            ? "Mendi fNIRS"
            : deviceType === "muse"
            ? "Muse EEG"
            : "Simulator"}
        </span>
      </div>

      <div className="p-6">
        {deviceType === "mendi" && (
          <MendiForm params={mendiParams} onChange={setMendiParams} />
        )}
        {deviceType === "muse" && (
          <MuseForm params={museParams} onChange={setMuseParams} />
        )}
        {deviceType === "simulator" && (
          <SimulatorForm params={simParams} onChange={setSimParams} />
        )}

        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {isPending ? "Saving…" : saved ? "Saved ✓" : "Save Parameters"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-gray-500 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RotateCcw size={13} />
            Reset to defaults
          </button>

          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}
