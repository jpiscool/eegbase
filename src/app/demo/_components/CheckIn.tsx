"use client";

import { useState, useEffect, useRef } from "react";

// 3-question check-in modal: mood (1–10), focus (1–10), sleep (hours).
// Same primitive serves clinician (sends to client) and home user (logs themselves).
// Stored in component state for the demo; the real app routes hit /clients/[id]/outcomes.

interface CheckInProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  // Caller decides what 'submit' means — for home user it logs locally,
  // for clinician it simulates sending the form to the patient.
  mode: "self" | "send";
  onSubmit?: (answers: { mood: number; focus: number; sleepHours: number }) => void;
}

export function CheckIn({ open, setOpen, mode, onSubmit }: CheckInProps) {
  const [mood, setMood] = useState(7);
  const [focus, setFocus] = useState(6);
  const [sleepHours, setSleepHours] = useState(7);
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset on open.
  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setMood(7);
      setFocus(6);
      setSleepHours(7);
      setTimeout(() => dialogRef.current?.focus(), 10);
    }
  }, [open]);

  // Esc closes.
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

  function submit() {
    onSubmit?.({ mood, focus, sleepHours });
    setSubmitted(true);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick check-in"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 outline-none"
      >
        {!submitted ? (
          <>
            <div className="px-6 pt-6 pb-2">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                {mode === "self" ? "Quick check-in" : "Send check-in"}
              </p>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">
                {mode === "self" ? "How are you today?" : "Send Sarah today's check-in"}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {mode === "self"
                  ? "Three quick questions. Takes about 30 seconds."
                  : "She'll get a text with a link. The score lands here automatically."}
              </p>
            </div>
            <div className="px-6 py-4 space-y-5">
              <Slider label="Mood" min={1} max={10} value={mood} onChange={setMood} hint="1 low · 10 great" />
              <Slider label="Focus" min={1} max={10} value={focus} onChange={setFocus} hint="1 scattered · 10 sharp" />
              <Slider label="Sleep last night" min={0} max={12} step={0.5} value={sleepHours} onChange={setSleepHours} hint="hours" />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {mode === "self" ? "Save" : "Send"}
              </button>
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
              {mode === "self" ? "Logged." : "Sent."}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs mx-auto">
              {mode === "self"
                ? "It'll show up in your trend chart next time you open it."
                : "Sarah will get a text now. Her answers will appear here automatically."}
            </p>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-700 hover:text-gray-900 font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  hint,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-semibold text-gray-900">{label}</label>
        <span className="text-base font-bold tabular-nums text-blue-600">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
        aria-label={label}
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
