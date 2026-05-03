import { Bluetooth, Wifi, Cpu, CheckCircle2, Clock, Zap, Brain, Activity, TrendingUp, TrendingDown, FlaskConical, ListChecks } from "lucide-react";
import Link from "next/link";

const devices = [
  {
    id: "mendi",
    name: "Mendi fNIRS",
    manufacturer: "Mendi AB",
    tagline: "Functional near-infrared spectroscopy headband",
    status: "pending_sdk" as const,
    statusLabel: "SDK access pending",
    statusNote: "BLE service UUIDs will be finalized in the May 11 call with Mendi. The adapter is fully built — just needs the real UUIDs.",
    signals: ["OxyHb Left", "OxyHb Right", "DeoxyHb Left", "DeoxyHb Right", "Reward score"],
    connection: "Web Bluetooth (BLE GATT)",
    sampleRate: "~10 Hz",
    color: "purple",
    gradient: "from-purple-50 to-violet-50",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-700",
    iconBg: "bg-purple-600",
    docs: "https://mendi.io",
    adapterPath: "src/lib/device/mendi.ts",
  },
  {
    id: "muse",
    name: "Muse 2 / Muse S",
    manufacturer: "InteraXon Inc.",
    tagline: "Consumer-grade EEG headband",
    status: "integrated" as const,
    statusLabel: "Integrated",
    statusNote: "Uses the muse-js library (Web Bluetooth). Streams 4-channel EEG, computed band powers (delta, theta, alpha, beta, gamma), and accelerometer.",
    signals: ["Delta", "Theta", "Alpha", "Beta", "Gamma", "Accelerometer"],
    connection: "Web Bluetooth via muse-js",
    sampleRate: "256 Hz EEG",
    color: "blue",
    gradient: "from-blue-50 to-sky-50",
    border: "border-blue-200",
    badgeBg: "bg-emerald-100 text-emerald-700",
    iconBg: "bg-blue-600",
    docs: "https://github.com/urish/muse-js",
    adapterPath: "src/lib/device/muse.ts",
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
    color: "slate",
    gradient: "from-slate-50 to-gray-50",
    border: "border-slate-200",
    badgeBg: "bg-emerald-100 text-emerald-700",
    iconBg: "bg-slate-600",
    docs: null,
    adapterPath: "src/lib/device/simulator.ts",
  },
];

function StatusBadge({ status, label }: { status: string; label: string }) {
  if (status === "integrated") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={11} />
        {label}
      </span>
    );
  }
  if (status === "pending_sdk") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        <Clock size={11} />
        {label}
      </span>
    );
  }
  return null;
}

