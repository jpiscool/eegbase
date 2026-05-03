import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { protocols, assignments, sessions, clients } from "@/lib/db/schema";
import { eq, and, desc, avg, count, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TrendChart } from "@/components/TrendChart";
import { ProtocolParametersPanel } from "@/components/ProtocolParametersPanel";
import { AssignClientToProtocolModal } from "@/components/AssignClientToProtocolModal";

const DEVICE_LABELS: Record<string, string> = {
  mendi: "Mendi fNIRS",
  muse: "Muse EEG",
  simulator: "Simulator",
};

function fmtDuration(sec: number | null) {
  if (sec == null) return "—";
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function scoreColor(v: number) {
  if (v >= 70) return "text-emerald-600";
  if (v >= 40) return "text-amber-600";
  return "text-red-500";
}

export default async function ProtocolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [protocol] = await db
    .select()
    .from(protocols)
    .where(and(eq(protocols.id, id), eq(protocols.clinicId, clinicId)))
    .limit(1);

  if (!protocol) notFound();

  const [sessionList, assignedClients, avgRewardRow, totalCountRow, allClients] = await Promise.all([
    db
      .select({
        id: sessions.id,
        startedAt: sessions.startedAt,
        durationSeconds: sessions.durationSeconds,
        avgRewardScore: sessions.avgRewardScore,
        clientName: clients.name,
        clientId: clients.id,
        preFocus: sessions.preFocus,
        postFocus: sessions.postFocus,
      })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(sessions.protocolId, id))
      .orderBy(desc(sessions.startedAt))
      .limit(100),
    db
      .select({ clientName: clients.name, clientId: clients.id, assignedAt: assignments.assignedAt })
      .from(assignments)
      .innerJoin(clients, eq(assignments.clientId, clients.id))
      .where(and(eq(assignments.protocolId, id), eq(assignments.active, true)))
      .orderBy(clients.name),
    db
      .select({ avg: avg(sessions.avgRewardScore) })
      .from(sessions)
      .where(eq(sessions.protocolId, id)),
    db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.protocolId, id)),
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(and(eq(clients.clinicId, clinicId), eq(clients.active, true)))
      .orderBy(asc(clients.name)),
  ]);

  const overallAvg = avgRewardRow[0]?.avg ? Number(avgRewardRow[0].avg) : null;
  const totalSessions = Number(totalCountRow[0]?.count ?? 0);
  const mins = Math.round(protocol.durationSeconds / 60);

  const trendData = [...sessionList]
    .reverse()
    .slice(-30)
    .map((s) => ({ score: s.avgRewardScore ?? null, date: s.startedAt }));

  const assignedClientIds = new Set(assignedClients.map((c) => c.clientId));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/protocols"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{protocol.name}</h1>
            <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
              {DEVICE_LABELS[protocol.deviceType] ?? protocol.deviceType}
            </span>
            <span className="text-sm text-gray-400">{mins} min</span>
          </div>
          {protocol.description && (
            <p className="text-sm text-gray-500 mt-1">{protocol.description}</p>
          )}
        </div>
        <Link
          href={`/sessions/live?protocolId=${protocol.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          ▶ Start Session
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Sessions</p>
          <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Avg Reward Score</p>
          <p className={`text-3xl font-bold ${overallAvg != null ? scoreColor(overallAvg) : "text-gray-900"}`}>
            {overallAvg != null ? overallAvg.toFixed(1) : "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Assigned Clients</p>
          <p className="text-3xl font-bold text-gray-900">{assignedClients.length}</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session history */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Session History</h2>
            </div>
            {sessionList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">
                No sessions recorded with this protocol yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Client</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Duration</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Avg Reward</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessionList.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/clients/${s.clientId}`}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {s.clientName}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {new Date(s.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {fmtDuration(s.durationSeconds)}
                      </td>
                      <td className="px-5 py-3.5">
                        {s.avgRewardScore != null ? (
                          <span className={`font-semibold ${scoreColor(s.avgRewardScore)}`}>
                            {s.avgRewardScore.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/sessions/${s.id}`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Assigned clients panel */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Currently Assigned</h2>
              <AssignClientToProtocolModal
                protocolId={protocol.id}
                clients={allClients}
                assignedClientIds={assignedClientIds}
              />
            </div>
            {assignedClients.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No clients assigned.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {assignedClients.map(({ clientId, clientName, assignedAt }) => (
                  <li key={clientId} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                    <Link
                      href={`/clients/${clientId}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors block"
                    >
                      {clientName}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Assigned {new Date(assignedAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Training Parameters */}
      <div className="mt-6">
        <ProtocolParametersPanel
          protocolId={protocol.id}
          deviceType={protocol.deviceType}
          savedParams={protocol.parameters}
        />
      </div>
    </div>
  );
}
