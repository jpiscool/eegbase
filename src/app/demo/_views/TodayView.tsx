"use client";

import { useState } from "react";
import { TODAY_SCHEDULE, SPARKLINES, HOME_USER_NEXT, HOME_USER_STREAK, HOME_PRACTICE, DAILY_PROMPTS } from "../_data/sessions";
import { CLIENTS } from "../_data/clients";
import { Sparkline } from "../_components/Sparkline";
import { CheckIn } from "../_components/CheckIn";
import { DevicesCard } from "../_components/DevicesCard";
import { WearableSyncCard } from "../_components/WearableSyncCard";
import { SessionTypePicker } from "../_components/SessionTypePicker";
import { SleepImpactCard } from "../_components/SleepImpactCard";
import { OneThingCard } from "../_components/OneThingCard";
import type { Role } from "../_components/RoleToggle";
import type { SessionType } from "../_data/session-types";

interface TodayViewProps {
  role: Role;
  onStartSession: (clientId: string, type?: SessionType, minutes?: number) => void;
  onOpenPatient: (clientId: string) => void;
}

export function TodayView({ role, onStartSession, onOpenPatient }: TodayViewProps) {
  if (role === "home") return <HomeUserToday onStartSession={onStartSession} />;
  return <ClinicianToday onStartSession={onStartSession} onOpenPatient={onOpenPatient} />;
}

