"use client";

import { useState, useEffect } from "react";
import { SESSION_TYPES, type SessionType } from "../_data/session-types";

interface SessionTypePickerProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  onPick: (type: SessionType, minutes: number) => void;
}

// One-screen picker: 4 types as cards, then duration as a row of preset pills
// once a type is selected. No multi-step wizard, no "Next/Back" — the screen
// reveals more in place.

export function SessionTypePicker({ open, setOpen, onPick }: SessionTypePickerProps) {
  const [selected, setSelected] = useState<SessionType | null>(null);
  const [minutes, setMinutes] = useState(12);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setMinutes(12);
    }
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

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose a session"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
      >
        <div className="px-6 pt-6 pb-2">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Choose a session</p>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">
            {selected ? `${selected.name} \u2014 how long?` : "What kind of session?"}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {selected ? selected.purpose : "Pick what you want from this session. You can switch any time."}
          </p>
        </div>

        <div className="px-6 py-4">
          {!selected ? (
            <ul className="space-y-2">
              {SESSION_TYPES.map((t) => {
                // Sleep type gets a bedtime hint computed from Oura sleep average
                // (8h 04m typical bedtime → 30-min wind-down → start ~8:42 PM).
                const isSleep = t.id === "sleep";
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => { setSelected(t); setMinutes(t.defaultMin); }}
                      className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: `${t.accent}1A` }}
                        aria-hidden
                      >
                        {t.emoji}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-gray-900">{t.name}</span>
                        <span className="block text-xs text-gray-500 truncate">{t.purpose}</span>
                        {isSleep && (
                          <span className="block text-[11px] text-blue-600 mt-0.5 font-medium">
                            Recommended bedtime: 8:42 PM tonight
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">{t.defaultMin} min</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div>
              <div className="flex gap-2 mb-4">
                {selected.presets.map((m) => {
                  const active = minutes === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setMinutes(m)}
                      className={`flex-1 px-3 py-3 rounded-xl text-sm font-semibold transition-colors tabular-nums ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                      aria-pressed={active}
                    >
                      {m} min
                    </button>
                  );
                })}
              </div>
              <label className="block text-xs text-gray-500 mb-2">Or set a custom length</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={45}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="flex-1 accent-blue-600"
                  aria-label="Session length in minutes"
                />
                <span className="text-base font-bold tabular-nums text-blue-600 w-16 text-right">{minutes} min</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {selected ? (
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              ← Back
            </button>
          ) : (
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Cancel
            </button>
          )}
          {selected && (
            <button
              onClick={() => { onPick(selected, minutes); setOpen(false); }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Start {minutes}-min {selected.name.toLowerCase()} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
