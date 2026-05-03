import Link from "next/link";
import { Brain, BarChart3, Wifi, ShieldCheck, Users, Zap, Bluetooth, FileText, Share2, CheckCircle } from "lucide-react";
import { LandingLivePreview } from "@/components/LandingLivePreview";

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

      {/* Live animated preview */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <LandingLivePreview />
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

      {/* Clinical workflow steps */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          The complete clinical workflow
        </h2>
        <p className="text-sm text-gray-400 text-center mb-12">
          From pairing a device to sharing results — all in one platform.
        </p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { step: 1, icon: Bluetooth, title: "Pair device", desc: "Connect Mendi fNIRS or Muse EEG headband via WebBluetooth — no drivers, no middleware.", color: "bg-purple-100 text-purple-700" },
            { step: 2, icon: Brain, title: "Stream session", desc: "Real-time reward score, OxyHb trends, and EEG bands update every 100ms with live audio feedback.", color: "bg-blue-100 text-blue-700" },
            { step: 3, icon: FileText, title: "Review & annotate", desc: "AI-powered clinical summary, session replay, pre/post questionnaire deltas, and clinician notes.", color: "bg-indigo-100 text-indigo-700" },
            { step: 4, icon: Share2, title: "Share progress", desc: "One-click shareable report link for clients and families. No account required to view.", color: "bg-emerald-100 text-emerald-700" },
          ].map(({ step, icon: Icon, title, desc, color }) => (
            <div key={step} className="relative">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Step {step}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
              {step < 4 && (
                <div className="hidden lg:block absolute top-8 -right-3 z-10 text-gray-200 text-lg">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Mendi spotlight */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-8 text-white">
          <div className="grid grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-violet-100 mb-4">
                <Bluetooth size={11} />
                First-class device integration
              </div>
              <h2 className="text-2xl font-bold mb-3 leading-tight">
                Built specifically<br />for Mendi fNIRS
              </h2>
              <p className="text-violet-100 text-sm leading-relaxed mb-5">
                EEGBase is the first open-source platform with a dedicated Mendi adapter. Stream OxyHb and DeoxyHb data directly to a full clinical dashboard — reward scoring, session history, longitudinal analytics, and shareable reports.
              </p>
              <div className="space-y-2">
                {[
                  "Web Bluetooth — no app install required",
                  "Real-time reward scoring from fNIRS signals",
                  "Automatic session recording to PostgreSQL",
                  "AI clinical insight via Claude Haiku",
                ].map((point) => (
                  <div key={point} className="flex items-center gap-2 text-sm text-violet-100">
                    <CheckCircle size={13} className="text-violet-300 shrink-0" />
                    {point}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 text-sm">
              <p className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-3">Signals from Mendi</p>
              <div className="space-y-3">
                {[
                  { label: "OxyHb Left", val: "Prefrontal cortex, left hemisphere" },
                  { label: "OxyHb Right", val: "Prefrontal cortex, right hemisphere" },
                  { label: "DeoxyHb Left", val: "Inverse oxygenation signal" },
                  { label: "DeoxyHb Right", val: "Inverse oxygenation signal" },
                  { label: "Reward score", val: "0–100 composite engagement metric" },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-white/10 pb-2">
                    <span className="font-semibold text-white text-xs">{label}</span>
                    <span className="text-violet-200 text-xs text-right">{val}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/demo"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-purple-700 text-sm font-bold rounded-xl hover:bg-violet-50 transition-colors"
              >
                Try with simulator →
              </Link>
            </div>
          </div>
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
          <span>© 2026 EEGBase — open-source neurofeedback platform</span>
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
