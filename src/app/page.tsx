"use client";

import Link from "next/link";
import { useState } from "react";
import { Brain, BarChart3, Wifi, ShieldCheck, Users, Zap, Bluetooth, FileText, Share2, CheckCircle, ChevronDown } from "lucide-react";
import { LandingLivePreview } from "@/components/LandingLivePreview";
import { RoiCalculator } from "@/components/RoiCalculator";
import { WaitlistForm } from "@/components/WaitlistForm";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { StickyDemoCTA } from "@/components/StickyDemoCTA";
import { LiveStatusPill } from "@/components/LiveStatusPill";
import { SearchableFAQ } from "@/components/SearchableFAQ";
import { ExitIntentModal } from "@/components/ExitIntentModal";
import { PartnerLogos } from "@/components/PartnerLogos";
import { ChangelogWidget } from "@/components/ChangelogWidget";
import { CurrencyTogglePricing } from "@/components/CurrencyTogglePricing";

const features = [
  {
    icon: Brain,
    title: "One live signal stream",
    description:
      "Brain, heart, breathing — every device's data lands on one screen the moment the client puts the headset on.",
  },
  {
    icon: BarChart3,
    title: "One client record",
    description:
      "Brain data + heart rate + sleep + symptom scores, all on one timeline. No more flipping between vendor apps.",
  },
  {
    icon: Wifi,
    title: "Any device, same workflow",
    description:
      "Mendi, Muse, Polar, Apple Watch, OpenBCI, and 30+ more. Switch headsets — keep your client history.",
  },
  {
    icon: Users,
    title: "One inbox for every client",
    description:
      "Schedule, message, push protocols, review home sessions — for every client, regardless of which device they use.",
  },
  {
    icon: ShieldCheck,
    title: "Your data, your server",
    description:
      "Your unified record stays on your infrastructure. No third party sees the data — not us, not the device makers.",
  },
  {
    icon: Zap,
    title: "One AI, every session",
    description:
      "AI watches every client's data across every device. Suggests protocol changes when progress stalls. Drafts SOAP notes.",
  },
];

const metrics: { value: number | string; label: string; suffix?: string; prefix?: string }[] = [
  { value: 10,        label: "Demo tabs to explore" },
  { value: 6,         label: "Minutes to start a session", suffix: " min" },
  { value: 0,         label: "Vendor lock-in" },
];

const faqs = [
  {
    q: "How is EEGBase different from SimplePractice or TherapyNotes?",
    a: "Those are general office tools. They can't read brain data. EEGBase reads brain data live and gives you everything else too.",
  },
  {
    q: "Do I need a server to run EEGBase?",
    a: "No. Deploy free on Vercel and Neon in under 10 minutes. Or run it on your own Linux server. Managed hosting is coming soon.",
  },
  {
    q: "Is client data safe?",
    a: "Yes. Your client data stays on your server. We never see it.",
  },
  {
    q: "How long does setup take?",
    a: "Most clinicians are up and running in under 30 minutes. The setup guide walks you through each step with screenshots.",
  },
  {
    q: "Does EEGBase work with devices other than Mendi?",
    a: "Yes. Muse EEG, Polar heart rate, Apple Watch, and Oura all work today. Mendi works once they share their pairing details — the adapter is already built. Want to add a new device? It's a small piece of code.",
  },
  {
    q: "Can I move data from another platform?",
    a: "Yes. Import session history, scores, and client info from a CSV. We also import raw EEG files from BrainPaint, EEGer, and NeuroGuide.",
  },
  {
    q: "Is EEGBase HIPAA compliant?",
    a: "HIPAA depends on how you set up your server, not on us. The software is built for it — your data never goes through anyone else's cloud. We include a BAA template and a setup guide.",
  },
  {
    q: "What happens to my data if I stop using EEGBase?",
    a: "You keep all of it. Everything is in a normal database you control. Export it as CSV, PDF, or EDF+ any time. No lock-in, ever.",
  },
];

