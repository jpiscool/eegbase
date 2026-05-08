"use client";

import { useEffect, useRef, useState } from "react";
import { CLIENTS } from "../_data/clients";
import { SARAH_SESSIONS, HOME_USER_STREAK } from "../_data/sessions";

const PURPOSE_KEY = "eegbase-demo-purpose-";
const ACCESS_LOG_KEY = "eegbase-demo-access-log";

type Purpose = {
  id: string;
  label: string;
  hint: string;
  defaultOn: boolean;
};

// Per-purpose toggles. Each is independently revocable. The "share with
// clinician" toggle is also surfaced here for symmetry but it's the same
// underlying key as the Phase 13 ClinicianShareCard (kept in sync).
const PURPOSES: Purpose[] = [
  { id: "clinician",  label: "Share with my clinician", hint: "Dr. Maya Chen sees sessions, notes, and trends.", defaultOn: true },
  { id: "ai",         label: "Use my data to improve AI", hint: "Anonymous patterns help the AI get better. Never sold.", defaultOn: false },
  { id: "research",   label: "Contribute to research",    hint: "De-identified data joins published studies. Always opt-in.", defaultOn: false },
  { id: "marketing",  label: "Product updates email",    hint: "About one a month. Plain text. One-click unsubscribe.",      defaultOn: true },
];

interface PrivacySheetProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  audience: "clinician" | "home";
}

// Per the research: GDPR Article 9 + EU AI Act 2026 require granular per-
// purpose consent toggles, revocable independently, with a one-click data
// export and a user-readable access log. This sheet ships all four.
export function PrivacySheet({ open, setOpen, audience }: PrivacySheetProps) {
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PURPOSES.forEach((p) => { initial[p.id] = p.defaultOn; });
    return initial;
  });
  const [exported, setExported] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const next: Record<string, boolean> = {};
      PURPOSES.forEach((p) => {
        // Special case: "clinician" mirrors the existing Phase 13 toggle key.
        const storageKey = p.id === "clinician" ? "eegbase-demo-share" : PURPOSE_KEY + p.id;
        const v = localStorage.getItem(storageKey);
        if (p.id === "clinician") {
          next[p.id] = v == null ? p.defaultOn : v === "on";
        } else {
          next[p.id] = v == null ? p.defaultOn : v === "1";
        }
      });
      setValues(next);
    } catch {}
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => dialogRef.current?.focus(), 10);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (open && e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  function toggle(id: string) {
    const next = { ...values, [id]: !values[id] };
    setValues(next);
    try {
      if (id === "clinician") {
        localStorage.setItem("eegbase-demo-share", next[id] ? "on" : "off");
      } else {
        localStorage.setItem(PURPOSE_KEY + id, next[id] ? "1" : "0");
      }
    } catch {}
  }

  function exportData() {
    // Real app exports a per-user JSON+PDF bundle. Demo bundles the visible
    // sample data and triggers a browser download.
    const bundle = {
      generatedAt: new Date().toISOString(),
      user: CLIENTS[0],
      sessions: SARAH_SESSIONS,
      streakLast7Days: HOME_USER_STREAK,
      consents: values,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eegbase-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  }

  if (!open) return null;

  // Sample audit log entries — what the user-readable access trail looks like.
  const accessLog = [
    { who: "Dr. Maya Chen", what: "Viewed your trend chart",  when: "Yesterday, 4:12 PM" },
    { who: "You",            what: "Opened a session report",  when: "Yesterday, 7:48 PM" },
    { who: "Dr. Maya Chen", what: "Added a session note",     when: "May 12, 2:33 PM" },
    { who: "AI service",     what: "Read 4 sessions for Ask",  when: "Today, 9:01 AM" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Privacy and data"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 outline-none max-h-[85vh] flex flex-col"
      >
        <div className="px-6 pt-6 pb-2 flex-shrink-0">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Privacy & data</p>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">You decide who sees what</h2>
          <p className="text-sm text-gray-500 leading-relaxed">Each toggle is revocable any time. We log every access in plain English below.</p>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-3">
          {/* Per-purpose consent toggles */}
          <section className="py-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">What your data is used for</p>
            <ul className="divide-y divide-gray-100">
              {PURPOSES.map((p) => {
                const on = values[p.id] ?? p.defaultOn;
                return (
                  <li key={p.id} className="py-3 flex items-center gap-4">
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">{p.label}</span>
                      <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">{p.hint}</span>
                    </span>
                    <button
                      onClick={() => toggle(p.id)}
                      role="switch"
                      aria-checked={on}
                      aria-label={`${p.label} ${on ? "on" : "off"}`}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Access log */}
          <section className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent access</p>
            <ul className="space-y-2">
              {accessLog.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {a.who.split(" ").map((s) => s[0]).slice(0,2).join("")}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-gray-800 leading-snug">
                      <span className="font-semibold">{a.who}</span> · {a.what}
                    </span>
                    <span className="block text-[11px] text-gray-400 tabular-nums mt-0.5">{a.when}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Export + delete */}
          <section className="border-t border-gray-100 pt-3 mt-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Your data is yours</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={exportData}
                className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between"
              >
                <span>{exported ? "Exported \u2713" : "Export everything (JSON)"}</span>
                <span aria-hidden>{exported ? "\u2713" : "\u2193"}</span>
              </button>
              <button
                onClick={() => alert("Demo: in production this opens a 30-day grace-period delete confirmation flow.")}
                className="w-full text-left bg-white border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-rose-50 transition-colors flex items-center justify-between"
              >
                <span>Delete my account & data</span>
                <span aria-hidden>{"\u00d7"}</span>
              </button>
              <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                Delete starts a 30-day grace period. You can restore at any time during that window.
              </p>
            </div>
          </section>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end flex-shrink-0">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm text-gray-700 font-semibold hover:text-gray-900"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
