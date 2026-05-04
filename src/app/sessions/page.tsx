import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols, sessionDataPoints } from "@/lib/db/schema";
import { eq, desc, inArray, and, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { Play, Download, Upload } from "lucide-react";
import { SessionsTable } from "@/components/SessionsTable";

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
      tags: sessions.tags,
    })
    .from(sessions)
    .innerJoin(clients, eq(sessions.clientId, clients.id))
    .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
    .where(eq(clients.clinicId, clinicId))
    .orderBy(desc(sessions.startedAt))
    .limit(200);

  // Fetch downsampled reward scores for sparklines (1 point per 90s bucket)
  const sparklineMap = new Map<string, number[]>();
  if (sessionList.length > 0) {
    const ids = sessionList.map((s) => s.id);
    const rows = await db
      .select({
        sessionId: sessionDataPoints.sessionId,
        bucket: sql<number>`floor(${sessionDataPoints.timestampMs} / 90000)`.as("bucket"),
        avg: sql<number>`avg(${sessionDataPoints.rewardScore})`.as("avg"),
      })
      .from(sessionDataPoints)
      .where(
        and(
          inArray(sessionDataPoints.sessionId, ids),
          isNotNull(sessionDataPoints.rewardScore)
        )
      )
      .groupBy(sessionDataPoints.sessionId, sql`floor(${sessionDataPoints.timestampMs} / 90000)`)
      .orderBy(sessionDataPoints.sessionId, sql`floor(${sessionDataPoints.timestampMs} / 90000)`);

    for (const row of rows) {
      const arr = sparklineMap.get(row.sessionId) ?? [];
      arr.push(Number(row.avg));
      sparklineMap.set(row.sessionId, arr);
    }
  }

  const sparklines = Object.fromEntries(
    sessionList.map((s) => [s.id, sparklineMap.get(s.id) ?? []])
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Sessions</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {sessionList.length} session{sessionList.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sessionList.length > 0 && (
            <a
              href="/api/sessions/export"
              download
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
              style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
            >
              <Download size={15} />
              Export CSV
            </a>
          )}
          <Link
            href="/sessions/import"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
          >
            <Upload size={15} />
            Import CSV
          </Link>
          <Link
            href="/sessions/live"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
          >
            <Play size={15} />
            Start Live Session
          </Link>
        </div>
      </div>

      <SessionsTable sessions={sessionList} sparklines={sparklines} />
    </div>
  );
}
