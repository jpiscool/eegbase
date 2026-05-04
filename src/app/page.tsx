"use client";

import Link from "next/link";
import { useState } from "react";
import { Brain, BarChart3, Wifi, ShieldCheck, Users, Zap, Bluetooth, FileText, Share2, CheckCircle, ChevronDown } from "lucide-react";
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

const faqs = [
  {
    q: "How is EEGBase different from SimplePractice or TherapyNotes?",
    a: "Those are general EHR platforms with no neurofeedback signal capture. EEGBase is purpose-built for real-time fNIRS and EEG streaming, bilateral OxyHb analysis, and device-native clinical workflows. The EHR features are included, but the signal is first-class.",
  },
  {
    q: "Do I need a server to run EEGBase?",
    a: "No. Deploy for free on Vercel + Neon (PostgreSQL) in under 10 minutes. Or self-host on any Linux server. Full Docker Compose setup included.",
  },
  {
    q: "Is patient data safe?",
    a: "Patient data never leaves your infrastructure. EEGBase is designed for self-hosting — no third-party cloud access by default. HIPAA-friendly architecture.",
  },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {faqs.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900">{item.q}</span>
            <ChevronDown
              size={16}
              className={`text-gray-400 shrink-0 ml-4 transition-transform ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4 bg-white text-sm text-gray-600 leading-relaxed border-t border-gray-100">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
            <a
              href="https://github.com/eegbase/eegbase"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Self-host for free →
            </a>
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
              Try Demo
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
            href="https://github.com/eegbase/eegbase"
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

      {/* What Mendi clinicians get — comparison section */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          What Mendi clinicians get
        </h2>
        <p className="text-sm text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          The Mendi app shows clients their progress. EEGBase gives clinicians clinical oversight.
        </p>
        <div className="grid grid-cols-2 gap-6">
          {/* Left — Mendi App */}
          <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gray-50">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-gray-300 rounded-lg flex items-center justify-center">
                <Bluetooth size={14} className="text-gray-600" />
              </div>
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">In the Mendi App</span>
              <span className="text-xs text-gray-400 font-normal">(client view)</span>
            </div>
            <ul className="space-y-3">
              {[
                "Mendi Score trend",
                "Session count",
                "Basic progress graph",
                "Reward score history",
                "Gamified feedback",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — EEGBase */}
          <div className="border-2 border-blue-200 rounded-2xl p-6 bg-blue-50/40">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">In EEGBase</span>
              <span className="text-xs text-blue-400 font-normal">(clinician view)</span>
            </div>
            <ul className="space-y-3">
              {[
                "All clients in one dashboard",
                "OxyHb/DeoxyHb bilateral analysis",
                "Pre/post questionnaire deltas (focus, mood, anxiety, energy)",
                "SOAP clinical notes + session annotations",
                "AI-generated clinical summary",
                "Shareable progress reports",
                "Billing, scheduling, outcome measures",
                "Export to EDF+ / CSV / PDF",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-blue-900">
                  <CheckCircle size={15} className="text-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
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

      {/* ROI Calculator */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Calculate your practice ROI
        </h2>
        <p className="text-sm text-gray-400 text-center mb-12">
          A typical neurofeedback practice — the numbers speak for themselves.
        </p>
        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8">
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              {
                label: "Save $5K/yr",
                sub: "in admin labor",
                detail: "~2 hrs/week saved on notes, reports & billing",
                color: "text-emerald-600",
                bg: "bg-emerald-50 border-emerald-100",
              },
              {
                label: "No subscription",
                sub: "ever",
                detail: "Competitors charge $150–500/month ($1,800–6,000/yr)",
                color: "text-blue-600",
                bg: "bg-blue-50 border-blue-100",
              },
              {
                label: "Full data ownership",
                sub: "guaranteed",
                detail: "Self-hosted — your data stays on your infrastructure",
                color: "text-violet-600",
                bg: "bg-violet-50 border-violet-100",
              },
            ].map(({ label, sub, detail, color, bg }) => (
              <div key={label} className={`border rounded-2xl p-5 ${bg}`}>
                <p className={`text-2xl font-extrabold ${color} mb-0.5`}>{label}</p>
                <p className={`text-xs font-semibold ${color} opacity-70 mb-3`}>{sub}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">How the math works</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">Practice revenue</p>
                <p className="text-gray-500 text-xs">15 clients × 2 sessions/week × $150/session</p>
                <p className="font-bold text-emerald-600">= $90K/year</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">Admin time saved</p>
                <p className="text-gray-500 text-xs">~2 hrs/week × $50/hr equivalent labor</p>
                <p className="font-bold text-emerald-600">= $5,200/year</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">vs. Competitors</p>
                <p className="text-gray-500 text-xs">SimplePractice / TherapyNotes at $150–500/month</p>
                <p className="font-bold text-blue-600">EEGBase: $0/month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Why not SimplePractice?
        </h2>
        <p className="text-sm text-gray-400 text-center mb-10">
          Common questions from clinicians evaluating EEGBase.
        </p>
        <FaqAccordion />
      </section>

      {/* CTA band */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to run your first session?
          </h2>
          <p className="text-blue-100 text-sm mb-8">
            The demo clinic is pre-loaded with 10 clients and 88 Mendi fNIRS sessions.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap mb-6">
            <Link
              href="/demo"
              className="px-6 py-3 bg-white text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              Open live simulator →
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-blue-400 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              ▶ Enter Demo Clinic
            </Link>
          </div>
          <p className="text-blue-200 text-xs">
            Demo login: <span className="font-mono bg-blue-700 px-2 py-0.5 rounded">demo@eegbase.io</span>{" "}
            / <span className="font-mono bg-blue-700 px-2 py-0.5 rounded">demo2026</span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <div>
            <span>© 2026 EEGBase — open-source neurofeedback platform</span>
            <p className="mt-1 text-gray-400">
              MIT licensed — fork it, self-host it, contribute to it. No lock-in.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/demo" className="hover:text-gray-600 transition-colors">
              Demo
            </Link>
            <Link href="/login" className="hover:text-gray-600 transition-colors">
              Login
            </Link>
            <a
              href="https://github.com/eegbase/eegbase"
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
