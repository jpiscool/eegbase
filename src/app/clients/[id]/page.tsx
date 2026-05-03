import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, assignments, protocols } from "@/lib/db/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, MessageSquare, ClipboardList, FileText, Download } from "lucide-react";
import { AssignProtocolModal } from "@/components/AssignProtocolModal";
import { TrendChart } from "@/components/TrendChart";
import { SessionMetricTrend } from "@/components/SessionMetricChart";
import { EditClientModal } from "@/components/EditClientModal";
import { ToggleClientActiveButton } from "@/components/ToggleClientActiveButton";
import { SessionHeatmap } from "@/components/SessionHeatmap";
import { ClientProgressPanel } from "@/components/ClientProgressPanel";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.clinicId, clinicId)))
    .limit(1);

  if (!client) notFound();

  const [sessionList, activeAssignment, protocolList, avgReward, totalSessionsRow] = await Promise.all([
    db
      .select({
        id: sessions.id,
        startedAt: sessions.startedAt,
        durationSeconds: sessions.durationSeconds,
        avgRewardScore: sessions.avgRewardScore,
        deviceType: sessions.deviceType,
        preFocus: sessions.preFocus,
        postFocus: sessions.postFocus,
        preMood: sessions.preMood,
        postMood: sessions.postMood,
        preAnxiety: sessions.preAnxiety,
        postAnxiety: sessions.postAnxiety,
        preEnergy: sessions.preEnergy,
        postEnergy: sessions.postEnergy,
      })
      .from(sessions)
      .where(eq(sessions.clientId, id))
      .orderBy(desc(sessions.startedAt))
      .limit(50),
    db
      .select({ protocol: protocols })
      .from(assignments)
      .innerJoin(protocols, eq(assignments.protocolId, protocols.id))
      .where(and(eq(assignments.clientId, id), eq(assignments.active, true)))
      .limit(1),
    db
      .select({ id: protocols.id, name: protocols.name, deviceType: protocols.deviceType })
      .from(protocols)
      .where(eq(protocols.clinicId, clinicId))
      .orderBy(protocols.name),
    db
      .select({ avg: avg(sessions.avgRewardScore) })
      .from(sessions)
      .where(eq(sessions.clientId, id)),
    db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.clientId, id)),
  ]);

  const assignedProtocol = activeAssignment[0]?.protocol ?? null;
  const overallAvg = avgReward[0]?.avg ? Number(avgReward[0].avg).toFixed(1) : null;
  const totalSessions = Number(totalSessionsRow[0]?.count ?? 0);

  // Attendance stats
  const now = new Date();
  const lastSessionDays =
    sessionList.length > 0
      ? Math.floor((now.getTime() - new Date(sessionList[0].startedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

  // Weekly streak: count consecutive calendar weeks (Mon-start) ending at the current week that have ≥1 session
  function isoWeek(d: Date) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return { year: t.getUTCFullYear(), week: Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7) };
  }
  const weeksWithSessions = new Set(
    sessionList.map((s) => {
      const w = isoWeek(new Date(s.startedAt));
      return `${w.year}-${w.week}`;
    })
  );
  let streak = 0;
  const baseWeek = isoWeek(now);
  for (let i = 0; i < 52; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const w = isoWeek(d);
    if (weeksWithSessions.has(`${w.year}-${w.week}`)) {
      streak++;
    } else {
      break;
    }
  }
  // Avg sessions per week over last 8 weeks
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const recentSessions = sessionList.filter((s) => new Date(s.startedAt) >= eightWeeksAgo);
  const avgPerWeek = recentSessions.length > 0 ? (recentSessions.length / 8).toFixed(1) : null;

  // Build trend data for chart (oldest → newest, max 30 sessions)
  const trendData = [...sessionList]
    .reverse()
    .slice(-30)
    .map((s) => ({ score: s.avgRewardScore ?? null, date: s.startedAt }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/clients"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <EditClientModal
              client={{
                id: client.id,
                name: client.name,
                email: client.email ?? null,
                notes: client.notes ?? null,
                goals: client.goals ?? null,
                dateOfBirth: client.dateOfBirth ?? null,
              }}
            />
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-3">
            <span>
              {client.email ?? "No email"} · Added {new Date(client.createdAt).toLocaleDateString()}
              {client.dateOfBirth && (() => {
                const dob = new Date(client.dateOfBirth!);
                const ageDiff = Date.now() - dob.getTime();
                const age = Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
                return ` · Age ${age}`;
              })()}
            </span>
            {!client.active && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 rounded-full border border-red-100">
                Inactive
              </span>
            )}
          </p>
          <div className="mt-1">
            <ToggleClientActiveButton clientId={client.id} active={client.active} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/clients/${id}/export`}
            download
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={15} />
            Export CSV
          </a>
          <Link
            href={`/clients/${id}/report`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText size={15} />
            Print Report
          </Link>
          <Link
            href={`/clients/${id}/checkins`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ClipboardList size={15} />
            Check-Ins
          </Link>
          <Link
            href={`/clients/${id}/messages`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare size={15} />
            Messages
          </Link>
          <Link
            href={`/sessions/live?clientId=${id}${assignedProtocol ? `&protocolId=${assignedProtocol.id}` : ""}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play size={15} />
            Start Session
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Stats row */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Sessions</p>
          <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Avg Reward Score</p>
          <p className="text-3xl font-bold text-gray-900">{overallAvg ?? "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Weekly Streak</p>
          <p className="text-3xl font-bold text-gray-900">
            {streak > 0 ? streak : "—"}
            {streak > 0 && <span className="text-base font-normal text-gray-400 ml-1">wks</span>}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Avg / Week</p>
          <p className="text-3xl font-bold text-gray-900">
            {avgPerWeek ?? "—"}
            {avgPerWeek && <span className="text-base font-normal text-gray-400 ml-1">sess</span>}
          </p>
          {avgPerWeek && <p className="text-xs text-gray-400 mt-0.5">last 8 weeks</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Last Session</p>
          <p className="text-3xl font-bold text-gray-900">
            {lastSessionDays === null ? "—" : lastSessionDays === 0 ? "Today" : lastSessionDays === 1 ? "1" : lastSessionDays}
            {lastSessionDays != null && lastSessionDays > 1 && (
              <span className="text-base font-normal text-gray-400 ml-1">d ago</span>
            )}
          </p>
        </div>
      </div>

      {/* Assigned Protocol (separated from stat grid) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-0.5">Assigned Protocol</p>
          <p className="text-base font-semibold text-gray-900">{assignedProtocol?.name ?? "None assigned"}</p>
        </div>
        <AssignProtocolModal
          clientId={id}
          protocols={protocolList}
          currentProtocolId={assignedProtocol?.id ?? null}
        />
      </div>

      {/* Trend chart */}
      {trendData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Reward Score Trend · Last {trendData.length} sessions
          </h2>
          <TrendChart data={trendData} />
        </div>
      )}

      {/* Session attendance heatmap */}
      {sessionList.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Session Attendance · Last 16 weeks
          </h2>
          <SessionHeatmap sessionDates={sessionList.map((s) => new Date(s.startedAt))} />
        </div>
      )}

      {/* Pre/Post metric trend charts */}
      {sessionList.some((s) => s.preFocus != null || s.postFocus != null || s.preMood != null || s.preAnxiety != null) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Symptom Tracking · Pre vs Post Session
          </h2>
          <SessionMetricTrend
            sessions={sessionList.map((s) => ({
              date: new Date(s.startedAt),
              preFocus: s.preFocus ?? null,
              postFocus: s.postFocus ?? null,
              preMood: s.preMood ?? null,
              postMood: s.postMood ?? null,
              preAnxiety: s.preAnxiety ?? null,
              postAnxiety: s.postAnxiety ?? null,
              preEnergy: s.preEnergy ?? null,
              postEnergy: s.postEnergy ?? null,
            }))}
          />
        </div>
      )}

      {/* AI progress summary */}
      <ClientProgressPanel
        clientId={id}
        initialSummary={client.aiSummary ?? null}
        initialUpdatedAt={client.aiSummaryUpdatedAt ?? null}
      />

      {/* Session history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Session History</h2>
        </div>
        {sessionList.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No sessions yet.{" "}
            <Link href={`/sessions/live?clientId=${id}`} className="text-blue-600 hover:underline">
              Start the first session.
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Duration</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Avg Reward</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Device</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Pre→Post Focus</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessionList.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 text-gray-900 font-medium">
                    {new Date(s.startedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500">
                    {s.durationSeconds != null
                      ? `${Math.floor(s.durationSeconds / 60)}m ${s.durationSeconds % 60}s`
                      : "—"}
                  </td>
                  <td className="px-6 py-3.5">
                    {s.avgRewardScore != null ? (
                      <span
                        className={`font-semibold ${
                          s.avgRewardScore >= 70
                            ? "text-emerald-600"
                            : s.avgRewardScore >= 40
                            ? "text-amber-600"
                            : "text-red-500"
                        }`}
                      >
                        {s.avgRewardScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500 capitalize">{s.deviceType}</td>
                  <td className="px-6 py-3.5 text-gray-500">
                    {s.preFocus != null && s.postFocus != null ? (
                      <span>
                        {s.preFocus} →{" "}
                        <span
                          className={s.postFocus > s.preFocus ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}
                        >
                          {s.postFocus}
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link href={`/sessions/${s.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Goals + Notes */}
      {(client.goals || client.notes) && (
        <div className="mt-5 flex flex-col gap-3">
          {client.goals && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                Training Goals
              </p>
              <p className="text-sm text-gray-700">{client.goals}</p>
            </div>
          )}
          {client.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-6 py-4">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                Clinical Notes
              </p>
              <p className="text-sm text-gray-700">{client.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
