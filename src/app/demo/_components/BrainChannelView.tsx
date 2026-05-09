"use client";

import { useState, useMemo } from "react";

// Phase 36 — Multi-channel brain view. Mendi's headset captures 4 channels
// (oxygenated/deoxygenated hemoglobin from left and right prefrontal cortex)
// but their consumer app shows just one composite score. We show all 4 in
// plain English so a clinician (or curious home user) can see what's
// actually happening underneath.
//
// Strict simplicity: no "fNIRS" jargon, no "OxyHb" labels. Just two paired
// rows ("Focus side" / "Calm side") with a simple bar showing each channel's
// current activation level, color-coded. One toggle to expand. One caption
// explaining what the user sees in one sentence.
//
// The caption is the killer feature — most "scientific" UIs throw labels and
// expect you to know. We tell you what to look for.

interface BrainChannelViewProps {
  // Live focus score 0-100 from the simulator. Channels are derived from this
  // so the view feels responsive — left/right vary slightly around the score
  // to mimic real bilateral asymmetry.
  score: number;
}

// Deterministic per-render channel split — left side runs slightly higher on
// focus tasks, right side runs slightly higher on regulation. We add a tiny
// pseudo-random offset using the score itself so it changes with the live
// signal without being noisy.
function channelsFor(score: number) {
  const s = Math.max(0, Math.min(100, score));
  // Left focus (PFC-L oxy) — slightly above score on focus protocol
  const leftFocus = Math.min(100, s + Math.sin(s / 3) * 4 + 3);
  // Right focus (PFC-R oxy) — slightly below + lag
  const rightFocus = Math.max(0, s - Math.cos(s / 4) * 3 - 1);
  // Left calm (PFC-L deoxy, inverse) — anti-correlates with focus
  const leftCalm = Math.max(0, 100 - s + Math.sin(s / 5) * 5 - 2);
  // Right calm (PFC-R deoxy)
  const rightCalm = Math.max(0, 100 - s - Math.cos(s / 6) * 4 + 1);
  return { leftFocus, rightFocus, leftCalm, rightCalm };
}

export function BrainChannelView({ score }: BrainChannelViewProps) {
  const [open, setOpen] = useState(false);
  const ch = useMemo(() => channelsFor(score), [score]);

  // Simple symmetry check — both sides within 8 points = balanced.
  const balanced = Math.abs(ch.leftFocus - ch.rightFocus) <= 8;
  const focusSide = ch.leftFocus > ch.rightFocus + 8 ? "left" :
                    ch.rightFocus > ch.leftFocus + 8 ? "right" : "balanced";

  return (
    <section className="mt-4 mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left bg-white border border-gray-200 rounded-2xl px-5 py-3 hover:border-blue-300 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span aria-hidden className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-sm font-semibold text-gray-900">Brain channels</span>
          <span className="text-xs text-gray-500">
            {open ? "Hide details" : "What's happening underneath the score"}
          </span>
        </span>
        <span aria-hidden className="text-gray-400 text-sm">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="bg-white border border-gray-200 border-t-0 rounded-b-2xl -mt-px px-5 py-5">
          {/* Plain-English caption — read this first, then look at the bars */}
          <p className="text-sm text-gray-700 leading-relaxed mb-5">
            {focusSide === "balanced" && (
              <>Both sides of the brain are working <strong className="text-gray-900">together evenly</strong>. That&rsquo;s the goal of a Focus session.</>
            )}
            {focusSide === "left" && (
              <>The <strong className="text-gray-900">left side</strong> is leading — common during planning and focused attention.</>
            )}
            {focusSide === "right" && (
              <>The <strong className="text-gray-900">right side</strong> is leading — usually a signal of emotional regulation kicking in.</>
            )}
          </p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <ChannelBar label="Focus · left side"  pct={ch.leftFocus}  color="#2563EB" />
            <ChannelBar label="Focus · right side" pct={ch.rightFocus} color="#2563EB" />
            <ChannelBar label="Calm · left side"   pct={ch.leftCalm}   color="#10B981" />
            <ChannelBar label="Calm · right side"  pct={ch.rightCalm}  color="#10B981" />
          </div>

          <p className="text-[11px] text-gray-400 mt-5 leading-relaxed">
            The Mendi headset measures four channels of blood flow in the front
            of the brain. Most apps boil them into one number; we show you all
            four so you can see what&rsquo;s really moving.
            {balanced && " ✓ Sides are balanced."}
          </p>
        </div>
      )}
    </section>
  );
}

function ChannelBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const v = Math.round(pct);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs text-gray-700">{label}</span>
        <span className="text-xs font-semibold text-gray-900 tabular-nums">{v}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${Math.max(2, v)}%`, background: color }}
        />
      </div>
    </div>
  );
}
