import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols, sessionDataPoints } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SessionNotesEditor } from "@/components/SessionNotesEditor";
import { SessionReplayChart } from "@/components/SessionReplayChart";
import { DeleteSessionButton } from "@/components/DeleteSessionButton";

function ScoreDelta({
  pre,
  post,
  invert = false,
}: {
  pre: number | null;
  post: number | null;
  invert?: boolean;
}) {
  if (pre == null || post == null) return <span className="text-gray-400">—</span>;
  const improved = invert ? post < pre : post > pre;
  const delta = post - pre;
  return (
    <span className="flex items-center gap-2">
      <span className="text-gray-500">{pre}</span>
      <span className="text-gray-300">→</span>
      <span className={`font-semibold ${improved ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-gray-700"}`}>
        {post}
      </span>
      {delta !== 0 && (
        <span className={`text-xs ${improved ? "text-emerald-500" : "text-red-400"}`}>
          ({delta > 0 ? "+" : ""}{delta})
        </span>
      )}
    </span>
  );
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  // Fetch session joined with client (for clinic ownership check) and protocol
  const [[row], dataPoints] = await Promise.all([
    db
      .select({
        session: sessions,
        clientName: clients.name,
        clientId: clients.id,
        protocolName: protocols.name,
      })
      .from(sessions)
      .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
      .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
      .where(eq(sessions.id, id))
      .limit(1),
    db
      .select({
        timestampMs: sessionDataPoints.timestampMs,
        rewardScore: sessionDataPoints.rewardScore,
      })
      .from(sessionDataPoints)
      .where(eq(sessionDataPoints.sessionId, id))
      .orderBy(asc(sessionDataPoints.timestampMs))
      .limit(500),
  ]);

  if (!row) notFound();

  const s = row.session;
  const durationMin = s.durationSeconds != null ? Math.floor(s.durationSeconds / 60) : null;
  const durationSec = s.durationSeconds != null ? s.durationSeconds % 60 : null;

  const metrics = [
    { label: "Focus", pre: s.preFocus, post: s.postFocus },
    { label: "Mood", pre: s.preMood, post: s.postMood },
    { label: "Anxiety", pre: s.preAnxiety, post: s.postAnxiety, invert: true },
    { label: "Energy", pre: s.preEnergy, post: s.postEnergy },
  ];

  // Build reward score chart data from raw data points
  const rewardTrend = dataPoints
    .filter((dp) => dp.rewardScore != null)
    .map((dp) => ({
      timestampMs: dp.timestampMs,
      rewardScore: dp.rewardScore as number,
    }));

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/sessions"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
          <p className="text-sm text-gray-500">
            <Link href={`/clients/${row.clientId}`} className="text-blue-600 hover:underline">
              {row.clientName}
            </Link>
            {" · "}
            {new Date(s.startedAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Device",
            value: <span className="capitalize">{s.deviceType}</span>,
          },
          {
            label: "Duration",
            value:
              durationMin != null
                ? `${durationMin}m ${durationSec}s`
                : "—",
          },
          {
            label: "Avg Reward",
            value:
              s.avgRewardScore != null ? (
                <span
                  className={
                    s.avgRewardScore >= 70
                      ? "text-emerald-600"
                      : s.avgRewardScore >= 40
                      ? "text-amber-600"
                      : "text-red-500"
                  }
                >
                  {s.avgRewardScore.toFixed(1)}%
                </span>
              ) : (
                "—"
              ),
          },
          {
            label: "Protocol",
            value: row.protocolName ?? <span className="text-gray-400">None</span>,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
            <p className="text-base font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Reward score replay chart */}
      {rewardTrend.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Reward Score · Session Replay ({rewardTrend.length} samples)
          </h2>
          <SessionReplayChart data={rewardTrend} />
        </div>
      )}

      {/* Pre / Post questionnaire */}
      {metrics.some((m) => m.pre != null || m.post != null) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pre / Post Session Ratings</h2>
          <div className="divide-y divide-gray-50">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-700 w-24">{m.label}</span>
                <div className="flex-1">
                  {m.pre != null && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gray-300 rounded-full"
                        style={{ width: `${(m.pre / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="ml-4 text-sm">
                  <ScoreDelta pre={m.pre} post={m.post} invert={m.invert} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Scale: 1 (low) → 10 (high). For anxiety, lower post-session score = improvement.</p>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Session Notes</h2>
        {s.postNotes && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium mb-1">Client Post-Session Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.postNotes}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 font-medium mb-2">Clinical Notes</p>
          <SessionNotesEditor sessionId={s.id} initialNotes={s.notes ?? null} />
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Session Timeline</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Started</p>
            <p className="text-gray-900">
              {new Date(s.startedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Ended</p>
            <p className="text-gray-900">
              {s.endedAt
                ? new Date(s.endedAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Session ID</p>
            <p className="text-gray-400 font-mono text-xs truncate">{s.id}</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Delete Session</p>
          <p className="text-xs text-gray-400 mt-0.5">Permanently removes this session and all its data.</p>
        </div>
        <DeleteSessionButton sessionId={s.id} clientId={row.clientId} />
      </div>
    </div>
  );
}