export default function DevicesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-blue-50">
          <Bluetooth size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices & Integrations</h1>
          <p className="text-sm text-gray-500">Supported hardware adapters and their connection status.</p>
        </div>
      </div>

      {/* Architecture banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-8 mt-6 text-white">
        <h2 className="text-base font-bold mb-1">Plug-and-play architecture</h2>
        <p className="text-sm text-blue-100 mb-4 max-w-xl">
          All devices share a common <code className="bg-blue-500/40 px-1 rounded">DeviceAdapter</code> interface. Swap hardware without changing a line of clinical code.
        </p>
        <div className="flex items-center gap-3 text-sm text-blue-100 flex-wrap">
          {[
            { icon: Bluetooth, label: "BLE GATT" },
            { icon: Brain, label: "fNIRS signals" },
            { icon: Activity, label: "EEG bands" },
            { icon: Zap, label: "Real-time reward" },
            { icon: Cpu, label: "Software simulator" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
              <Icon size={13} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Device cards */}
      <div className="grid grid-cols-1 gap-5 mb-8">
        {devices.map((d) => (
          <div key={d.id} className={`bg-gradient-to-br ${d.gradient} border ${d.border} rounded-2xl overflow-hidden`}>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${d.iconBg} flex items-center justify-center`}>
                    <Bluetooth size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{d.name}</h3>
                    <p className="text-xs text-gray-500">{d.manufacturer}</p>
                  </div>
                </div>
                <StatusBadge status={d.status} label={d.statusLabel} />
              </div>

              <p className="text-sm text-gray-600 mb-4">{d.tagline}</p>

              {/* Status note */}
              <div className="bg-white/60 rounded-xl p-3 mb-4 text-xs text-gray-600 leading-relaxed">
                {d.statusNote}
              </div>

              {/* Signals + specs */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Signals</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.signals.map((s) => (
                      <span key={s} className="inline-block px-2 py-0.5 bg-white/70 border border-white/80 rounded-full text-xs text-gray-600">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Specs</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Wifi size={11} className="text-gray-400 shrink-0" />
                      <span>{d.connection}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap size={11} className="text-gray-400 shrink-0" />
                      <span>{d.sampleRate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu size={11} className="text-gray-400 shrink-0" />
                      <code className="font-mono text-gray-500">{d.adapterPath}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/50 px-6 py-3 flex items-center justify-between bg-white/30">
              <div className="flex items-center gap-3">
                <Link
                  href={`/sessions/live?device=${d.id}`}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  Start session with {d.name.split(" ")[0]} →
                </Link>
              </div>
              {d.docs && (
                <a href={d.docs} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  Device docs ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* BLE architecture diagram */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">BLE Data Flow</h2>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            { label: "Mendi / Muse device", bg: "bg-purple-100 text-purple-800 border-purple-200" },
            { label: "→", bg: "" },
            { label: "WebBluetooth API", bg: "bg-blue-100 text-blue-800 border-blue-200" },
            { label: "→", bg: "" },
            { label: "DeviceAdapter", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" },
            { label: "→", bg: "" },
            { label: "LiveSessionView", bg: "bg-slate-100 text-slate-800 border-slate-200" },
            { label: "→", bg: "" },
            { label: "POST /api/v1/sessions/data", bg: "bg-gray-100 text-gray-800 border-gray-200" },
            { label: "→", bg: "" },
            { label: "PostgreSQL", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
          ].map((item, i) =>
            item.bg ? (
              <span key={i} className={`px-2.5 py-1 rounded-lg border font-medium ${item.bg}`}>
                {item.label}
              </span>
            ) : (
              <span key={i} className="text-gray-400 font-medium">{item.label}</span>
            )
          )}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Each 100ms sample flows from the device through the adapter, into the live view, and is batch-uploaded to the server every second. Data points are associated with the session for later analysis.
        </p>
      </div>

      {/* fNIRS neuroscience explainer */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={15} className="text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-700">fNIRS Signal Reference</h2>
          <span className="text-xs text-gray-400 ml-1">— what each channel means clinically</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* OxyHb */}
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-rose-600" />
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">OxyHb — Oxyhemoglobin</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Measures oxygenated blood in the prefrontal cortex. Rising OxyHb indicates increased neural activity and cerebral blood flow — the hallmark of engaged, focused cognition.
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span className="text-gray-600"><strong>↑ Rising</strong> — prefrontal engagement, task focus</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                <span className="text-gray-600"><strong>↓ Falling</strong> — mental fatigue, distraction, over-arousal</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0" />
                <span className="text-gray-600"><strong>Asymmetry L vs R</strong> — lateralisation, approach/avoidance</span>
              </div>
            </div>
          </div>

          {/* DeoxyHb */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={14} className="text-indigo-600" />
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">DeoxyHb — Deoxyhemoglobin</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Measures deoxygenated blood. DeoxyHb typically decreases during cognitive activation (the haemodynamic response) but can rise during intense sustained effort or poor neural efficiency.
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-gray-600"><strong>↓ Falling</strong> — healthy haemodynamic response, activity onset</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                <span className="text-gray-600"><strong>↑ Rising</strong> — metabolic strain, sustained high effort</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 shrink-0" />
                <span className="text-gray-600"><strong>OxyHb↑ + DeoxyHb↓</strong> — optimal neurovascular coupling</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reward score logic */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Reward Score (0–100)</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Mendi derives a single 0–100 score from the bilateral OxyHb channels. EEGBase stores this as{" "}
            <code className="bg-amber-100 px-1 rounded font-mono">reward_score</code> per session, drives the
            in-session reward gauge, and feeds the AI progress summary. A score above 60 during a session indicates
            sustained prefrontal up-regulation — the target state for most attention and regulation protocols.
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-200" />
              <span className="text-gray-500">0–40 low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-300" />
              <span className="text-gray-500">40–60 moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-gray-500">60–80 good</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-gray-500">80–100 excellent</span>
            </div>
          </div>
        </div>

        {/* Prefrontal diagram */}
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Measured region — prefrontal cortex (PFC)</p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {[
              { label: "Forehead sensor array", bg: "bg-purple-100 text-purple-800 border-purple-200" },
              { label: "→", bg: "" },
              { label: "Near-infrared light (700–900 nm)", bg: "bg-rose-100 text-rose-800 border-rose-200" },
              { label: "→", bg: "" },
              { label: "Cortical tissue scatter", bg: "bg-gray-200 text-gray-700 border-gray-300" },
              { label: "→", bg: "" },
              { label: "Modified Beer-Lambert Law", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" },
              { label: "→", bg: "" },
              { label: "OxyHb / DeoxyHb (μM)", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
            ].map((item, i) =>
              item.bg ? (
                <span key={i} className={`px-2.5 py-1 rounded-lg border font-medium ${item.bg}`}>
                  {item.label}
                </span>
              ) : (
                <span key={i} className="text-gray-400 font-medium">{item.label}</span>
              )
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Mendi places optodes bilaterally over the dorsolateral and ventromedial PFC — key regions for working memory, emotional regulation, and inhibitory control.
          </p>
        </div>
      </div>

      {/* Mendi integration roadmap */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks size={15} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-700">Mendi Integration Roadmap</h2>
          <span className="text-xs text-gray-400 ml-1">— status as of May 2026</span>
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
            { done: false, label: "Real BLE UUIDs — replace placeholder UUIDs from Mendi SDK (post May 11 call)" },
            { done: false, label: "Binary packet format — confirm float32 layout or adjust _parse() from SDK docs" },
            { done: false, label: "Validation run — record 1 live session with real Mendi headband" },
          ].map(({ done, label }, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-100" : "bg-gray-100"}`}>
                {done
                  ? <CheckCircle2 size={11} className="text-emerald-600" />
                  : <Clock size={11} className="text-gray-400" />}
              </div>
              <p className={`text-xs leading-relaxed ${done ? "text-gray-600" : "text-gray-400"}`}>{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>8 of 11 items complete.</strong> The only blockers are the SDK UUIDs and binary packet confirmation —
            both resolved in the May 11 call with Mustafa. Everything else is production-ready and demo-able today using the simulator.
          </p>
        </div>
      </div>
    </div>
  );
}
