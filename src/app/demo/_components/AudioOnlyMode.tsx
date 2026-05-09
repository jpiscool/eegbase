"use client";

import { useState, useEffect, useRef } from "react";

// Phase 34 — Audio-only training mode. Sits inside the SessionView as a
// toggle. When on, hides the visual feedback and plays a soft sine tone
// that pitches up as focus rises. For visually-overstimulated home users
// (autism, migraine, post-concussion). Differentiator vs Mendi's app
// which is visual-only.
//
// Uses Web Audio API (no media files required). Tone smoothly retunes
// based on the live focus score (0-100) → frequency 200-600 Hz.

interface AudioOnlyModeProps {
  score: number; // current focus score 0-100
}

export function AudioOnlyMode({ score }: AudioOnlyModeProps) {
  const [on, setOn] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && typeof window.AudioContext !== "undefined");
  }, []);

  useEffect(() => {
    if (!on) {
      // Cleanup
      try { oscRef.current?.stop(); } catch {}
      try { ctxRef.current?.close(); } catch {}
      oscRef.current = null;
      gainRef.current = null;
      ctxRef.current = null;
      return;
    }
    // Setup
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 300;
      gain.gain.value = 0.05; // soft, never loud
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      ctxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
    } catch {
      setOn(false);
    }
  }, [on]);

  // Retune tone smoothly when score changes.
  useEffect(() => {
    if (!on || !oscRef.current || !ctxRef.current) return;
    const target = 200 + Math.min(100, Math.max(0, score)) * 4; // 200-600 Hz
    oscRef.current.frequency.linearRampToValueAtTime(target, ctxRef.current.currentTime + 0.4);
  }, [on, score]);

  if (supported === false) return null;
  if (supported === null) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={() => setOn((v) => !v)}
        role="switch"
        aria-checked={on}
        aria-label={`Audio-only mode ${on ? "on" : "off"}`}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${on ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${on ? "left-[18px]" : "left-0.5"}`}
        />
      </button>
      <span className="text-xs text-gray-700 select-none">
        Audio-only <span className="text-gray-400">(eyes closed)</span>
      </span>
    </div>
  );
}
