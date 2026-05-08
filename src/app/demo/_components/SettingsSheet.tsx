"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "eegbase-demo-pref-";

type Pref = { id: string; label: string; hint: string; defaultOn: boolean };

const PREFS: Pref[] = [
  { id: "sound",         label: "Session sounds",        hint: "Soft chimes for start, end, and milestones",       defaultOn: true  },
  { id: "haptics",       label: "Haptic feedback",       hint: "Light buzz when you cross thresholds (mobile)",     defaultOn: true  },
  { id: "reduced-motion", label: "Reduced motion",       hint: "Subtle animations only — for vestibular comfort",   defaultOn: false },
  { id: "auto-pdf",      label: "Auto-save PDF after session", hint: "Drops a copy in your downloads folder",       defaultOn: false },
  { id: "weekly-email",  label: "Weekly summary email",  hint: "Sundays at 7 PM. Plain text, one click to unsubscribe.", defaultOn: true },
];

interface SettingsSheetProps {
  open: boolean;
  setOpen: (v: boolean) => void;
}

// Single opinionated settings screen. Five toggles, each with a one-line
// hint of what it actually does. No tabs, no categories, no "advanced"
// section. Per the research: 'Most settings exist because the team couldn't
// decide; pick the default.'
export function SettingsSheet({ open, setOpen }: SettingsSheetProps) {
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PREFS.forEach((p) => { initial[p.id] = p.defaultOn; });
    return initial;
  });
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const next: Record<string, boolean> = {};
      PREFS.forEach((p) => {
        const v = localStorage.getItem(STORAGE_PREFIX + p.id);
        next[p.id] = v == null ? p.defaultOn : v === "1";
      });
      setValues(next);
    } catch {}
  }, []);

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
    try { localStorage.setItem(STORAGE_PREFIX + id, next[id] ? "1" : "0"); } catch {}
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 outline-none"
      >
        <div className="px-6 pt-6 pb-2">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Settings</p>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Just the essentials</h2>
          <p className="text-sm text-gray-500 leading-relaxed">Five preferences. We picked the defaults so you don&rsquo;t have to.</p>
        </div>
        <ul className="px-6 py-3 divide-y divide-gray-100">
          {PREFS.map((p) => {
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
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
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