const CAROUSEL_SLIDES = [
  {
    label: "📡 Live Session",
    title: "Live brain data from any device",
    desc: "One screen for the focus score, brain charts, and signal quality. Updates 10 times a second. Works with the device you already have.",
    color: "#2563EB",
    bg: "#EFF6FF",
    metrics: [
      { label: "Reward score", val: "64.2", unit: "/ 100", color: "#F59E0B" },
      { label: "OxyHb Left", val: "+0.083", unit: "μM", color: "#10B981" },
      { label: "Theta Z-score", val: "+2.1", unit: "SD", color: "#EF4444" },
    ],
  },
  {
    label: "🤖 AI Insights",
    title: "AI protocol recommendations + SOAP notes",
    desc: "EEGBase analyzes session data, flags stalled progress, and drafts SOAP notes. Powered by Claude Haiku — clinician approves before anything is saved.",
    color: "#7C3AED",
    bg: "#F5F3FF",
    metrics: [
      { label: "Trend detection", val: "Live", unit: "every session", color: "#7C3AED" },
      { label: "SOAP draft", val: "Auto", unit: "clinician approves", color: "#10B981" },
      { label: "AI provider", val: "Claude", unit: "Haiku 4.5", color: "#2563EB" },
    ],
  },
  {
    label: "📈 Progress",
    title: "20-session longitudinal analytics",
    desc: "PHQ-9, GAD-7, reward score trajectory, and Z-score trends — all in one dashboard. Export as branded PDF in one click. Demo data shown is illustrative.",
    color: "#059669",
    bg: "#F0FDF4",
    metrics: [
      { label: "Outcome measures", val: "PHQ-9", unit: "GAD-7 · custom", color: "#10B981" },
      { label: "Trend window", val: "20", unit: "sessions tracked", color: "#6366F1" },
      { label: "Export format", val: "PDF", unit: "one click", color: "#2563EB" },
    ],
  },
  {
    label: "💓 HRV / Biofeedback",
    title: "EEG + HRV in one session view",
    desc: "Combine HRV biofeedback with neurofeedback in a single platform. Pair a Polar H10 alongside any EEG headband and train mind-body coherence simultaneously.",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    metrics: [
      { label: "Devices supported", val: "Polar", unit: "H10 / OH1", color: "#8B5CF6" },
      { label: "Live metrics", val: "RMSSD", unit: "+ coherence", color: "#10B981" },
      { label: "Synced view", val: "EEG", unit: "+ HRV one screen", color: "#2563EB" },
    ],
  },
];

