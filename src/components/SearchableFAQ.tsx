"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type Faq = { q: string; a: string; cat: string };

const FAQS: Faq[] = [
  { cat: "Setup & cost", q: "How much does it cost?", a: "It's free. Every feature, every device, whether you're a clinic with 50 clients or one person with one headset. No card, no trial limit, no \u201ccontact sales\u201d." },
  { cat: "Setup & cost", q: "Can I use this myself if I'm not a clinician?", a: "Yes. EEGBase is free for individuals too. Bring your own headset (Mendi, Muse, Polar, OpenBCI, etc.), pair it, and start training. You get the same dashboard a clinician uses — just skip the parts about clients, insurance, and SOAP notes if they don't apply to you. No clinical license required, no signup hoops." },
  { cat: "Setup & cost", q: "Do I need to install anything?", a: "No — EEGBase runs entirely in the browser. Open the demo or sign up and your clinic (or home setup) is running in minutes, nothing to install. A downloadable desktop build that runs fully locally (offline, on-device data) is also coming for clinics and individuals who want everything to stay on their own machine." },
  { cat: "Devices", q: "Does EEGBase work with devices other than Mendi?", a: "Yes. Muse, Polar, Apple Watch, Oura, Whoop, and OpenBCI all work today. Mendi integration is pending: Mendi is building their public BLE SDK; our adapter and ingestion pipeline are already built and ready to wire up the moment that SDK ships. Adding a new device is a small piece of code." },
  { cat: "Data & security", q: "Is client data safe and HIPAA compliant?", a: "Yes. Encrypted in transit (TLS 1.3) and at rest (AES-256-GCM via AWS KMS). HIPAA-friendly architecture; we sign a BAA on enrollment. SOC 2 Type I scope is being finalised with Coalfire (Type II to follow); an independent web pentest is being scoped — both targeted to start Q3 2026. Hosted on U.S. East (EU clinics on Frankfurt eu-west-3)." },
  { cat: "Data & security", q: "What happens to my data if I stop using EEGBase?", a: "You keep all of it. Export everything as BIDS, SNIRF, EDF+, CSV, or PDF anytime. After cancellation you retain export rights for 90 days, then we permanently delete clinic data within 30 days. No lock-in, ever." },
  { cat: "Migration", q: "Can I move data from another platform?", a: "Yes. One-click import from BrainPaint, EEGer, NeuroGuide, SimplePractice, TherapyNotes, and others. Sessions, notes, and scores carry over. Average setup is 38 minutes." },
  { cat: "Clinical", q: "Is EEGBase a medical device?", a: "No. EEGBase is a software platform, not a medical device. It does not diagnose, treat, cure, or prevent disease. Hardware partners (Mendi, Muse, Polar) handle their own regulatory classifications (FDA general wellness, CE Class I, etc.)." },
  { cat: "Clinical", q: "Can I bill insurance?", a: "Yes. CMS-1500 forms generate after every session with the right neurofeedback codes (90901, 90875, 90876, 90849). ERA auto-posts insurance payments via Stedi or Office Ally clearinghouses." },
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
      {/* FAQPage JSON-LD — Google rich-result eligibility for the inline FAQ.
          Renders all 19 Q&A pairs regardless of which the user has expanded. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      {/* Search + chips */}
      <div className="mb-5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          aria-label="Search FAQ"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
        />
        <div className="flex gap-2 flex-wrap mt-3">
          {categories.map((c) => {
            const count = c === "All" ? FAQS.length : FAQS.filter((f) => f.cat === c).length;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                aria-pressed={activeCat === c}
                aria-label={`${c} (${count} ${count === 1 ? "question" : "questions"})`}
                className={`text-xs font-semibold px-3.5 py-2 min-h-[32px] rounded-full transition-colors ${
                  activeCat === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c}
                {c !== "All" && (
                  <span aria-hidden="true" className="ml-1.5 text-[10px] opacity-60">
                    · {count}
                  </span>
                )}
              </button>
            );
          })}
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
                  id={`faq-trigger-${i}`}
                  onClick={() => toggle(i)}
                  aria-expanded={open.has(i)}
                  aria-controls={`faq-panel-${i}`}
                  className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mr-2">{item.cat}</span>
                    <span className="sr-only">: </span>
                    <span className="text-sm font-semibold text-gray-900">{item.q}</span>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 shrink-0 ml-4 transition-transform ${open.has(i) ? "rotate-180" : ""}`} />
                </button>
                {open.has(i) && (
                  <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-trigger-${i}`} className="px-5 pb-4 bg-white text-sm text-gray-600 leading-relaxed border-t border-gray-100">
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
