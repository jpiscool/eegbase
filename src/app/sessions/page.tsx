import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Play } from "lucide-react";
import { SessionList } from "@/components/SessionList";

export default async function SessionsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  // One query — no per-row sparkline downsampling. The detail page renders the
  // per-session chart, so the list doesn't need to fetch 90s buckets ahead of time.
  const sessionList = await db
    .select({
      id: sessions.id,
      startedAt: sessions.startedAt,
      durationSeconds: sessions.durationSeconds,
      avgRewardScore: sessions.avgRewardScore,
      clientName: clients.name,
      clientId: clients.id,
      protocolName: protocols.name,
    })
    .from(sessions)
    .innerJoin(clients, eq(sessions.clientId, clients.id))
    .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
    .where(eq(clients.clinicId, clinicId))
    .orderBy(desc(sessions.startedAt))
    .limit(200);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Sessions</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {sessionList.length} session{sessionList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/sessions/live"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Play size={15} />
          Start session
        </Link>
      </div>

      <SessionList sessions={sessionList} />
    </div>
  );
}
