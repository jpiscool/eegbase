import Link from "next/link";
import { Brain, BarChart3, Wifi, ShieldCheck, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Real-time neurofeedback",
    description:
      "Stream fNIRS and EEG data live. Visual reward scoring updates every sample so clients see immediate feedback.",
  },
  {
    icon: BarChart3,
    title: "Session analytics",
    description:
      "OxyHb/DeoxyHb trends, EEG band power, and pre/post symptom tracking in one longitudinal dashboard.",
  },
  {
    icon: Wifi,
    title: "Mendi integration",
    description:
      "First-class support for Mendi's fNIRS headband — no middleware required. Plug in and start a session.",
  },
  {
    icon: Users,
    title: "Multi-client practice",
    description:
      "Manage unlimited clients, assign protocols, track progress, and message clients from a single workspace.",
  },
  {
    icon: ShieldCheck,
    title: "Self-hosted & private",
    description:
      "Run on your own infrastructure. Patient data never leaves your servers — HIPAA-friendly by design.",
  },
  {
    icon: Zap,
    title: "Protocol library",
    description:
      "Start from built-in evidence-based templates or build custom protocols with per-band threshold controls.",
  },
];

const metrics = [
  { value: "< 50ms", label: "Sample latency" },
  { value: "fNIRS + EEG", label: "Signal types" },
  { value: "Open source", label: "License" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">EEGBase</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Live Demo
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-medium text-blue-700 mb-6">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          Now with Mendi fNIRS support
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
          Neurofeedback practice
          <br />
          management that{" "}
          <span className="text-blue-600">actually streams</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          EEGBase is an open-source, self-hosted platform for licensed
          clinicians — bringing real-time fNIRS and EEG session streaming,
          longitudinal analytics, and client management under one roof.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/demo"
            className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Try live demo →
          </Link>
          <a
            href="https://github.com/trainbase/eegbase"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            View on GitHub
          </a>
        </div>

        {/* Metrics strip */}
        <div className="flex items-center justify-center gap-12 mt-16 pt-10 border-t border-gray-100">
          {metrics.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fake dashboard preview */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
            <div className="w-3 h-3 rounded-full bg-amber-400 opacity-70" />
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
            <div className="flex-1 mx-4 bg-gray-700 rounded px-3 py-1 text-xs text-gray-400">
              app.eegbase.io/sessions/live
            </div>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4">
            {[
              { label: "OxyHb Left", value: "+0.082 μM", color: "text-red-400" },
              { label: "OxyHb Right", value: "+0.071 μM", color: "text-orange-400" },
              { label: "Reward Score", value: "73.4", color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
            {/* Fake waveform bars */}
            <div className="col-span-3 bg-gray-700/30 rounded-xl p-4 h-28 flex items-end gap-1">
              {[42,55,38,60,72,58,45,63,70,54,48,66,75,62,50,68,80,65,52,74,60,47,64,78,56,43,69,77,59,46,71,82,67,53,76,84,61,49,72,58].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-500 rounded-sm opacity-70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Built for clinical workflows
        </h2>
        <p className="text-sm text-gray-400 text-center mb-12">
          Everything a neurofeedback practice needs — from first session to
          longitudinal outcome tracking.
        </p>
        <div className="grid grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
            >
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Icon size={18} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to run your first session?
          </h2>
          <p className="text-blue-100 text-sm mb-8">
            Try the live simulator demo — no account required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/demo"
              className="px-6 py-3 bg-white text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              Open live demo
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-blue-400 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Sign in to dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span>© 2025 EEGBase — open-source neurofeedback platform</span>
          <div className="flex items-center gap-6">
            <Link href="/demo" className="hover:text-gray-600 transition-colors">
              Demo
            </Link>
            <Link href="/login" className="hover:text-gray-600 transition-colors">
              Login
            </Link>
            <a
              href="https://github.com/trainbase/eegbase"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
