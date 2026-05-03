import { Bluetooth, Wifi, Cpu, CheckCircle2, Clock, Zap, Brain, Activity } from "lucide-react";
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
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
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
    </div>
  );
}
