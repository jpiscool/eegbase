"use client";

import Link from "next/link";
import { ShieldCheck, Bluetooth, Brain, Sparkles, ArrowRight } from "lucide-react";
import { SearchableFAQ } from "@/components/SearchableFAQ";

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
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span className="text-base font-bold text-gray-900">EEGBase</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/demo?tab=dashboard"
              className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="landing-main">
      {/* ════════════════════════════════════════════════════════════════
          1. HERO  ·  StoryBrand: Character + What they want
          UNCHANGED per user direction
          ════════════════════════════════════════════════════════════════ */}
      <section className="relative max-w-5xl mx-auto px-5 sm:px-6 pt-14 sm:pt-24 pb-14 sm:pb-20 text-center" style={{ overflow: "visible" }}>
        <style>{`
          @keyframes orbDrift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(40px, -30px) scale(1.1); } 66% { transform: translate(-30px, 20px) scale(0.95); } }
          @keyframes orbDrift2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-50px, 40px) scale(1.15); } }
          @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4), 0 8px 24px -8px rgba(37,99,235,0.5); } 50% { box-shadow: 0 0 0 8px rgba(37,99,235,0), 0 12px 32px -8px rgba(37,99,235,0.6); } }
          /* Hide the ambient orbs on phones — at viewports ≤640px the
             480/400/600px orbs read as discrete blue/purple patches
             rather than soft ambient light, which feels off. */
          @media (max-width: 640px) {
            .hero-orb { display: none !important; }
          }
        `}</style>
        <div aria-hidden className="hero-orb" style={{ position: "absolute", top: "-80px", left: "10%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(37,99,235,0.18), transparent 70%)", filter: "blur(48px)", animation: "orbDrift1 18s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
        <div aria-hidden className="hero-orb" style={{ position: "absolute", top: "20px", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(168,85,247,0.14), transparent 70%)", filter: "blur(48px)", animation: "orbDrift2 22s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
        <div aria-hidden className="hero-orb" style={{ position: "absolute", top: "-40px", left: "50%", width: 600, height: 600, transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(6,182,212,0.08), transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="font-extrabold text-gray-900 mb-5" style={{ fontSize: "clamp(2.25rem, 8vw, 4rem)", letterSpacing: "-0.035em", lineHeight: 1.18 }}>
            Control all your neurofeedback devices with{" "}
            <span className="whitespace-nowrap" style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>one tool</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto mb-7" style={{ fontSize: "1.075rem", lineHeight: 1.65, letterSpacing: "-0.005em" }}>
            Plug in Mendi, Muse, Polar, Apple Watch, Oura, OpenBCI — any neurofeedback or wearable. <strong className="text-gray-900">All your data in one place.</strong>
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/demo?tab=dashboard"
              className="px-7 py-3.5 text-white text-sm font-semibold rounded-xl transition-all"
              style={{ background: "#2563EB", animation: "pulseGlow 2.4s ease-in-out infinite", boxShadow: "0 1px 0 0 rgba(255,255,255,0.15) inset, 0 8px 24px -8px rgba(37,99,235,0.5)" }}
            >
              Try the live demo →
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          2. CONTRAST · without vs with — concrete, comparison-based
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Without vs with</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
            Five tools in one
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Most neurofeedback clinicians juggle five disconnected apps — streaming, EHR, billing, video, and notes. EEGBase replaces all of them with a single screen.{" "}
            <strong className="text-gray-900">Using it for yourself at home?</strong>{" "}
            Same software, same price (free) — just skip the parts you don&rsquo;t need.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* LEFT — without EEGBase */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200">
              <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">×</span>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Without EEGBase</h3>
            </div>
            <ul className="space-y-3.5 text-sm text-gray-600 leading-relaxed">
              {[
                <><strong className="text-gray-800">5 disconnected apps</strong> — brain capture, EHR, billing, video, notes — none of them share data</>,
                <><strong className="text-gray-800">$300–$800 / month</strong> in software subscriptions before you see a client</>,
                <><strong className="text-gray-800">Locked to one headset vendor</strong> — Muse-only or Mendi-only platforms force you to start over if you switch</>,
                <><strong className="text-gray-800">15 minutes writing each clinical note</strong> by hand · an hour a day you don't see clients</>,
                <><strong className="text-gray-800">Windows desktop installer</strong> with IT setup, per-machine licenses, and 200-page PDFs</>,
                <><strong className="text-gray-800">Insurance forms by hand</strong> — CMS-1500 entry, ERA reconciliation, payer follow-up</>,
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5">
                  <span aria-hidden="true" className="text-gray-400 mt-0.5">×</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — with EEGBase */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-7 relative" style={{ boxShadow: "0 8px 24px -12px rgba(37,99,235,0.25)" }}>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-blue-200">
              <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">✓</span>
              <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider">With EEGBase</h3>
            </div>
            <ul className="space-y-3.5 text-sm text-gray-700 leading-relaxed">
              {[
                <><strong className="text-gray-900">One screen, one record</strong> — live brain signal, HIPAA video, reward score, and AI notes side-by-side</>,
                <><strong className="text-gray-900">Free for clinicians and individuals</strong> · no card, no per-seat fee, no &ldquo;contact sales&rdquo; — same platform whether you&rsquo;re a clinic or one person at home</>,
                <><strong className="text-gray-900">Hardware-agnostic</strong> — Mendi, Muse, Polar, Apple Watch, Oura, OpenBCI, Whoop · switch headsets and keep every session&rsquo;s history</>,
                <><strong className="text-gray-900">AI drafts the note in 60 seconds</strong> in your format (SOAP, DAP, BIRP, +3 more) · you review and save</>,
                <><strong className="text-gray-900">Runs in any browser — or fully local on your desktop</strong> — Mac, Windows, iPad, Chromebook · zero install web, downloadable local build coming soon</>,
                <><strong className="text-gray-900">CMS-1500 + ERA auto-posted</strong> via Stedi or Office Ally clearinghouses</>,
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5">
                  <span aria-hidden="true" className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Subscription estimates compiled May 2026 from public pricing of SimplePractice ($69–$149), TherapyNotes ($59–$99), Myndlift ($99+), and BrainMaster Discovery ($150+/mo).
        </p>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          3. THESIS  ·  short declarative manifesto. Intentionally bare —
             no cards, no stats, no icons. Three statements of growing
             weight, then one quiet credibility line. Stark visual
             contrast to every surrounding card-heavy section.
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 pb-14 sm:pb-20">
        <div className="relative text-center py-12 sm:py-20 md:py-28 overflow-hidden">
          {/* Soft ambient glow — same palette as the hero, dialed way down */}
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 60% at 50% 40%, rgba(124,58,237,0.06), transparent 70%)" }} />

          <div className="relative">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.22em] mb-8 sm:mb-12">Our thesis</p>

            <p className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-500 leading-snug mb-4 sm:mb-5 tracking-tight">
              Neurofeedback isn&rsquo;t broken.
            </p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 leading-snug mb-8 sm:mb-10 tracking-tight">
              The software around it is just lagging behind.
            </p>

            <p
              className="font-extrabold leading-[1.18] sm:leading-[1.05] tracking-[-0.035em]"
              style={{
                fontSize: "clamp(2.25rem, 9vw, 4.5rem)",
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #06B6D4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              EEGBase is your all in one solution!
            </p>

            <p className="text-base md:text-lg text-gray-700 mt-5 sm:mt-6 leading-relaxed">
              For the clinic. For the home. For free.
            </p>

            <p className="text-xs text-gray-400 mt-10 sm:mt-14 max-w-md mx-auto leading-relaxed">
              Neurofeedback has been clinically studied since the 1970s. Consumer fNIRS became affordable in the 2010s. We built the dashboard the field has been waiting on.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          4. VALUE PROPOSITION  ·  StoryBrand: how it works, in concrete terms
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">How it works</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">One screen. One record. One AI that does the boring stuff.</h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            EEGBase plugs into the headsets, watches, and rings you already use. Every session feeds the same record — yours, or your client&rsquo;s. The AI watches everything and (if you&rsquo;re running clinical sessions) writes the notes for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-7">
            <Bluetooth size={20} className="text-blue-600 mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-2">Plug in any device</h3>
            <p className="text-sm text-gray-700 leading-relaxed">Mendi, Muse, Polar, Apple Watch, Oura, OpenBCI, Whoop. One button to pair. Switch headsets next year — you keep every session&rsquo;s history.</p>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-2xl p-7">
            <Brain size={20} className="text-violet-600 mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-2">See the whole session live</h3>
            <p className="text-sm text-gray-700 leading-relaxed">Brain data, heart rate, score, notes — all on one screen. Whether you&rsquo;re training your own brain or watching a client train theirs, the rest just works.</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-7">
            <Sparkles size={20} className="text-emerald-600 mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-2">Let the AI write the note</h3>
            <p className="text-sm text-gray-700 leading-relaxed">Clinicians: pick your format (SOAP, DAP, BIRP, plus 3 more). AI drafts, you review, hit save. Solo users: skip it — or use the AI to summarise your own training run.</p>
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
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">We&rsquo;ve sat in your chair.</h2>
              <p className="text-base text-gray-600 leading-relaxed mb-4">
                EEGBase was built with neurofeedback clinicians, not at them. We watched too many smart people give up on the field because the software made every session feel like a fight.
              </p>
              <p className="text-base text-gray-600 leading-relaxed mb-4">
                So we built the opposite: audited, hardware-agnostic, and simple enough that a brand-new clinician can run a real session their first day.
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                Built for clinicians first &mdash; <strong className="text-gray-900">but free for anyone</strong> who owns a headset and wants to track their own training. Same software, same data export, no signup hoops.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { num: "10+",    label: "Devices supported" },
                { num: "Free",   label: "Clinicians + individuals" },
                { num: "SOC 2",  label: "Audit planned Q3 2026" },
                { num: "WCAG",   label: "2.2 AA audit planned Q3 2026" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                  <p className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">{s.num}</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          6. THE PLAN  ·  StoryBrand: 3 simple steps to get started
          ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">The plan</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">Get up and running in 3 steps.</h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            No demo call. No sales rep. No quote. Just open the app and start.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { num: "1", title: "Open the demo",  desc: "It&rsquo;s already loaded with sample clients and a live session in progress. Click around for 2 minutes — you&rsquo;ll see the whole platform." },
            { num: "2", title: "Sign up free",   desc: "It takes 90 seconds. No card. No trial limit. Whether you&rsquo;re a clinic with 50 clients or one person with one headset — every feature, every device." },
            { num: "3", title: "Run a real session", desc: "Pair your headset, click Start. Watch your own brain or your client&rsquo;s brain. The session records, the AI handles the notes (if you want them), the report sends in one click." },
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
          <Link href="/demo?tab=dashboard" className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">What EEGBase actually is</h2>
          <div className="space-y-4 text-base text-gray-700 leading-relaxed">
            <p>
              EEGBase is the simplest neurofeedback platform on the market. It plugs into Mendi fNIRS headbands, Muse EEG headsets, Polar heart-rate straps, Apple Watch, Oura rings, OpenBCI hardware, Whoop bands, and other BLE neurofeedback devices. Every reading lands in one record on one screen.
            </p>
            <p>
              <strong>For clinicians:</strong> during a session, you see the live brain signal, a HIPAA-compliant video call with the client, the reward score, and the running notes — all without leaving the page. After the session, the AI drafts the clinical note in any of six standard formats (SOAP, DAP, BIRP, GIRP, PIE, SIRP). Outcome scales (PHQ-9, GAD-7, ADHD-RS-IV, MBI-EE, custom) auto-track over time. Insurance billing (CMS-1500, ERA, ICD-10) is built in.
            </p>
            <p>
              <strong>For individuals:</strong> bring your own headset, pair it, run a session, see your own progress over time. No client record to fill out, no insurance forms to file, no clinical license required. You get the same dashboard a clinician uses — just without the bits that don&rsquo;t apply to one person.
            </p>
            <p>
              Everything exports as BIDS, SNIRF, EDF+, CSV, or PDF — your data stays yours, forever. EEGBase is free for licensed clinicians and free for individuals. Hosted on a HIPAA-friendly U.S. infrastructure (AWS us-east-1; EU clinics on eu-west-3). Independent pen-test, Coalfire SOC 2, and Deque WCAG 2.2 AA audits are planned for Q3 2026 (vendor selection in progress).
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
            Every feature. Every device. Whether you&rsquo;re a clinic with 50 clients or one person with one headset. No card, no trial limit, no &ldquo;contact sales&rdquo;.
          </p>
          <Link href="/demo?tab=dashboard" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
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
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">What people ask before using EEGBase</h2>
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
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            See for yourself how simple it is.
          </h2>
          <p className="text-blue-100 text-base leading-relaxed mb-8 max-w-lg mx-auto">
            The demo opens straight into a live session. No signup. No walkthrough. You&rsquo;ll know in 30 seconds whether this is the tool you&rsquo;ve been looking for.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/demo?tab=dashboard"
              className="px-7 py-4 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Open the live demo →
            </Link>
          </div>
          <p className="text-blue-200 text-xs mt-6">5 sample clients · 20-session arcs pre-loaded · No account or clinical license required</p>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-10">
          {/* Brand row */}
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 pb-12 border-b border-white/10">
            {/* Brand + tagline */}
            <div>
              <Link href="/" className="flex items-center gap-2.5 mb-4" style={{ textDecoration: "none" }}>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
                </div>
                <span className="text-base font-bold text-white">EEGBase</span>
              </Link>
              <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
                The clinical layer for any neurofeedback hardware. Free for clinicians and individuals.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/demo?tab=dashboard" className="hover:text-white transition-colors">Live demo</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/docs/getting-started" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between pt-8 text-xs text-gray-500 flex-wrap gap-4">
            <span>© 2026 EEGBase. All rights reserved.</span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ boxShadow: "0 0 6px rgba(16,185,129,0.6)" }} />
              <Link href="/status" className="hover:text-white transition-colors">All systems operational</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
