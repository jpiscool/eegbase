"use client";

import { useState, useEffect } from "react";
import { CLIENTS } from "../_data/clients";
import { SARAH_SESSIONS } from "../_data/sessions";
import type { Role } from "../_components/RoleToggle";
import { HistoryChart } from "../_components/HistoryChart";
import { CheckIn } from "../_components/CheckIn";
import { InsightsList } from "../_components/InsightsList";
import { AchievementsRow } from "../_components/AchievementsRow";
import { ClinicianShareCard } from "../_components/ClinicianShareCard";
import { ClinicianWatchPanel } from "../_components/LiveCoFeedback";
import { AskWeekSheet } from "../_components/AskWeekSheet";
import { DiagnosticCard } from "../_components/DiagnosticCard";

interface PatientsViewProps {
  role: Role;
  initialClientId?: string;
  onStartSession: (clientId: string) => void;
}

export function PatientsView({ role, initialClientId, onStartSession }: PatientsViewProps) {
  // Home-user mode: skip the list — there's only one person (you), so render
  // the same detail layout but pinned to Sarah (illustrative profile).
  const isHome = role === "home";

  const [openClientId, setOpenClientId] = useState<string | null>(initialClientId ?? null);
  const [openSessionId, setOpenSessionId] = useState<number | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [sessionLive, setSessionLive] = useState(false);

  // Detect whether the patient is currently in a session by polling the
  // live-score key written by SessionView. Cheap; only the clinician panel
  // uses this signal.
  useEffect(() => {
    function check() {
      try { setSessionLive(localStorage.getItem("eegbase-demo-live-score") != null); } catch {}
    }
    check();
    const tick = setInterval(check, 1500);
    return () => clearInterval(tick);
  }, []);

  // Compute the displayed client at render time so role changes (which arrive
  // post-mount via localStorage hydration) immediately surface the right view.
  const openClient = isHome
    ? CLIENTS[0]
    : openClientId
      ? CLIENTS.find((c) => c.id === openClientId) ?? null
      : null;

  if (!isHome && !openClient) {
    return (
      <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Patients</h2>
        <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {CLIENTS.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setOpenClientId(c.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center flex-shrink-0">
                  {c.initials}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{c.name}</span>
                  <span className="block text-xs text-gray-500 truncate">{c.archetype} · {c.protocol}</span>
                </span>
                <span className="text-xs text-gray-400 tabular-nums">{c.sessionsCompleted} sessions</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  // Patient detail: header + reverse-chrono session list + sticky CTA.
  // Sessions data is Sarah's curve (illustrative) — same shape works for any patient in the demo.
  const sessions = SARAH_SESSIONS;
  const client = openClient!; // non-null in detail render path (list-mode early-return above guards this for clinician role; home mode initializes with a default)

  return (
    <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
      {/* Back to list — clinician only; home user has no list to return to */}
      {!isHome && (
        <button
          onClick={() => { setOpenClientId(null); setOpenSessionId(null); }}
          className="text-xs text-gray-500 hover:text-gray-900 mb-6 inline-flex items-center gap-1"
        >
          <span aria-hidden>←</span> All patients
        </button>
      )}

      {/* Header */}
      <header className="flex items-center gap-4 mb-2">
        <span className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-semibold text-lg flex items-center justify-center flex-shrink-0">
          {client.initials}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isHome ? "Your training" : client.name}</h1>
          <p className="text-sm text-gray-500">{isHome ? `${client.protocol} · ${client.device}` : `${client.archetype} · ${client.device}`}</p>
        </div>
      </header>
      <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6">
        <span className="font-semibold text-gray-900">{client.protocol}.</span> {client.protocolDescription}
      </p>

      {/* Cross-session trend — same primitive for clinician + home user */}
      <HistoryChart
        title={isHome ? "Your progress" : "Focus over the last 12 sessions"}
        scores={sessions.slice(0, 12).map((s) => s.focusScore).reverse()}
      />

      {/* Achievements — home-user only; gamification is patronizing in clinical UI */}
      {isHome && <AchievementsRow />}

      {/* Share-with-clinician toggle — home-user only; the bridge to Mendi-attached clinics */}
      {isHome && <ClinicianShareCard />}

      {/* AI-detected pattern insights with citations — both roles */}
      <InsightsList
        audience={isHome ? "home" : "clinician"}
        patientFirstName={client.name.split(" ")[0]}
      />

      {/* Ask AI about the week — both roles, real Claude Haiku call */}
      <button
        onClick={() => setAskOpen(true)}
        className="w-full text-left bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:border-blue-300 transition-colors flex items-center justify-between mb-3"
      >
        <span>
          <span className="block text-sm font-semibold text-gray-900">
            {isHome ? "Ask about your week" : `Ask about ${client.name.split(" ")[0]}\u2019s week`}
          </span>
          <span className="block text-xs text-gray-500 mt-0.5">Claude Haiku · grounded in last 4 sessions + patterns</span>
        </span>
        <span className="text-blue-600 text-sm font-semibold" aria-hidden>→</span>
      </button>

      {/* "Why isn't this working?" diagnostic — both roles */}
      <button
        onClick={() => setDiagnosticOpen(true)}
        className="w-full text-left bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:border-blue-300 transition-colors flex items-center justify-between mb-6"
      >
        <span>
          <span className="block text-sm font-semibold text-gray-900">
            {isHome ? "Why isn\u2019t this working yet?" : `Why isn\u2019t ${client.name.split(" ")[0]} responding yet?`}
          </span>
          <span className="block text-xs text-gray-500 mt-0.5">Honest read on dose · signal · consistency · sleep</span>
        </span>
        <span className="text-blue-600 text-sm font-semibold" aria-hidden>→</span>
      </button>

      {/* Send check-in — clinician only; the home-user version lives on Today */}
      {!isHome && (
        <button
          onClick={() => setCheckInOpen(true)}
          className="w-full text-left bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:border-blue-300 transition-colors flex items-center justify-between mb-6"
        >
          <span>
            <span className="block text-sm font-semibold text-gray-900">Send today&rsquo;s check-in</span>
            <span className="block text-xs text-gray-500 mt-0.5">Mood · focus · sleep — 3 questions, 30 seconds</span>
          </span>
          <span className="text-blue-600 text-sm font-semibold" aria-hidden>→</span>
        </button>
      )}

      {/* Watch live — clinician only; appears when the patient is currently in a session */}
      {!isHome && sessionLive && (
        <button
          onClick={() => setWatchOpen(true)}
          className="w-full text-left bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 hover:bg-emerald-100/60 transition-colors flex items-center justify-between mb-6"
        >
          <span>
            <span className="block text-sm font-semibold text-emerald-900 inline-flex items-center gap-2">
              <span className="relative w-2 h-2 rounded-full bg-emerald-500">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" aria-hidden />
              </span>
              {client.name.split(" ")[0]} is in session
            </span>
            <span className="block text-xs text-emerald-700/70 mt-0.5">Watch live and send notes</span>
          </span>
          <span className="text-emerald-700 text-sm font-semibold" aria-hidden>→</span>
        </button>
      )}

      {/* Sessions list */}
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sessions</h2>
      <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden mb-10">
        {sessions.map((s) => {
          const expanded = openSessionId === s.id;
          return (
            <li key={s.id}>
              <button
                onClick={() => setOpenSessionId(expanded ? null : s.id)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-sm text-gray-500 tabular-nums w-20">{s.date}</span>
                <span className="text-sm text-gray-700 flex-1">Focus score <span className="font-semibold text-gray-900 tabular-nums">{s.focusScore}</span></span>
                <span className="text-xs text-gray-400 tabular-nums">{s.durationMin} min</span>
                <span className="text-gray-400 text-sm" aria-hidden>{expanded ? "—" : "+"}</span>
              </button>
              {expanded && (
                <div className="px-5 pb-5 pt-1 bg-gray-50/50 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <Stat label="Focus"   value={s.focusScore} />
                    <Stat label="Mood"    value={s.moodScore}    sub="lower is better" />
                    <Stat label="Anxiety" value={s.anxietyScore} sub="lower is better" />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3 italic">&ldquo;{s.noteSummary}&rdquo;</p>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-300">Send PDF</button>
                    <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-300">Edit note</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Sticky CTA */}
      <div className="sticky bottom-6">
        <button
          onClick={() => onStartSession(client.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-4 text-base font-semibold shadow-lg transition-colors"
        >
          {isHome ? "Start training session →" : `Start new session for ${client.name.split(" ")[0]} →`}
        </button>
      </div>

      <CheckIn open={checkInOpen} setOpen={setCheckInOpen} mode="send" />
      <ClinicianWatchPanel open={watchOpen} setOpen={setWatchOpen} />
      <AskWeekSheet
        open={askOpen}
        setOpen={setAskOpen}
        audience={isHome ? "home" : "clinician"}
        patientFirstName={client.name.split(" ")[0]}
      />
      <DiagnosticCard open={diagnosticOpen} setOpen={setDiagnosticOpen} />
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
      <p className="text-[11px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}