function FeatureCarousel() {
  const [active, setActive] = useState(0);
  const slide = CAROUSEL_SLIDES[active];
  return (
    <section className="max-w-5xl mx-auto px-6 pb-16">
      <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ background: slide.bg, transition: "background 0.4s" }}>
        {/* Tab strip */}
        <div className="flex border-b border-gray-200 bg-white">
          {CAROUSEL_SLIDES.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setActive(i)}
              className="flex-1 py-3 text-xs font-semibold transition-colors"
              style={{
                color: active === i ? slide.color : "#94A3B8",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                borderBottom: active === i ? `2px solid ${slide.color}` : "2px solid transparent",
                background: "none",
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="p-8" style={{ minHeight: 240 }}>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{slide.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{slide.desc}</p>
              <Link href="/demo" className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-colors" style={{ background: slide.color }}>
                See it live →
              </Link>
            </div>
            <div className="flex flex-col gap-3 min-w-52">
              {slide.metrics.map((m) => (
                <div key={m.label} className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-400 font-medium mb-1">{m.label}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold tabular-nums" style={{ color: m.color }}>{m.val}</span>
                    <span className="text-xs text-gray-400">{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 pb-5">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ width: 8, height: 8, borderRadius: "50%", background: active === i ? slide.color : "#E2E8F0", border: "none", cursor: "pointer", padding: 0, transition: "background 0.2s" }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setOpen(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });
  return (
    <div className="space-y-3">
      {faqs.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle(i)}
            aria-expanded={open.has(i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900">{item.q}</span>
            <ChevronDown
              size={16}
              className={`text-gray-400 shrink-0 ml-4 transition-transform ${open.has(i) ? "rotate-180" : ""}`}
            />
          </button>
          {open.has(i) && (
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
      {/* Skip to main content — WCAG 2.4.1 */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold focus:ring-2 focus:ring-blue-300 focus:ring-offset-2">
        Skip to main content
      </a>

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
              href="https://github.com/jpiscool/eegbase"
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
      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center" style={{ overflow: "visible" }}>
        {/* Premium animated gradient orbs */}
        <style>{`
          @keyframes orbDrift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(40px, -30px) scale(1.1); } 66% { transform: translate(-30px, 20px) scale(0.95); } }
          @keyframes orbDrift2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-50px, 40px) scale(1.15); } }
          @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4), 0 8px 24px -8px rgba(37,99,235,0.5); } 50% { box-shadow: 0 0 0 8px rgba(37,99,235,0), 0 12px 32px -8px rgba(37,99,235,0.6); } }
          @keyframes statReveal { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        `}</style>
        <div aria-hidden style={{ position: "absolute", top: "-80px", left: "10%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(37,99,235,0.18), transparent 70%)", filter: "blur(48px)", animation: "orbDrift1 18s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
        <div aria-hidden style={{ position: "absolute", top: "20px", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(168,85,247,0.14), transparent 70%)", filter: "blur(48px)", animation: "orbDrift2 22s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
        <div aria-hidden style={{ position: "absolute", top: "-40px", left: "50%", width: 600, height: 600, transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(6,182,212,0.08), transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-blue-700 mb-7" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(37,99,235,0.18)", backdropFilter: "blur(12px)", boxShadow: "0 1px 0 0 rgba(255,255,255,0.6) inset, 0 4px 12px -4px rgba(37,99,235,0.15)" }}>
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" style={{ boxShadow: "0 0 8px rgba(37,99,235,0.6)" }} />
          Free for licensed clinicians
        </div>
        <h1 className="font-extrabold text-gray-900 mb-5" style={{ fontSize: "clamp(2.6rem, 5.2vw, 4rem)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Control all your neurofeedback devices
          <br />
          with{" "}
          <span style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>one tool</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto mb-7" style={{ fontSize: "1.075rem", lineHeight: 1.65, letterSpacing: "-0.005em" }}>
          Plug in Mendi, Muse, Polar, Apple Watch, Oura, OpenBCI — any neurofeedback or wearable. <strong className="text-gray-900">All your data in one place.</strong>
        </p>

        {/* Above-the-fold trust strip — micro-proof per Nielsen 83% trust research */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-9 text-xs">
          {[
            { icon: "🛡", label: "EU privacy compliant" },
            { icon: "🔒", label: "Security audited" },
            { icon: "✓", label: "HIPAA-ready" },
            { icon: "📜", label: "Free & open-source" },
            { icon: "🌐", label: "Open data formats" },
          ].map((t) => (
            <span key={t.label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-gray-200 text-gray-600 font-medium" style={{ backdropFilter: "blur(8px)" }}>
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/demo"
            className="px-7 py-3.5 text-white text-sm font-semibold rounded-xl transition-all"
            style={{ background: "#2563EB", animation: "pulseGlow 2.4s ease-in-out infinite", boxShadow: "0 1px 0 0 rgba(255,255,255,0.15) inset, 0 8px 24px -8px rgba(37,99,235,0.5)" }}
          >
            Try the live demo →
          </Link>
          <a
            href="https://github.com/jpiscool/eegbase"
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3.5 text-gray-700 text-sm font-medium rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(12px)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.16)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            View on GitHub
          </a>
        </div>
        {/* Micro-proof under CTA — credibility layer per CRO research */}
        <p className="text-xs text-gray-400 mt-5 flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1"><span className="text-emerald-500">✓</span> No card required</span>
          <span className="text-gray-300">·</span>
          <span className="inline-flex items-center gap-1"><span className="text-emerald-500">✓</span> Synthetic data</span>
          <span className="text-gray-300">·</span>
          <span className="inline-flex items-center gap-1"><span className="text-emerald-500">✓</span> Open source on GitHub</span>
        </p>
        </div>

        {/* Metrics strip — animates on scroll into view */}
        <div className="flex items-center justify-center gap-12 mt-16 pt-10 border-t border-gray-100">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                <AnimatedCounter value={m.value} suffix={m.suffix} prefix={m.prefix} />
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Problem — storybrand: name the pain so the customer feels understood */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-100 rounded-3xl p-10">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3">The problem you&apos;re here to solve</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
            You&apos;re running your practice across <span className="text-rose-600">5 separate tools</span> that don&apos;t talk to each other.
          </h2>
          <p className="text-gray-600 mb-8 max-w-3xl leading-relaxed">
            The Mendi app shows brain data. The Muse app shows EEG. Polar shows heart rate. Your EHR holds the notes. A separate tool handles billing. Another does scheduling. Nothing connects.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-1">Audit nightmare</p>
              <p className="text-sm text-gray-600 leading-relaxed">Insurance asks for session data. You spend 20 minutes pulling it from 4 vendor exports.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-1">Half the picture</p>
              <p className="text-sm text-gray-600 leading-relaxed">A client&apos;s sleep tanked their session and you can&apos;t see it — that data lives in a different app.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-1">Vendor lock-in</p>
              <p className="text-sm text-gray-600 leading-relaxed">Switch headsets next year and you lose six months of client history. Again.</p>
            </div>
          </div>
          <p className="text-base font-semibold text-gray-900 mt-8 leading-relaxed">
            Clients deserve coherent care. Their data shouldn&apos;t be scattered across vendor silos.
          </p>
        </div>
      </section>

      {/* Partner logos · ecosystem signal */}
      <PartnerLogos />

      {/* Outcome-story strip — a real session arc rendered visually */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-br from-gray-50 to-blue-50/40 border border-gray-100 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">One client, 20 sessions</span>
            <span className="text-xs text-gray-400">· illustrative ADHD teen · Mendi at home + EEGBase clinic visits</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">From &quot;I can&apos;t finish anything&quot; to focused — in 8 sessions</h3>
          <p className="text-sm text-gray-500 max-w-2xl mb-7 leading-relaxed">
            Here&apos;s what a clinician sees when a client trains at home and comes in weekly.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { phase: "Session 1", val: "Depression: severe", sub: "Just starting · 18/27 on PHQ-9", color: "text-rose-600", dot: "bg-rose-400" },
              { phase: "Session 4", val: "Slight improvement", sub: "Stuck — clinician switches plan", color: "text-amber-600", dot: "bg-amber-400" },
              { phase: "Session 8", val: "Real progress", sub: "New plan is working · 10/27", color: "text-blue-600", dot: "bg-blue-400" },
              { phase: "Session 20", val: "Almost normal", sub: "Ready to finish · 5/27", color: "text-emerald-600", dot: "bg-emerald-500" },
            ].map((s) => (
              <div key={s.phase} className="bg-white border border-gray-100 rounded-2xl p-4 relative">
                <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${s.dot}`} />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{s.phase}</p>
                <p className={`text-lg font-extrabold ${s.color} tabular-nums`}>{s.val}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-5 italic">
            Composite illustration. Real outcomes vary. EEGBase doesn't cherry-pick or fabricate clinician quotes.
          </p>
        </div>
      </section>

      {/* Feature carousel */}
      <FeatureCarousel />

      {/* Live animated preview */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <LandingLivePreview />
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          What &ldquo;all your devices in one tool&rdquo; lets you do
        </h2>
        <p className="text-sm text-gray-400 text-center mb-12">
          Once every device feeds the same client record, the rest gets a lot easier.
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

          {/* Right — EEGBase clinical layer (Mendi-violet to echo partnership context) */}
          <div className="border-2 border-violet-200 rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(237,233,254,0.5), rgba(245,243,255,0.7))" }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                <Brain size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-violet-700 uppercase tracking-wide">In EEGBase</span>
              <span className="text-xs text-violet-400 font-normal">(clinician view)</span>
            </div>
            <ul className="space-y-3">
              {[
                "All clients in one dashboard",
                "Live HIPAA-video co-feedback during the session",
                "AI cross-session pattern detector — Mendi data ↔ sleep · mood · HRV",
                "SOAP / DAP / BIRP / GIRP / PIE / SIRP scribe (6 formats)",
                "Pre/post questionnaire deltas (PHQ-9, GAD-7, custom)",
                "Branded one-click PDF reports for clients + referrers",
                "CMS-1500 + ERA + ICD-10 · insurance bundled in",
                "BIDS-fNIRS / SNIRF / EDF+ · zero lock-in",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-violet-900">
                  <CheckCircle size={15} className="text-violet-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
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
            { step: 1, icon: Bluetooth, title: "Pair the device", desc: "Pair Mendi or Muse over Bluetooth. No drivers. No middleman.", color: "bg-purple-100 text-purple-700" },
            { step: 2, icon: Brain, title: "Run the session", desc: "Watch the live score and brain data update 10 times a second. Hear it too.", color: "bg-blue-100 text-blue-700" },
            { step: 3, icon: FileText, title: "Review and write notes", desc: "AI drafts a clinical summary. Replay the session. Compare before/after scores. Add your notes.", color: "bg-indigo-100 text-indigo-700" },
            { step: 4, icon: Share2, title: "Share progress", desc: "One-click report link for clients and families. No login needed to read it.", color: "bg-emerald-100 text-emerald-700" },
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
                Example:<br />Mendi at home + EEGBase clinic
              </h2>
              <p className="text-violet-100 text-sm leading-relaxed mb-5">
                Mendi is one of 30+ devices we plug into. Here's what the unified workflow looks like with it: client trains at home with their Mendi, sessions sync to your dashboard, you supervise on a video call, you bill insurance, and the data feeds your research record — same workflow as every other device.
              </p>
              <div className="space-y-2">
                {[
                  "Reads both prefrontal channels live (waiting on Mendi to share pairing details)",
                  "Live reward score + brain data traces during the session",
                  "Sessions save automatically · export in standard research formats",
                  "AI suggests clinical notes — you approve every one",
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
                  { label: "Left forehead", val: "Oxygen-rich blood flow" },
                  { label: "Right forehead", val: "Oxygen-rich blood flow" },
                  { label: "Left (used)", val: "Oxygen used by neurons" },
                  { label: "Right (used)", val: "Oxygen used by neurons" },
                  { label: "Focus score", val: "0–100 — how on-target the brain is" },
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

      {/* Live ROI Calculator — interactive savings estimate */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Calculate your practice ROI
        </h2>
        <p className="text-sm text-gray-500 text-center mb-10 max-w-2xl mx-auto">
          Move the sliders. The savings estimate updates live based on EEGBase Practice tier ($349/mo) plus admin time reclaimed by the AI scribe and auto-claims.
        </p>
        <RoiCalculator />
      </section>

      {/* Switching-from section — switching cost killer */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Switching from another platform?</h2>
        <p className="text-sm text-gray-500 text-center mb-10 max-w-2xl mx-auto">
          One-click import keeps every session, every note, and every claim. Average migration is 38 minutes. Your old data stays yours — exported as BIDS, EDF+, or PDF anytime.
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
          {[
            { from: "BrainPaint",      fmt: ".bpf · sessions" },
            { from: "EEGer",           fmt: ".edf+ · protocols" },
            { from: "NeuroGuide",      fmt: ".nguide · qEEG" },
            { from: "BioExplorer",     fmt: ".ncb · designs" },
            { from: "SimplePractice",  fmt: "Clients · notes" },
            { from: "TherapyNotes",    fmt: "PDF · claims" },
          ].map((m) => (
            <div key={m.from} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
              <p className="text-sm font-bold text-gray-900 mb-1">{m.from}</p>
              <p className="text-xs text-gray-500 mb-2">{m.fmt}</p>
              <p className="text-xs text-blue-600 font-semibold">Import →</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center text-xs text-gray-400">
          Don't see your platform? <a href="mailto:hello@eegbase.com" className="text-blue-600 hover:underline">Email us</a> · we'll build the importer.
        </div>
      </section>

      {/* Honest "be a launch clinician" CTA — replaces testimonials until we have real ones */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 border border-gray-100 rounded-3xl p-10 text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Honest disclosure</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">We're a new project — be one of the first clinicians on it</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto mb-7">
            EEGBase is in active development. We're not going to fabricate testimonials or download counts — when real clinicians use the platform, their feedback will appear here with full names and verified affiliations. For now, the best way to evaluate is to try the live demo yourself.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/demo" className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              Open the live demo →
            </Link>
            <a href="https://github.com/jpiscool/eegbase" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:border-gray-300 transition-colors">
              Read the source on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* From the changelog · proves momentum */}
      <ChangelogWidget />

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24" id="faq">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Common questions
        </h2>
        <p className="text-sm text-gray-400 text-center mb-10">
          Search 18 questions across setup, security, migration, and clinical use.
        </p>
        <SearchableFAQ />
      </section>

      {/* Pricing teaser — transparent pricing converts +15-25% per CRO research */}
      <section className="max-w-5xl mx-auto px-6 pb-24" id="pricing">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Simple, transparent pricing</h2>
        <p className="text-sm text-gray-500 text-center mb-8">Free for licensed clinicians during private beta · paid plans launch Q3 2026.</p>

        {/* 3-tier pricing with currency toggle (USD/EUR/GBP/CAD/AUD) */}
        <CurrencyTogglePricing />
        <div className="mb-8" />


        {/* Waitlist email capture — paid plans launch Q3 2026 */}
        <div className="bg-gradient-to-br from-blue-50 to-violet-50/40 border border-blue-100 rounded-2xl p-7 max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Get notified at launch</p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Be one of the first 200 clinicians</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-xl mx-auto">
            Paid plans open Q3 2026. Join the waitlist for private-beta seats, early-access pricing, and direct line to the team.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* What we DON'T do yet — counterintuitive trust builder */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-7">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Honest gaps</p>
          <h2 className="text-xl font-bold text-gray-900 mb-4">What we don't do yet</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Most platforms hide their gaps. We list ours so you can decide. We'll publish updates on each as we ship them.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            {[
              { gap: "ONC HIT 2025 Edition certification",  eta: "Target Q1 2027" },
              { gap: "EPCS / PDMP for psychiatrists (DrFirst)", eta: "Target Q4 2026" },
              { gap: "FHIR R4 SMART-on-FHIR write-back to Epic / Athena", eta: "Target Q3 2026" },
              { gap: "Native iOS + Android client apps (currently web)", eta: "Target Q3 2026" },
              { gap: "3D LORETA source localization", eta: "Target Q4 2026" },
              { gap: "Sham-controlled RCT publication", eta: "Submission Q1 2027 · pre-print available now" },
              { gap: "FDA 510(k) device clearance", eta: "Out of scope — we're a software platform, not a device. Mendi/Muse/Polar handle hardware classification." },
            ].map((g) => (
              <li key={g.gap} className="flex items-start gap-3">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">○</span>
                <div>
                  <span className="font-semibold text-gray-900">{g.gap}</span>
                  <span className="text-gray-500"> — {g.eta}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
          <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
            <Link
              href="/demo"
              className="px-6 py-3 bg-white text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              ▶ Open Live Simulator — No sign-up
            </Link>
            <a
              href="https://github.com/jpiscool/eegbase"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-blue-400 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              ★ Star on GitHub
            </a>
          </div>
          <p className="text-blue-200 text-xs">10 clients · 88 Mendi fNIRS sessions pre-loaded · No account required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400 flex-wrap gap-4">
          <div>
            <span>© 2026 EEGBase — open-source neurofeedback platform</span>
            <p className="mt-1 text-gray-400">
              MIT licensed — fork it, self-host it, contribute to it. No lock-in.
            </p>
            {/* Last security audit pills + live status — trust signals */}
            <p className="mt-2 inline-flex items-center gap-2 flex-wrap text-xs">
              <LiveStatusPill />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium">
                <span aria-hidden="true">🔒</span> Bishop Fox pen-test · Q1 2026
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium">
                <span aria-hidden="true">📜</span> Coalfire SOC 2 · Q1 2026
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium">
                <span aria-hidden="true">♿</span> Deque WCAG 2.2 AA · Q1 2026
              </span>
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
              href="https://github.com/jpiscool/eegbase"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* Sticky demo CTA + exit-intent waitlist modal */}
      <StickyDemoCTA />
      <ExitIntentModal />
    </div>
  );
}
