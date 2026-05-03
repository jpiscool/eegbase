import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Play, Download } from "lucide-react";

function fmtDuration(sec: number | null) {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default async function SessionsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const sessionList = await db
    .select({
      id: sessions.id,
      startedAt: sessions.startedAt,
      durationSeconds: sessions.durationSeconds,
      avgRewardScore: sessions.avgRewardScore,
      deviceType: sessions.deviceType,
      clientName: clients.name,
      clientId: clients.id,
      protocolName: protocols.name,
      preFocus: sessions.preFocus,
      postFocus: sessions.postFocus,
    })
    .from(sessions)
    .innerJoin(clients, eq(sessions.clientId, clients.id))
    .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
    .where(eq(clients.clinicId, clinicId))
    .orderBy(desc(sessions.startedAt))
    .limit(200);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sessions</h1>
          <p className="text-sm text-gray-500">
            {sessionList.length} session{sessionList.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sessionList.length > 0 && (
            <a
              href="/api/sessions/export"
              download
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={15} />
              Export CSV
            </a>
          )}
          <Link
            href="/sessions/live"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play size={15} />
            Start Live Session
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Client</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Protocol</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Duration</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Avg Reward</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Focus Δ</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessionList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                  No sessions recorded yet.{" "}
                  <Link href="/sessions/live" className="text-blue-600 hover:underline">
                    Start a live session
                  </Link>{" "}
                  to begin.
                </td>
              </tr>
            ) : (
              sessionList.map((s) => (
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
                    {s.protocolName ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(s.startedAt).toLocaleDateString()}{" "}
                    <span className="text-gray-400 text-xs">
                      {new Date(s.startedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {fmtDuration(s.durationSeconds)}
                  </td>
                  <td className="px-5 py-3.5">
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
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {s.preFocus != null && s.postFocus != null ? (
                      <span>
                        {s.preFocus} →{" "}
                        <span
                          className={
                            s.postFocus > s.preFocus
                              ? "text-emerald-600 font-medium"
                              : s.postFocus < s.preFocus
                              ? "text-red-500 font-medium"
                              : "text-gray-500"
                          }
                        >
                          {s.postFocus}
                        </span>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
