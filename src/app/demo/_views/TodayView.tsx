"use client";

import { TODAY_SCHEDULE, SPARKLINES, HOME_USER_NEXT, HOME_USER_STREAK, DAILY_PROMPTS } from "../_data/sessions";
import { Sparkline } from "../_components/Sparkline";
import type { Role } from "../_components/RoleToggle";

interface TodayViewProps {
  role: Role;
  onStartSession: (clientId: string) => void;
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
function HomeUserToday({ onStartSession }: { onStartSession: (clientId: string) => void }) {
  // Pick a stable daily prompt based on day-of-year so a user sees the same
  // line all day but a different one each day.
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const prompt = DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  const trainedDays = HOME_USER_STREAK.filter((d) => d.trained).length;

  return (
    <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
      {/* Primary action — your next training */}
      <section className="mb-12">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your next training</p>
        <button
          onClick={() => onStartSession("sarah")}
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

      {/* One short daily prompt — never pushy */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">A thought for today</p>
        <p className="bg-white border border-gray-200 rounded-2xl p-7 text-base text-gray-800 leading-relaxed">
          {prompt}
        </p>
      </section>
    </main>
  );
}
