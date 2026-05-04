import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols, assignments } from "@/lib/db/schema";
import { eq, count, avg, countDistinct, asc } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

function scoreStyle(v: number | null): React.CSSProperties {
  if (v == null) return { color: "var(--text-tertiary)" };
  if (v >= 70) return { color: "var(--success)", fontWeight: 700 };
  if (v >= 40) return { color: "var(--warning)", fontWeight: 600 };
  return { color: "var(--danger)" };
}

export default async function ProtocolAnalyticsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  // Fetch all protocols with session counts and avg rewards
  const protocolStats = await db
    .select({
      protocolId: protocols.id,
      protocolName: protocols.name,
      deviceType: protocols.deviceType,
      durationSeconds: protocols.durationSeconds,
      sessionCount: count(sessions.id),
      uniqueClients: countDistinct(sessions.clientId),
      avgReward: avg(sessions.avgRewardScore),
      assignedCount: countDistinct(assignments.clientId),
    })
    .from(protocols)
    .leftJoin(sessions, eq(sessions.protocolId, protocols.id))
    .leftJoin(clients, eq(sessions.clientId, clients.id))
    .leftJoin(assignments, eq(assignments.protocolId, protocols.id))
    .where(eq(protocols.clinicId, clinicId))
    .groupBy(protocols.id)
    .orderBy(avg(sessions.avgRewardScore));

  // For each protocol, get all session reward scores ordered by date to compute trend
  const protocolSessions = await db
    .select({
      protocolId: sessions.protocolId,
      avgRewardScore: sessions.avgRewardScore,
      startedAt: sessions.startedAt,
    })
    .from(sessions)
    .innerJoin(clients, eq(sessions.clientId, clients.id))
    .where(eq(clients.clinicId, clinicId))
    .orderBy(asc(sessions.startedAt));

  // Group sessions by protocol and compute early vs late averages
  const sessionsByProtocol = new Map<string, number[]>();
  for (const s of protocolSessions) {
    if (!s.protocolId || s.avgRewardScore == null) continue;
    const arr = sessionsByProtocol.get(s.protocolId) ?? [];
    arr.push(s.avgRewardScore);
    sessionsByProtocol.set(s.protocolId, arr);
  }

  function trendDelta(protocolId: string): number | null {
    const scores = sessionsByProtocol.get(protocolId);
    if (!scores || scores.length < 4) return null;
    const early = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const late = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    return late - early;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/analytics" className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <BarChart3 size={22} style={{ color: "var(--brand)" }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Protocol Effectiveness</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Cross-client performance analysis across all protocols</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <table className="w-full text-sm">
          <thead className="border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
            <tr>
              {["Protocol", "Device", "Sessions", "Clients", "Assigned", "Avg Reward", "Trend (first 3 → last 3)"].map((h, i) => (
                <th
                  key={h}
                  className={`${i >= 2 ? "text-right" : "text-left"} px-6 py-3 font-medium`}
                  style={{ color: "var(--text-secondary)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {protocolStats.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>No protocols yet.</td></tr>
            ) : (
              protocolStats.map((p) => {
                const avgR = p.avgReward != null ? Number(p.avgReward) : null;
                const delta = trendDelta(p.protocolId);
                const sessCount = Number(p.sessionCount);
                return (
                  <tr key={p.protocolId}>
                    <td className="px-6 py-4">
                      <Link href={`/protocols/${p.protocolId}`} className="font-semibold hover:underline transition-colors" style={{ color: "var(--text-primary)" }}>
                        {p.protocolName}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{Math.round((p.durationSeconds ?? 1200) / 60)} min session</p>
                    </td>
                    <td className="px-6 py-4 text-xs capitalize" style={{ color: "var(--text-secondary)" }}>{p.deviceType}</td>
                    <td className="px-6 py-4 text-right font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>{sessCount}</td>
                    <td className="px-6 py-4 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>{Number(p.uniqueClients)}</td>
                    <td className="px-6 py-4 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>{Number(p.assignedCount)}</td>
                    <td className="px-6 py-4 text-right tabular-nums" style={scoreStyle(avgR)}>
                      {avgR != null ? avgR.toFixed(1) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {delta == null ? (
                        <span className="text-xs" style={{ color: "var(--border-default)" }}>Need ≥4 sessions</span>
                      ) : (
                        <span
                          className="text-sm font-semibold"
                          style={{ color: delta > 0 ? "var(--success)" : delta < 0 ? "var(--danger)" : "var(--text-tertiary)" }}
                        >
                          {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>
        Trend = avg of last 3 sessions minus avg of first 3 sessions (positive = improving). Requires ≥4 sessions per protocol.
      </p>
    </div>
  );
}
