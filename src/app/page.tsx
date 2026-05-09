"use client";

import Link from "next/link";
import { Brain, ShieldCheck, Zap, Bluetooth, FileText, MousePointerClick, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { StickyDemoCTA } from "@/components/StickyDemoCTA";
import { LiveStatusPill } from "@/components/LiveStatusPill";
import { SearchableFAQ } from "@/components/SearchableFAQ";
import { PartnerLogos } from "@/components/PartnerLogos";

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

      {/* ════════════════════════════════════════════════════════════════
          1. HERO  ·  StoryBrand: Character + What they want
          UNCHANGED per user direction
          ════════════════════════════════════════════════════════════════ */}
      <section id="main-content" className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center" style={{ overflow: "visible" }}>
        <style>{`
          @keyframes orbDrift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(40px, -30px) scale(1.1); } 66% { transform: translate(-30px, 20px) scale(0.95); } }
          @keyframes orbDrift2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-50px, 40px) scale(1.15); } }
          @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4), 0 8px 24px -8px rgba(37,99,235,0.5); } 50% { box-shadow: 0 0 0 8px rgba(37,99,235,0), 0 12px 32px -8px rgba(37,99,235,0.6); } }
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

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/demo"
              className="px-7 py-3.5 text-white text-sm font-semibold rounded-xl transition-all"
              style={{ background: "#2563EB", animation: "pulseGlow 2.4s ease-in-out infinite", boxShadow: "0 1px 0 0 rgba(255,255,255,0.15) inset, 0 8px 24px -8px rgba(37,99,235,0.5)" }}
            >
              Try the live demo →
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3.5 text-gray-700 text-sm font-medium rounded-xl transition-all"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(12px)" }}
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          2. VALUE STACK  ·  StoryBrand: 3 quick wins, success the customer wants
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap,      title: "Set up in 6 minutes",   desc: "Open the app. Pair the headset. Start the session. No installer, no IT ticket, no Windows-only quirks." },
            { icon: MousePointerClick, title: "Run a session in one click", desc: "Click Pair. Click Start. Watch the score move. The whole platform fits on one screen." },
            { icon: FileText, title: "Notes write themselves", desc: "AI drafts the session note in your format. You read, fix, save. 60 seconds, not 15 minutes." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-2xl p-7 hover:border-blue-200 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          3. STAKES  ·  StoryBrand: what the customer loses if they don't act
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-10">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-rose-600" />
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">What it costs you to keep using the old tools</p>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
            Every week you wait, you lose <span className="text-rose-600">hours of your life</span> to bad software.
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { num: "1 week", label: "Onboarding a new clinician — most platforms ship a 200-page PDF and a paid certification." },
              { num: "5 apps",  label: "Open every session. Brain data here, notes there, billing somewhere else. Nothing connects." },
              { num: "15 min",  label: "Writing each session note by hand. That's an hour a day you don't see clients." },
            ].map((s) => (
              <div key={s.num} className="bg-white rounded-xl p-5 border border-rose-100">
                <p className="text-2xl font-extrabold text-rose-600 tracking-tight mb-2">{s.num}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-base font-semibold text-gray-900 mt-7 leading-relaxed">
            The science already works. The software shouldn&rsquo;t be the part that burns you out.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          4. VALUE PROPOSITION  ·  StoryBrand: how it works, in concrete terms
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">One screen. One client record. One AI that does the boring stuff.</h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            EEGBase plugs into the headsets, watches, and rings you already use. Every session feeds the same client record. The AI watches everything and writes your notes for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-7">
            <Bluetooth size={20} className="text-blue-600 mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-2">Plug in any device</h3>
            <p className="text-sm text-gray-700 leading-relaxed">Mendi, Muse, Polar, Apple Watch, Oura, OpenBCI, Whoop. One button to pair. Switch headsets next year — you keep every client&rsquo;s history.</p>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-2xl p-7">
            <Brain size={20} className="text-violet-600 mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-2">See the whole session live</h3>
            <p className="text-sm text-gray-700 leading-relaxed">Brain data, heart rate, video call, score, notes — all on one screen. Talk to the client; the rest just works.</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-7">
            <Sparkles size={20} className="text-emerald-600 mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-2">Let the AI write the note</h3>
            <p className="text-sm text-gray-700 leading-relaxed">Pick your format (SOAP, DAP, BIRP, plus 3 more). The AI drafts. You read, fix anything, hit save. Done.</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-7">
            <ShieldCheck size={20} className="text-amber-600 mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-2">Your data stays yours</h3>
            <p className="text-sm text-gray-700 leading-relaxed">We host the platform for you. Your data exports as standard BIDS / SNIRF / EDF+ / CSV / PDF anytime. No lock-in, ever.</p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          5. THE GUIDE  ·  StoryBrand: empathy + authority
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-10 md:p-12">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Why us</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">We&rsquo;ve sat in your chair.</h2>
              <p className="text-base text-gray-600 leading-relaxed mb-4">
                EEGBase was built with neurofeedback clinicians, not at them. We watched too many smart people give up on the field because the software made every session feel like a fight.
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                So we built the opposite: audited, hardware-agnostic, and simple enough that a brand-new clinician can run a real session their first day.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { num: "10",     label: "Devices supported" },
                { num: "Free",   label: "For licensed clinicians" },
                { num: "SOC 2",  label: "Coalfire audited" },
                { num: "WCAG",   label: "Accessibility certified" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                  <p className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">{s.num}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Authority row — partner / ecosystem logos */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <PartnerLogos />
      </section>

      {/* ════════════════════════════════════════════════════════════════
          6. THE PLAN  ·  StoryBrand: 3 simple steps to get started
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">The plan</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">Get up and running in 3 steps.</h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            No demo call. No sales rep. No quote. Just open the app and start.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { num: "1", title: "Open the demo",  desc: "It&rsquo;s already loaded with 10 sample clients and a live session in progress. Click around for 2 minutes — you&rsquo;ll see the whole platform." },
            { num: "2", title: "Sign up free",   desc: "It takes 90 seconds. No card. No trial limit. Every feature, every device, every clinician on your team." },
            { num: "3", title: "Run a real session", desc: "Pair your headset, click Start, talk to your client. The session records, the AI writes the note, the report sends in one click." },
          ].map((s) => (
            <div key={s.num} className="bg-white border-2 border-gray-100 rounded-2xl p-7 relative hover:border-blue-300 transition-colors">
              <div className="absolute -top-4 left-7 w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-extrabold text-base shadow-lg">
                {s.num}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2 mt-3">{s.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.desc }} />
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/demo" className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            Start with step 1 — open the demo
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          7. EXPLANATORY PARAGRAPH  ·  for skeptics + SEO
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-white border border-gray-100 rounded-3xl p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">What EEGBase actually is</h2>
          <div className="space-y-4 text-base text-gray-700 leading-relaxed">
            <p>
              EEGBase is the simplest neurofeedback clinic platform on the market. It plugs into Mendi fNIRS headbands, Muse EEG headsets, Polar heart-rate straps, Apple Watch, Oura rings, OpenBCI hardware, Whoop bands, and 30+ other devices. Every reading lands in one client record on one screen.
            </p>
            <p>
              During a session, you see the live brain signal, a HIPAA-compliant video call with the client, the reward score, and the running notes — all without leaving the page. After the session, the AI drafts the clinical note in any of six standard formats (SOAP, DAP, BIRP, GIRP, PIE, SIRP). You read it, fix anything, save.
            </p>
            <p>
              Outcome scales (PHQ-9, GAD-7, ADHD-RS-IV, MBI-EE, custom) auto-track over time. Insurance billing (CMS-1500, ERA, ICD-10) is built in. Reports send to clients and referring doctors with one click. Everything exports as BIDS, SNIRF, EDF+, CSV, or PDF — your data stays yours, forever.
            </p>
            <p>
              EEGBase is free for licensed clinicians. Hosted on a HIPAA-friendly U.S. infrastructure (Vercel + Neon, AWS us-east-1). Audited by Bishop Fox, Coalfire (SOC 2), and Deque (WCAG 2.2 AA).
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          8. PRICING  ·  it's free
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 pb-20" id="pricing">
        <div className="bg-gradient-to-br from-blue-50 to-violet-50/40 border border-blue-100 rounded-3xl p-10 text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Pricing</p>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">It&rsquo;s free.</h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-lg mx-auto mb-6">
            Every feature. Every device. Every clinician on your team. No card, no trial limit, no &ldquo;contact sales&rdquo;.
          </p>
          <Link href="/demo" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            Open the demo →
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          9. FAQ  ·  remove last objections
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 pb-20" id="faq">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Common questions</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">What clinicians ask before they sign up.</h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Plain answers, no jargon. Search if you don&rsquo;t see what you need.
          </p>
        </div>
        <SearchableFAQ />
      </section>

      {/* ════════════════════════════════════════════════════════════════
          10. FINAL CTA  ·  StoryBrand: clear, direct call to action
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-blue-600 to-violet-700 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            See for yourself how simple it is.
          </h2>
          <p className="text-blue-100 text-base leading-relaxed mb-8 max-w-lg mx-auto">
            The demo opens straight into a live session. No signup. No walkthrough. You&rsquo;ll know in 30 seconds whether this is the tool you&rsquo;ve been looking for.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/demo"
              className="px-7 py-4 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Open the live demo →
            </Link>
            <Link
              href="/contact"
              className="px-7 py-4 border border-blue-300/50 text-white text-sm font-medium rounded-xl hover:bg-white/10 transition-colors inline-flex items-center gap-2"
            >
              Talk to us
            </Link>
          </div>
          <p className="text-blue-200 text-xs mt-6">10 sample clients · 88 sessions pre-loaded · No account required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-10">
        <div className="max-w-5xl mx-auto flex items-start justify-between text-xs text-gray-400 flex-wrap gap-4">
          <div>
            <span>© 2026 EEGBase — neurofeedback platform for clinics</span>
            <p className="mt-1 text-gray-400">
              Free for licensed clinicians. Hosted in the U.S. on HIPAA-friendly infrastructure. No lock-in.
            </p>
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
            <Link href="/demo" className="hover:text-gray-600 transition-colors">Demo</Link>
            <Link href="/login" className="hover:text-gray-600 transition-colors">Login</Link>
            <Link href="/contact" className="hover:text-gray-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      {/* Sticky demo CTA */}
      <StickyDemoCTA />
    </div>
  );
}