// ── Clinician view ─────────────────────────────────────────────────────────
function ClinicianToday({
  onStartSession,
  onOpenPatient,
}: {
  onStartSession: (clientId: string) => void;
  onOpenPatient: (clientId: string) => void;
}) {
  const next = TODAY_SCHEDULE.find((a) => a.status === "Now") ?? TODAY_SCHEDULE.find((a) => a.status === "Upcoming");
  const stats = [
    { label: "Sessions this week", value: 12, sub: "↗ up 2 vs last week", series: SPARKLINES.sessionsThisWeek },
    { label: "Avg session length", value: 28, sub: "minutes",             series: SPARKLINES.avgSessionMin, suffix: " min" },
    { label: "Reports pending",    value: 1,  sub: "Sarah Mitchell",      series: SPARKLINES.reportsPending },
  ];

  return (
    <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="sr-only">Today</h1>
      {next && (
        <section className="mb-12">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Next up</p>
          <button
            onClick={() => onStartSession(next.clientId)}
            className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-7 transition-colors shadow-sm"
          >
            <p className="text-blue-100 text-sm font-medium mb-1">{next.time} · {next.clientName}</p>
            <p className="text-2xl md:text-3xl font-bold tracking-tight">
              Start session <span aria-hidden>→</span>
            </p>
          </button>
        </section>
      )}

      {/* Home practice — at-a-glance adherence for the 5 demo patients */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Home practice</h2>
          <p className="text-xs text-gray-400">Last home session per patient</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="grid grid-cols-5 gap-3">
            {HOME_PRACTICE.map((hp) => {
              const c = CLIENTS.find((x) => x.id === hp.clientId);
              if (!c) return null;
              const color =
                hp.daysSince <= 2 ? "#10B981" :
                hp.daysSince <= 7 ? "#F59E0B" :
                                    "#EF4444";
              const label =
                hp.daysSince === 0 ? "today" :
                hp.daysSince === 1 ? "1 day"  :
                                    `${hp.daysSince}d`;
              return (
                <button
                  key={hp.clientId}
                  onClick={() => onOpenPatient(hp.clientId)}
                  className="text-center group"
                  aria-label={`${c.name} \u00b7 last home session ${label}`}
                >
                  <span className="block w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-300 transition-all">
                    {c.initials}
                  </span>
                  <span className="block w-2 h-2 mx-auto mt-2 rounded-full" style={{ background: color }} aria-hidden />
                  <span className="block text-[10px] text-gray-500 mt-1 tabular-nums">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Today</h2>
        <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {TODAY_SCHEDULE.map((a) => {
            const pillClass =
              a.status === "Done" ? "bg-gray-100 text-gray-500" :
              a.status === "Now"  ? "bg-emerald-100 text-emerald-700" :
                                    "bg-blue-50 text-blue-700";
            return (
              <li key={a.time + a.clientId}>
                <button
                  onClick={() => onOpenPatient(a.clientId)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900 tabular-nums w-20">{a.time}</span>
                    <span className="text-sm text-gray-700">{a.clientName}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pillClass}`}>{a.status}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <DevicesCard />
      <WearableSyncCard />

      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">This week</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-500 mb-1.5">{s.label}</p>
              <div className="flex items-end justify-between gap-3">
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{s.value}{s.suffix ?? ""}</p>
                <Sparkline data={s.series} />
              </div>
              <p className="text-xs text-gray-500 mt-2">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// ── Home-user view ─────────────────────────────────────────────────────────
function HomeUserToday({ onStartSession }: { onStartSession: (clientId: string, type?: SessionType, minutes?: number) => void }) {
  // Pick a stable daily prompt based on day-of-year so a user sees the same
  // line all day but a different one each day.
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const prompt = DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  const trainedDays = HOME_USER_STREAK.filter((d) => d.trained).length;
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="sr-only">Today</h1>
      {/* Primary action — your next training (opens the type picker) */}
      <section className="mb-12">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your next training</p>
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-7 transition-colors shadow-sm"
        >
          <p className="text-blue-100 text-sm font-medium mb-1">{HOME_USER_NEXT.time} · {HOME_USER_NEXT.protocol} · {HOME_USER_NEXT.durationMin} min</p>
          <p className="text-2xl md:text-3xl font-bold tracking-tight">
            Start now <span aria-hidden>→</span>
          </p>
        </button>
      </section>

      {/* Streak — last 7 days */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">This week</h2>
          <p className="text-xs text-gray-500"><span className="font-semibold text-gray-900 tabular-nums">{trainedDays}</span> of 7 days</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="grid grid-cols-7 gap-2">
            {HOME_USER_STREAK.map((d, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{d.day}</p>
                <div
                  aria-label={d.trained ? `Trained on ${d.day}` : `No session on ${d.day}`}
                  className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums ${
                    d.trained
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {d.trained ? "✓" : d.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Today's one thing — single rule-based suggestion. Sits right under the
          streak so it's the next thing the user reads after seeing where they are. */}
      <OneThingCard
        onStartSession={() => setPickerOpen(true)}
        onOpenCheckIn={() => setCheckInOpen(true)}
      />

      <DevicesCard />
      <WearableSyncCard />

      {/* Sleep impact — only on the home-user Today */}
      <SleepImpactCard />

      {/* Quick check-in — 30s, three sliders */}
      <section className="mb-12">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How are you today?</p>
        <button
          onClick={() => setCheckInOpen(true)}
          className="w-full text-left bg-white border border-gray-200 rounded-2xl px-6 py-5 hover:border-blue-300 transition-colors flex items-center justify-between"
        >
          <span>
            <span className="block text-base font-semibold text-gray-900">Quick check-in</span>
            <span className="block text-xs text-gray-500 mt-0.5">Mood · focus · sleep · 30 seconds</span>
          </span>
          <span className="text-blue-600 text-sm font-semibold" aria-hidden>+</span>
        </button>
      </section>

      {/* One short daily prompt — never pushy */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">A thought for today</p>
        <p className="bg-white border border-gray-200 rounded-2xl p-7 text-base text-gray-800 leading-relaxed">
          {prompt}
        </p>
      </section>

      <CheckIn open={checkInOpen} setOpen={setCheckInOpen} mode="self" />
      <SessionTypePicker
        open={pickerOpen}
        setOpen={setPickerOpen}
        onPick={(t, mins) => onStartSession("sarah", t, mins)}
      />
    </main>
  );
}
