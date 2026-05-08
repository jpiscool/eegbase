"use client";

import { useEffect, useRef, useState } from "react";
import { LiveChart } from "@/components/LiveChart";
import { SimulatorAdapter } from "@/lib/device/simulator";
import type { DeviceSample } from "@/lib/device/adapter";
import { CLIENTS, type Client } from "../_data/clients";

interface SessionViewProps {
  clientId: string;
  onExit: () => void;
}

const SESSION_TARGET_SECONDS = 1200; // 20 minutes — short demo session
const STEP_BREAKDOWN = [
  { label: "Eyes open · settle in",     untilSec:  120 },
  { label: "Baseline · resting state",  untilSec:  300 },
  { label: "Focus training · phase 1",  untilSec:  720 },
  { label: "Focus training · phase 2",  untilSec: 1080 },
  { label: "Wind down · save session",  untilSec: 1200 },
];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const fmtMmSs = fmt;

export function SessionView({ clientId, onExit }: SessionViewProps) {
  const client: Client = CLIENTS.find((c) => c.id === clientId) ?? CLIENTS[0];

  const [phase, setPhase] = useState<"live" | "report">("live");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reward, setReward] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [marks, setMarks] = useState<{ atSec: number; label?: string }[]>([]);
  const [markFlash, setMarkFlash] = useState(false);
  const [journal, setJournal] = useState("");

  const adapterRef = useRef<SimulatorAdapter | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set up the simulator + tick clock when entering the live phase.
  useEffect(() => {
    if (phase !== "live") return;
    const adapter = new SimulatorAdapter({ noiseLevel: 0.3, trendStrength: 0.7 });
    adapterRef.current = adapter;
    const unsub = adapter.onSample((s: DeviceSample) => {
      // rewardScore is 0–100 from the simulator; LiveChart wants normalized 0–1.
      const raw = s.rewardScore ?? 0;
      setScore(Math.round(raw));
      setReward((prev) => {
        const next = [...prev, Math.max(0, Math.min(1, raw / 100))];
        return next.length > 80 ? next.slice(-80) : next;
      });
    });
    adapter.connect();

    tickRef.current = setInterval(() => {
      if (!paused) {
        setElapsed((e) => {
          const next = e + 1;
          if (next >= SESSION_TARGET_SECONDS) {
            setPhase("report");
            return SESSION_TARGET_SECONDS;
          }
          return next;
        });
      }
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      unsub();
      adapter.disconnect();
    };
  }, [phase, paused]);

  // Determine the current step based on elapsed time.
  const step = STEP_BREAKDOWN.find((s) => elapsed < s.untilSec) ?? STEP_BREAKDOWN[STEP_BREAKDOWN.length - 1];
  const stepRemainingSec = step.untilSec - elapsed;

  const accent =
    score >= 70 ? "#10B981" :
    score >= 40 ? "#F59E0B" :
                  "#94A3B8";

  function markMoment() {
    setMarks((prev) => [...prev, { atSec: elapsed }]);
    setMarkFlash(true);
    setTimeout(() => setMarkFlash(false), 1200);
  }

  if (phase === "report") {
    return (
      <SessionReport
        client={client}
        elapsed={elapsed}
        finalScore={score}
        trace={reward}
        marks={marks}
        setMarks={setMarks}
        journal={journal}
        setJournal={setJournal}
        onExit={onExit}
      />
    );
  }

  return (
    <main id="main-content" className="max-w-3xl mx-auto px-6 py-10">
      {/* Patient + protocol — one line, no chrome */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
            {client.initials}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
            <p className="text-xs text-gray-500 truncate">{client.protocol} · session {client.sessionsCompleted + 1}</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="text-xs text-gray-500 hover:text-gray-900"
          aria-label="Exit session"
        >
          End session
        </button>
      </header>

      {/* Big score */}
      <section className="text-center mb-8">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Focus score</p>
        <p className="text-7xl md:text-8xl font-extrabold tabular-nums tracking-tight" style={{ color: accent }}>
          {score}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {score >= 70 ? "On target" : score >= 40 ? "Building up" : "Settling in"}
        </p>
      </section>

      {/* Live signal trace */}
      <section className="mb-8">
        <div className="rounded-2xl overflow-hidden border border-gray-200">
          <LiveChart data={reward} color={accent} label="Focus" height={140} />
        </div>
      </section>

      {/* Step + timer */}
      <section className="text-center mb-8">
        <p className="text-base text-gray-700">
          <span className="font-semibold">{step.label}</span>
          <span className="text-gray-400"> · {fmt(stepRemainingSec)} remaining</span>
        </p>
        <div className="mt-3 h-1 rounded-full bg-gray-100 overflow-hidden max-w-md mx-auto">
          <div
            className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
            style={{ width: `${(elapsed / SESSION_TARGET_SECONDS) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 tabular-nums">{fmt(elapsed)} / {fmt(SESSION_TARGET_SECONDS)}</p>
      </section>

      {/* The one button — plus a small Mark moment affordance */}
      <section className="text-center">
        <div className="inline-flex items-center gap-3">
          <button
            onClick={() => setPaused((p) => !p)}
            className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={markMoment}
            className="px-5 py-3 bg-white border border-gray-200 hover:border-blue-300 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            aria-label="Mark this moment"
          >
            {markFlash ? "Marked ✓" : "Mark moment"}
          </button>
        </div>
        {marks.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 tabular-nums">
            {marks.length} mark{marks.length !== 1 ? "s" : ""} this session
          </p>
        )}
      </section>
    </main>
  );
}

// In-place morph: same screen, just different content.
function SessionReport({
  client,
  elapsed,
  finalScore,
  trace,
  marks,
  setMarks,
  journal,
  setJournal,
  onExit,
}: {
  client: Client;
  elapsed: number;
  finalScore: number;
  trace: number[];
  marks: { atSec: number; label?: string }[];
  setMarks: (m: { atSec: number; label?: string }[]) => void;
  journal: string;
  setJournal: (v: string) => void;
  onExit: () => void;
}) {
  const [shareCopied, setShareCopied] = useState(false);
  const printedAt = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const accent =
    finalScore >= 70 ? "#10B981" :
    finalScore >= 40 ? "#F59E0B" :
                       "#94A3B8";

  function downloadPdf() {
    // Native browser print → user picks "Save as PDF" in the print dialog.
    // No PDF library, no extra dep, looks clinical when the print stylesheet
    // hides the demo chrome.
    if (typeof window !== "undefined") window.print();
  }
  function copyShareLink() {
    const link = `${window.location.origin}/share/demo-${Date.now().toString(36)}`;
    try {
      navigator.clipboard?.writeText(link);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {}
  }

  return (
    <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
      {/* Print-only header — appears in PDF, hidden on screen */}
      <div className="hidden print:block mb-8 pb-4 border-b border-gray-300">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">EEGBase · Session report</p>
        <p className="text-sm text-gray-700 mt-1 tabular-nums">{printedAt}</p>
      </div>

      {/* Screen-only intro — hidden in PDF */}
      <div className="print:hidden">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Session complete</p>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Nice session.</h1>
        <p className="text-base text-gray-600 leading-relaxed mb-8">
          {client.name.split(" ")[0]} finished in {Math.round(elapsed / 60)} minutes. Here&rsquo;s the report — the AI already drafted the note.
        </p>
      </div>

      {/* Patient + protocol — visible on screen and in PDF */}
      <div className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
          {client.initials}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
          <p className="text-xs text-gray-500 truncate">{client.protocol} · session {client.sessionsCompleted + 1}</p>
        </div>
      </div>

      {/* Stats — included in PDF */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Focus score"     value={finalScore} />
        <Stat label="Session length"  value={Math.round(elapsed / 60)} suffix=" min" />
        <Stat label="Vs. last session" value={"+5"} />
      </div>

      {/* Trace — included in PDF */}
      {trace.length > 1 && (
        <section className="mb-6">
          <div className="rounded-xl overflow-hidden border border-gray-200 p-3 bg-white">
            <LiveChart data={trace} color={accent} label="Focus over time" height={120} />
          </div>
        </section>
      )}

      {/* Marked moments — editable inline; included in PDF */}
      {marks.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Marked moments</p>
          <ul className="space-y-2">
            {marks.map((m, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="text-xs font-mono text-gray-500 tabular-nums w-12 flex-shrink-0">{fmtMmSs(m.atSec)}</span>
                <input
                  type="text"
                  defaultValue={m.label ?? ""}
                  placeholder="Add a note\u2026"
                  onBlur={(e) => {
                    const next = [...marks];
                    next[i] = { ...m, label: e.target.value || undefined };
                    setMarks(next);
                  }}
                  className="flex-1 min-w-0 bg-transparent text-gray-800 placeholder-gray-400 outline-none border-b border-transparent focus:border-blue-300 transition-colors"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* AI-drafted note — included in PDF */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Session note (AI draft)</p>
        <p className="text-base text-gray-800 leading-relaxed">
          Steady session. Focus score reached the {finalScore >= 70 ? "target range" : "building range"} during the second half.
          Client engaged throughout; no reported side effects. Continue current protocol next visit.
        </p>
        <p className="text-xs text-gray-400 mt-4 print:hidden">You can edit before saving.</p>
      </section>

      {/* Free-text journal — screen only by default; user-controlled */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 print:hidden">
        <label htmlFor="journal" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          How did this session feel?
        </label>
        <textarea
          id="journal"
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder="One sentence is plenty. This stays with you."
          rows={3}
          className="w-full text-base text-gray-800 placeholder-gray-400 bg-transparent outline-none resize-none leading-relaxed"
        />
      </section>

      {/* Print-only signature line */}
      <div className="hidden print:block mt-12 pt-6 border-t border-gray-300 text-xs text-gray-500">
        <p>Clinician signature: ____________________________</p>
        <p className="mt-4">Generated by EEGBase · eegbase.com</p>
      </div>

      {/* Action buttons — hidden in PDF */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <button
          onClick={downloadPdf}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Download PDF
        </button>
        <button
          onClick={copyShareLink}
          className="px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-colors"
        >
          {shareCopied ? "Link copied ✓" : "Copy share link"}
        </button>
        <button className="px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-colors">
          Edit note
        </button>
        <button onClick={onExit} className="px-5 py-2.5 text-gray-500 hover:text-gray-900 text-sm">
          Done
        </button>
      </div>
    </main>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
      <p className="text-[11px] text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}{suffix ?? ""}</p>
    </div>
  );
}
