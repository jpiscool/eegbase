"use client";

import { useState, useEffect } from "react";

// Bottom-right onboarding dock. 5 steps, first pre-checked, collapsible.
// Persists dismiss in localStorage so a returning user isn't pestered.

const STORAGE_KEY = "eegbase-demo-checklist";

const STEPS = [
  { label: "Account ready",        time: "",       done: true,  hint: "" },
  { label: "Open the live demo",   time: "30s",    done: false, hint: "You're already here." },
  { label: "Run the sample session", time: "5 min", done: false, hint: "From Today, click \u201cStart next session\u201d." },
  { label: "Open a patient record", time: "1 min", done: false, hint: "From the header search, type a name." },
  { label: "Sign up — it's free",   time: "90s",   done: false, hint: "" },
];

export function ChecklistDock() {
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "dismissed") setDismissed(true);
      if (v === "collapsed") setOpen(false);
      // Default to collapsed on small screens so the dock doesn't cover content.
      else if (typeof window !== "undefined" && window.innerWidth < 640 && v !== "open") {
        setOpen(false);
      }
    } catch {}
  }, []);

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, "dismissed"); } catch {}
  }
  function toggle() {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(STORAGE_KEY, next ? "open" : "collapsed"); } catch {}
  }

  if (dismissed) return null;

  const done = STEPS.filter(s => s.done).length;
  const total = STEPS.length;

  return (
    <div
      role="region"
      aria-label="Getting started checklist"
      className="fixed bottom-5 right-5 z-40 w-72 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden"
    >
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Getting started</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5 tabular-nums">{done} of {total} done</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? "—" : "+"}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          <ul className="px-4 py-3 space-y-2">
            {STEPS.map((s) => (
              <li key={s.label} className="flex items-start gap-2.5 text-sm">
                <span
                  className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    s.done ? "bg-emerald-500 text-white" : "border border-gray-300 text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="flex-1">
                  <span className={s.done ? "text-gray-400 line-through" : "text-gray-800"}>{s.label}</span>
                  {s.time && <span className="text-xs text-gray-400 ml-1.5">· {s.time}</span>}
                  {s.hint && !s.done && <span className="block text-xs text-gray-500 mt-0.5">{s.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="px-4 pb-3">
            <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600">Hide forever</button>
          </div>
        </div>
      )}
    </div>
  );
}
