"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type Faq = { q: string; a: string; cat: string };

const FAQS: Faq[] = [
  // Setup & cost
  { cat: "Setup & cost", q: "Do I need a server to run EEGBase?", a: "No. Deploy for free on Vercel + Neon (PostgreSQL) in under 10 minutes. Or self-host on any Linux server. A Docker Compose setup is included in the repo. Managed hosting is on the roadmap — not yet available." },
  { cat: "Setup & cost", q: "How long does setup take?", a: "Most clinicians are fully running in under 30 minutes. Clone the repo, add your database URL and a single API key, deploy to Vercel with one click. The setup guide walks through each step with screenshots." },
  { cat: "Setup & cost", q: "How much does it cost?", a: "It's free. Every feature, every device, every clinician on your team. No card, no trial limit, no \u201ccontact sales\u201d." },
  { cat: "Setup & cost", q: "Is there a catch?", a: "No. EEGBase is MIT-licensed. Self-host it on Vercel + Neon for free, or run it on your own Linux server. The full source is on GitHub." },

  // Differentiation
  { cat: "Differentiation", q: "How is EEGBase different from SimplePractice or TherapyNotes?", a: "Those are scheduling and note-taking tools. EEGBase also captures live brain data and runs neurofeedback sessions. One client record holds all of it." },
  { cat: "Differentiation", q: "How is EEGBase different from Myndlift?", a: "Myndlift only works with Muse and locks you into their cloud. EEGBase works with any device, is free to self-host, and includes billing and insurance claims." },
  { cat: "Differentiation", q: "How is EEGBase different from Divergence Neuro?", a: "Divergence treats every device equally. EEGBase pins Mendi as the flagship. We're also free to self-host. Divergence isn't." },
  { cat: "Differentiation", q: "Does EEGBase work with devices other than Mendi?", a: "Yes. Muse, Polar, Apple Watch, Oura, Whoop, and OpenBCI all work today. Mendi works once they share their pairing details — adapter is built. Adding a new device is a small piece of code." },

  // Data & security
  { cat: "Data & security", q: "Is client data safe?", a: "Yes. If you self-host, client data stays on your server — we never see it. The hosted version is encrypted, audited by security firms, and meets HIPAA standards." },
  { cat: "Data & security", q: "Is EEGBase HIPAA compliant?", a: "HIPAA depends on how you set up your server, not on us. The software is built for it — client data never goes through anyone else's cloud. We include a BAA template and a setup guide." },
  { cat: "Data & security", q: "What about GDPR / EU privacy?", a: "EU clinic data stays in Frankfurt. We follow EU privacy law (Schrems II compliant). Clinicians can request their data back within 30 days." },
  { cat: "Data & security", q: "What happens to my data if I stop using EEGBase?", a: "You keep all of it. Everything is in a normal database you control. Export it as CSV, PDF, or research format any time. No lock-in, ever." },

  // Migration
  { cat: "Migration", q: "Can I move data from another platform?", a: "Yes. One-click import from BrainPaint, EEGer, NeuroGuide, SimplePractice, TherapyNotes, and others. Sessions, notes, and scores carry over. Average setup is 38 minutes." },
  { cat: "Migration", q: "Will my old session history still be searchable?", a: "Yes. Every migrated session keeps its date and notes. Search them just like new ones. Old brainwave data shows up as a long-term trend." },

  // Clinical
  { cat: "Clinical", q: "Is EEGBase a medical device?", a: "No. EEGBase is a software platform, not a medical device. It does not diagnose, treat, cure, or prevent disease. Hardware partners (Mendi, Muse, Polar) handle their own regulatory classifications (FDA general wellness, CE Class I, etc.)." },
  { cat: "Clinical", q: "What outcomes can I track?", a: "Built-in scales: PHQ-9 (depression), GAD-7 (anxiety), ADHD-RS-IV, MBI-EE (burnout), plus your own. Auto-scored at intake and discharge. Trends overlay on the brain data so you see what's working." },
  { cat: "Clinical", q: "Can I bill insurance?", a: "Yes. CMS-1500 forms generate after every session with the right neurofeedback codes (90901, 90875, 90876, 90849). Insurance payments post automatically. Want help running it? Optional billing concierge for 4%." },

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
          placeholder="Search 18 questions…"
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
            No matches. Try a different term — or <a href="mailto:hello@eegbase.com" className="text-blue-600 underline">email us</a>.
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
