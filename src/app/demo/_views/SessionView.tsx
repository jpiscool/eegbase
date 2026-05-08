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

export function SessionView({ clientId, onExit }: SessionViewProps) {
  const client: Client = CLIENTS.find((c) => c.id === clientId) ?? CLIENTS[0];

  const [phase, setPhase] = useState<"live" | "report">("live");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reward, setReward] = useState<number[]>([]);
  const [score, setScore] = useState(0);

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

  if (phase === "report") {
    return <SessionReport client={client} elapsed={elapsed} finalScore={score} onExit={onExit} />;
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

      {/* The one button */}
      <section className="text-center">
        <button
          onClick={() => setPaused((p) => !p)}
          className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </section>
    </main>
  );
}

// In-place morph: same screen, just different content.
function SessionReport({
  client,
  elapsed,
  finalScore,
  onExit,
}: {
  client: Client;
  elapsed: number;
  finalScore: number;
  onExit: () => void;
}) {
  const [sent, setSent] = useState(false);
  return (
    <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Session complete</p>
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Nice session.</h1>
      <p className="text-base text-gray-600 leading-relaxed mb-8">
        {client.name.split(" ")[0]} finished in {Math.round(elapsed / 60)} minutes. Here&rsquo;s the report — the AI already drafted the note.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Stat label="Focus score"     value={finalScore} />
        <Stat label="Session length"  value={Math.round(elapsed / 60)} suffix=" min" />
        <Stat label="Vs. last session" value={"+5"} />
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Session note (AI draft)</p>
        <p className="text-base text-gray-800 leading-relaxed">
          Steady session. Focus score reached the {finalScore >= 70 ? "target range" : "building range"} during the second half.
          Client engaged throughout; no reported side effects. Continue current protocol next visit.
        </p>
        <p className="text-xs text-gray-400 mt-4">You can edit before saving.</p>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSent(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {sent ? "Sent ✓" : "Send PDF to client"}
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
