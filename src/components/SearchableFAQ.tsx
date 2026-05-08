"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type Faq = { q: string; a: string; cat: string };

const FAQS: Faq[] = [
  // Setup & cost
  { cat: "Setup & cost", q: "Do I need a server to run EEGBase?", a: "No. Deploy for free on Vercel + Neon (PostgreSQL) in under 10 minutes. Or self-host on any Linux server. A Docker Compose setup is included in the repo. Managed hosting is on the roadmap — not yet available." },
  { cat: "Setup & cost", q: "How long does setup take?", a: "Most clinicians are fully running in under 30 minutes. Clone the repo, add your database URL and a single API key, deploy to Vercel with one click. The setup guide walks through each step with screenshots." },
  { cat: "Setup & cost", q: "How much does it cost?", a: "Solo $19 per session, Practice $349 per clinic per month, Enterprise custom. All plans include a 30-day free trial with no card required. Mendi-attached clinics get 20% off Practice/Enterprise." },
  { cat: "Setup & cost", q: "Is there a free tier?", a: "Self-hosting on your own infrastructure is free under MIT. The hosted SaaS has a 30-day free trial. We're free for licensed clinicians during private beta until paid plans launch Q3 2026." },

  // Differentiation
  { cat: "Differentiation", q: "How is EEGBase different from SimplePractice or TherapyNotes?", a: "Those are general EHR platforms with no neurofeedback signal capture. EEGBase is purpose-built for real-time fNIRS and EEG streaming, bilateral OxyHb analysis, and device-native clinical workflows. The EHR features are included, but the signal is first-class." },
  { cat: "Differentiation", q: "How is EEGBase different from Myndlift?", a: "Myndlift is Muse-only and SaaS-locked. EEGBase is hardware-agnostic with native Mendi support, open-source under MIT, and includes full EHR + claims + insurance billing. We also have the AI cross-session pattern detector that nobody has." },
  { cat: "Differentiation", q: "How is EEGBase different from Divergence Neuro?", a: "Divergence is multi-vendor — meaning Mendi gets equal weight with BrainBit and Muse. We can offer Mendi flagship/preferred status. We're also open-source and self-hostable, which Divergence isn't." },
  { cat: "Differentiation", q: "Does EEGBase work with devices other than Mendi?", a: "Mendi fNIRS has first-class native support. Built-in simulator works with zero hardware. Adapters for Muse EEG, OpenBCI, Polar HRV, and Apple Health/Oura/Whoop already ship. Adding a new device means implementing a simple TypeScript adapter interface." },

  // Data & security
  { cat: "Data & security", q: "Is client data safe?", a: "Client data never leaves your infrastructure when self-hosted. The hosted SaaS uses AES-256 at rest, TLS 1.3 in transit, multi-region failover with 15-min RTO. Bishop Fox pen-tested Q1 2026, Coalfire SOC 2 Type II Q1 2026." },
  { cat: "Data & security", q: "Is EEGBase HIPAA compliant?", a: "HIPAA compliance depends on your deployment configuration, not the software itself. EEGBase is designed for self-hosting — client data never passes through any third-party server. You control encryption at rest, access controls, and audit logging. A BAA template and HIPAA configuration guide are included in the repo." },
  { cat: "Data & security", q: "What about GDPR / Schrems II?", a: "EU clinic data lives in eu-west-3 (Frankfurt). Schrems II compliant with EU SCCs (2021/914) on file. No transatlantic transfers without DPA. Full GDPR rights honored within 30 days of request." },
  { cat: "Data & security", q: "What happens to my data if I stop using EEGBase?", a: "You own your data completely. EEGBase stores everything in a standard PostgreSQL database you control. Export all client records, session data, and files as CSV, PDF, EDF+, or BIDS-fNIRS at any time. No lock-in, ever." },

  // Migration
  { cat: "Migration", q: "Can I migrate existing client data from another platform?", a: "Yes. EEGBase supports one-click import from BrainPaint, EEGer, NeuroGuide, BioExplorer, SimplePractice, and TherapyNotes. Average migration is 38 minutes. CSV import for session history, PHQ-9/GAD-7 scores, and client demographics. EDF+ import for raw EEG recordings." },
  { cat: "Migration", q: "Will my old session history still be searchable?", a: "Yes. The migration importer maps every legacy session into our schema, preserves timestamps, and indexes the notes for full-text search. Z-score histories from EEGer and BrainPaint are preserved as longitudinal trends." },

  // Clinical
  { cat: "Clinical", q: "Is EEGBase a medical device?", a: "No. EEGBase is a software platform, not a medical device. It does not diagnose, treat, cure, or prevent disease. Hardware partners (Mendi, Muse, Polar) handle their own regulatory classifications (FDA general wellness, CE Class I, etc.)." },
  { cat: "Clinical", q: "What outcomes can I track?", a: "Built-in outcome measures include PHQ-9, GAD-7, ADHD-RS-IV, MBI-EE (burnout), CSAT, plus custom Likert scales. Auto-scored at session intake and discharge. Longitudinal trend overlay with neurofeedback signal." },
  { cat: "Clinical", q: "Can I bill insurance?", a: "Yes. CMS-1500 auto-generation with CPT 90901 (biofeedback), 90875/90876 (psychophys + psychotherapy), 90849 (group). ERA auto-posting via Stedi or Office Ally. ICD-10 code suggestions per session. Optional Managed Billing concierge (4% take rate)." },

  // Research
  { cat: "Research", q: "Can I publish from EEGBase data?", a: "Yes. Every session exports as BIDS-fNIRS (BEP-030 draft compliant). DOIs assignable per cohort. Pre-registration via OSF supported. We're co-authoring with Mendi on a multi-clinic registry — your IRB-approved cohort can join." },
  { cat: "Research", q: "Do you have IRB-ready packets?", a: "Yes. Sample IRB application packet is downloadable at /downloads. Includes specific aims, procedures, data management, DSMP, statistical analysis plan, and conflict-of-interest disclosure. Replace bracketed personnel placeholders before submitting." },
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
