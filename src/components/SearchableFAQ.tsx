"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type Faq = { q: string; a: string; cat: string };

const FAQS: Faq[] = [
  // Setup & cost
  { cat: "Setup & cost", q: "Do I need to install anything?", a: "No. EEGBase is a hosted web app. Open the demo or sign up — your clinic is running in minutes. Nothing to install." },
  { cat: "Setup & cost", q: "How long does setup take?", a: "Most clinicians are fully running in under 30 minutes. Sign up, add your first client, pair your headset. The setup guide walks through each step with screenshots." },
  { cat: "Setup & cost", q: "How much does it cost?", a: "It's free. Every feature, every device, every clinician on your team. No card, no trial limit, no \u201ccontact sales\u201d." },
  { cat: "Setup & cost", q: "Is there a catch?", a: "No. EEGBase is free for licensed clinicians during early launch. We host it on HIPAA-friendly U.S. infrastructure (AWS us-east-1; EU clinics on eu-west-3). Your data stays clinic-owned and exports as standard files anytime." },

  // Differentiation
  { cat: "Differentiation", q: "How is EEGBase different from SimplePractice or TherapyNotes?", a: "Those are scheduling and note-taking tools. EEGBase also captures live brain data and runs neurofeedback sessions. One client record holds all of it." },
  { cat: "Differentiation", q: "How is EEGBase different from Myndlift?", a: "Myndlift only works with Muse. EEGBase works with any device, is free for licensed clinicians, and includes billing and insurance claims." },
  { cat: "Differentiation", q: "How is EEGBase different from Divergence Neuro?", a: "Divergence treats every device equally. EEGBase pins Mendi as the flagship. We're free for licensed clinicians; Divergence is paid SaaS." },
  { cat: "Differentiation", q: "Does EEGBase work with devices other than Mendi?", a: "Yes. Muse, Polar, Apple Watch, Oura, Whoop, and OpenBCI all work today. Mendi works once they share their pairing details — adapter is built. Adding a new device is a small piece of code." },

  // Data & security
  { cat: "Data & security", q: "Is client data safe?", a: "Yes. Encrypted in transit (TLS 1.3) and at rest (AES-256-GCM via AWS KMS). Bishop Fox penetration test and Coalfire SOC 2 Type II audit are scheduled for Q1 2026. Hosted on U.S. East infrastructure (EU clinics on Frankfurt eu-west-3)." },
  { cat: "Data & security", q: "Is EEGBase HIPAA compliant?", a: "Yes. HIPAA-friendly architecture; we sign a BAA on enrollment. Client data is encrypted, U.S.-resident only, and never sent to any third party without explicit clinician consent." },
  { cat: "Data & security", q: "What about GDPR / EU privacy?", a: "EU clinic data stays in Frankfurt. We follow EU privacy law (Schrems II compliant). Clinicians can request their data back within 30 days." },
  { cat: "Data & security", q: "What happens to my data if I stop using EEGBase?", a: "You keep all of it. Export everything as BIDS, SNIRF, EDF+, CSV, or PDF anytime. After cancellation you retain export rights for 90 days, then we permanently delete clinic data within 30 days. No lock-in, ever." },

  // Migration
  { cat: "Migration", q: "Can I move data from another platform?", a: "Yes. One-click import from BrainPaint, EEGer, NeuroGuide, SimplePractice, TherapyNotes, and others. Sessions, notes, and scores carry over. Average setup is 38 minutes." },
  { cat: "Migration", q: "Will my old session history still be searchable?", a: "Yes. Every migrated session keeps its date and notes. Search them just like new ones. Old brainwave data shows up as a long-term trend." },

  // Clinical
  { cat: "Clinical", q: "Is EEGBase a medical device?", a: "No. EEGBase is a software platform, not a medical device. It does not diagnose, treat, cure, or prevent disease. Hardware partners (Mendi, Muse, Polar) handle their own regulatory classifications (FDA general wellness, CE Class I, etc.)." },
  { cat: "Clinical", q: "What outcomes can I track?", a: "Built-in scales: PHQ-9 (depression), GAD-7 (anxiety), ADHD-RS-IV, MBI-EE (burnout), plus your own. Auto-scored at intake and discharge. Trends overlay on the brain data so you see what's working." },
  { cat: "Clinical", q: "Can I bill insurance?", a: "Yes. CMS-1500 forms generate after every session with the right neurofeedback codes (90901, 90875, 90876, 90849). ERA auto-posts insurance payments via Stedi or Office Ally clearinghouses." },

  // Research
  { cat: "Research", q: "Can I publish from EEGBase data?", a: "Yes. Every session exports in research-standard formats. Get a DOI per cohort. Pre-register your study. We're co-authoring with Mendi on a multi-clinic study — your cohort can join." },
  { cat: "Research", q: "Do you have IRB-ready packets?", a: "Yes. Download a sample IRB application at /downloads. It covers aims, procedures, data plan, statistics, and conflicts of interest. Replace the bracketed names before submitting." },
];

export function SearchableFAQ() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [open, setOpen] = useState<Set<number>>(new Set());

  const categories = useMemo(() => ["All", ...Array.from(new Set(FAQS.map((f) => f.cat)))], []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => {
      if (activeCat !== "All" && f.cat !== activeCat) return false;
      if (!q) return true;
      return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q);
    });
  }, [query, activeCat]);

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div>
      {/* Search + chips */}
      <div className="mb-5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 19 questions…"
          aria-label="Search FAQ"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
        />
        <div className="flex gap-2 flex-wrap mt-3">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                activeCat === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c}
              {c !== "All" && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {FAQS.filter((f) => f.cat === c).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(query || activeCat !== "All") && (
        <p className="text-xs text-gray-400 mb-3">
          {filtered.length} {filtered.length === 1 ? "match" : "matches"}
          {query && <> for &ldquo;{query}&rdquo;</>}
        </p>
      )}

      {/* Items */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            No matches. Try a different term — or <a href="/contact" className="text-blue-600 underline">ask us directly</a>.
          </div>
        ) : (
          filtered.map((item, originalIdx) => {
            const i = FAQS.indexOf(item);
            return (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={open.has(i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mr-2">{item.cat}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.q}</span>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 shrink-0 ml-4 transition-transform ${open.has(i) ? "rotate-180" : ""}`} />
                </button>
                {open.has(i) && (
                  <div className="px-5 pb-4 bg-white text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
