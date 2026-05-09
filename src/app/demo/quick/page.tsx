"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// Phase 27 — 30-second autoplay demo, no signup, no role selection.
// Lowers visitor → demo conversion friction. The visitor lands here from
// a "See it in 30s" link on the homepage, watches a canned animation
// cycle through 5 frames (one per major feature), and ends on a primary
// CTA to the full /demo. No interaction required to see value.
//
// Architecture: 5 frames, 6 seconds each (== 30s total). Auto-advance
// via setTimeout; user can also click any frame indicator to skip
// ahead. Pause button lets a visitor freeze a frame they want to read.

interface Frame {
  eyebrow: string;
  title: string;
  body: string;
  visual: () => React.ReactNode;
}

const FRAMES: Frame[] = [
  {
    eyebrow: "1 of 5 · Live session",
    title: "A focus score that moves with the brain",
    body: "Aurora visual responds in real time to neurofeedback. No setup, no driver install — just open the app and pair the headset.",
    visual: () => (
      <div className="aspect-video rounded-2xl bg-slate-900 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(circle at 50% 60%, rgba(37,99,235,0.6) 0%, rgba(124,58,237,0.3) 35%, transparent 70%)",
            animation: "qd-pulse 4s ease-in-out infinite",
          }}
        />
        <div className="absolute top-4 left-4 text-blue-300 text-xs uppercase tracking-wider">Focus</div>
        <div className="absolute top-9 left-4 text-white text-5xl font-bold tabular-nums">82</div>
      </div>
    ),
  },
  {
    eyebrow: "2 of 5 · Notes",
    title: "Session note drafted for you",
    body: "The AI reads the session, drafts the note in your format. You read, fix, save. 60 seconds, not 15 minutes.",
    visual: () => (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Session note · draft</p>
        <p className="text-sm text-gray-800 leading-relaxed">
          Sarah completed a 28-minute Focus protocol with sustained engagement. Average reward score 78
          (+9 vs last session). Self-reported mood 7/10. Continue current protocol next visit.
        </p>
        <div className="flex gap-2 mt-4">
          <span className="px-2.5 py-1 bg-gray-100 text-xs font-medium rounded">Edit</span>
          <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded">Save</span>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "3 of 5 · Patient view",
    title: "Status of every patient at a glance",
    body: "One row per patient, plain-English status, sorted urgent-first. No checkboxes, no filters, one Open per row.",
    visual: () => (
      <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden text-left">
        {[
          { i: "DC", n: "Daniel Cruz", t: "9 days no session. May need a nudge.", c: "#EF4444" },
          { i: "JO", n: "James Okafor", t: "4 days without a check-in. Send one?", c: "#F59E0B" },
          { i: "SM", n: "Sarah Mitchell", t: "Trained today, score 78. On track.", c: "#10B981" },
        ].map((r) => (
          <li key={r.i} className="flex items-center gap-3 px-4 py-3">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
              {r.i}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-gray-900">{r.n}</span>
              <span className="block text-xs text-gray-500 inline-flex items-center gap-1.5">
                <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: r.c }} />
                {r.t}
              </span>
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    eyebrow: "4 of 5 · Trend",
    title: "Progress that's obvious at a glance",
    body: "Focus score over the last 12 sessions. +27 points improvement, no spreadsheet needed.",
    visual: () => (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Focus over time</p>
        <svg viewBox="0 0 320 80" className="w-full" aria-hidden>
          <defs>
            <linearGradient id="qd-trend" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <polyline
            points="0,72 26,68 53,62 80,58 106,52 133,46 160,40 186,34 213,28 240,22 266,16 320,8"
            fill="none"
            stroke="url(#qd-trend)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-xs text-emerald-600 mt-2 font-medium">↑ 27 point improvement over 12 sessions</p>
      </div>
    ),
  },
  {
    eyebrow: "5 of 5 · Free",
    title: "Free for licensed clinicians, forever",
    body: "Open source on GitHub. Self-host or use the hosted version. No per-seat pricing, no setup fee.",
    visual: () => (
      <div className="bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 rounded-2xl p-8 text-center">
        <p className="text-5xl font-bold text-blue-600 mb-2">Free</p>
        <p className="text-sm text-gray-700">For licensed clinicians</p>
        <p className="text-xs text-gray-500 mt-3">MIT license · self-host or hosted · no card required</p>
      </div>
    ),
  },
];

const FRAME_MS = 6000;

export default function QuickDemoPage() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => {
      setIdx((i) => (i + 1) % FRAMES.length);
    }, FRAME_MS);
    return () => clearTimeout(t);
  }, [idx, paused]);

  const frame = FRAMES[idx];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <style>{`
        @keyframes qd-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%      { transform: scale(1.05); opacity: 1; }
        }
        @keyframes qd-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      {/* Slim header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">EB</span>
            <span className="text-sm font-bold">EEGBase</span>
          </Link>
          <span className="text-xs text-gray-500">30-second tour</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Frame indicators + auto-progress bar */}
        <div className="flex items-center gap-1.5 mb-6">
          {FRAMES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setPaused(false); }}
              aria-label={`Frame ${i + 1}`}
              className="flex-1 h-1 rounded-full overflow-hidden bg-gray-200 cursor-pointer"
            >
              {i === idx && !paused ? (
                <span
                  className="block h-full bg-blue-600"
                  style={{ animation: `qd-progress ${FRAME_MS}ms linear forwards` }}
                />
              ) : i < idx ? (
                <span className="block h-full bg-blue-600 w-full" />
              ) : null}
            </button>
          ))}
        </div>

        {/* Frame */}
        <div key={idx}>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">{frame.eyebrow}</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 leading-tight">{frame.title}</h1>
          <p className="text-base text-gray-600 leading-relaxed mb-8 max-w-xl">{frame.body}</p>
          <div className="mb-10">{frame.visual()}</div>
        </div>

        {/* Controls + final CTA */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaused((p) => !p)}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {paused ? "Resume ▸" : "Pause ❚❚"}
            </button>
            {idx > 0 && (
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                ← Previous
              </button>
            )}
          </div>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Open the full live demo
            <span aria-hidden>→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
