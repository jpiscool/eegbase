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

function scoreColor(v: number): string {
  if (v >= 70) return "var(--success)";
  if (v >= 40) return "var(--warning)";
  return "var(--danger)";
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
    <>
      <style>{`
        .protocol-back-link { color: var(--text-tertiary); }
        .protocol-back-link:hover { color: var(--text-primary); background: var(--surface-sunken); }
        .protocol-row:hover { background: var(--surface-sunken); }
        .protocol-client-row:hover { background: var(--surface-sunken); }
      `}</style>
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/protocols" className="p-1.5 rounded-lg transition-colors protocol-back-link">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{protocol.name}</h1>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
                {DEVICE_LABELS[protocol.deviceType] ?? protocol.deviceType}
              </span>
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{mins} min</span>
            </div>
            {protocol.description && (
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{protocol.description}</p>
            )}
          </div>
          <Link
            href={`/sessions/live?protocolId=${protocol.id}`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
          >
            ▶ Start Session
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Total Sessions</p>
            <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{totalSessions}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Avg Reward Score</p>
            <p className="text-3xl font-bold" style={{ color: overallAvg != null ? scoreColor(overallAvg) : "var(--text-primary)" }}>
              {overallAvg != null ? overallAvg.toFixed(1) : "—"}
            </p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Assigned Clients</p>
            <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{assignedClients.length}</p>
          </div>
        </div>

        {/* Trend chart */}
        {trendData.length > 1 && (
          <div className="rounded-xl p-6 mb-6" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Reward Score Trend · Last {trendData.length} sessions
            </h2>
            <TrendChart data={trendData} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session history */}
          <div className="lg:col-span-2">
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Session History</h2>
              </div>
              {sessionList.length === 0 ? (
                <p className="text-sm text-center py-12" style={{ color: "var(--text-tertiary)" }}>
                  No sessions recorded with this protocol yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead style={{ background: "var(--surface-sunken)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <tr>
                      <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Client</th>
                      <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Date</th>
                      <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Duration</th>
                      <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Avg Reward</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {sessionList.map((s) => (
                      <tr key={s.id} className="protocol-row transition-colors" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/clients/${s.clientId}`}
                            className="font-medium transition-colors"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {s.clientName}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>
                          {new Date(s.startedAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>
                          {fmtDuration(s.durationSeconds)}
                        </td>
                        <td className="px-5 py-3.5">
                          {s.avgRewardScore != null ? (
                            <span className="font-semibold" style={{ color: scoreColor(s.avgRewardScore) }}>
                              {s.avgRewardScore.toFixed(1)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--border-default)" }}>—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/sessions/${s.id}`}
                            className="text-xs font-medium hover:underline"
                            style={{ color: "var(--brand)" }}
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
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Currently Assigned</h2>
                <AssignClientToProtocolModal
                  protocolId={protocol.id}
                  clients={allClients}
                  assignedClientIds={assignedClientIds}
                />
              </div>
              {assignedClients.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: "var(--text-tertiary)" }}>
                  No clients assigned.
                </p>
              ) : (
                <ul>
                  {assignedClients.map(({ clientId, clientName, assignedAt }) => (
                    <li key={clientId} className="protocol-client-row px-5 py-3 transition-colors" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <Link
                        href={`/clients/${clientId}`}
                        className="text-sm font-medium block transition-colors"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {clientName}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
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
    </>
  );
}
