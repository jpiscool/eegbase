"use client";

import { useState, useRef, useEffect } from "react";

// Phase 33 — "Why did the AI say this?" popover. Wrap any AI-generated
// line with <ExplainAi sources={...}> and a tiny ⓘ icon appears next to
// it. Click → small native-feeling popover listing the source data points
// the AI drew on. No modal, no overlay; just a tooltip-sized card.
//
// Solves the "AI black box" objection that any clinician asks first.

interface ExplainAiProps {
  sources: { label: string; detail: string }[];
}

export function ExplainAi({ sources }: ExplainAiProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Why the AI said this"
        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 hover:bg-blue-100 text-[10px] font-semibold text-gray-500 hover:text-blue-700 transition-colors align-middle"
      >
        i
      </button>
      {open && (
        <div
          role="dialog"
          className="absolute z-30 left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-4"
        >
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Why the AI said this
          </p>
          <ul className="space-y-2">
            {sources.map((s, i) => (
              <li key={i} className="text-xs leading-relaxed">
                <span className="block font-semibold text-gray-900">{s.label}</span>
                <span className="block text-gray-600">{s.detail}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
            Every AI line is grounded in your data. Click ⓘ on any line to see what.
          </p>
        </div>
      )}
    </span>
  );
}
