import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions, protocols } from "@/lib/db/schema";
import { eq, and, gte, count, avg, desc } from "drizzle-orm";
import { Users, Activity, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [clientRows, sessionRows, protocolRows, avgScoreRows, recentSessions] = await Promise.all([
    db.select({ count: count() }).from(clients).where(eq(clients.clinicId, clinicId)),
    db
      .select({ count: count() })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(and(eq(clients.clinicId, clinicId), gte(sessions.startedAt, weekAgo))),
    db.select({ count: count() }).from(protocols).where(eq(protocols.clinicId, clinicId)),
    db
      .select({ avg: avg(sessions.avgRewardScore) })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId)),
    db
      .select({
        id: sessions.id,
        clientName: clients.name,
        deviceType: sessions.deviceType,
        startedAt: sessions.startedAt,
        durationSeconds: sessions.durationSeconds,
      })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId))
      .orderBy(desc(sessions.startedAt))
      .limit(5),
  ]);

  const stats = [
    { label: "Active Clients", value: String(clientRows[0]?.count ?? 0), icon: Users },
    { label: "Sessions This Week", value: String(sessionRows[0]?.count ?? 0), icon: Activity },
    { label: "Protocols", value: String(protocolRows[0]?.count ?? 0), icon: BookOpen },
    {
      label: "Avg. Reward Score",
      value: avgScoreRows[0]?.avg != null
        ? `${parseFloat(avgScoreRows[0].avg).toFixed(1)}%`
        : "—",
      icon: TrendingUp,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">
        Welcome back, {session?.user?.name ?? "Clinician"}.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
          >
            <div className="p-2 rounded-lg bg-blue-50">
              <Icon size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Sessions</h2>
          <Link href="/sessions" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-sm text-gray-400 py-10 text-center">
            No sessions yet.{" "}
            <Link href="/sessions/live" className="text-blue-600 hover:underline">
              Start a live session
            </Link>{" "}
            to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Device</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Duration</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-900">{s.clientName}</td>
                  <td className="px-6 py-3.5 text-gray-500 capitalize">{s.deviceType}</td>
                  <td className="px-6 py-3.5 text-gray-500">
                    {new Date(s.startedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500">
                    {s.durationSeconds != null
                      ? `${Math.floor(s.durationSeconds / 60)}m ${s.durationSeconds % 60}s`
                      : "—"}
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
    </div>
  );
}
