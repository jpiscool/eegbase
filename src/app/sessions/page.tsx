import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sessions, clients, protocols } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Play, Download } from "lucide-react";
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

      <SessionsTable sessions={sessionList} />
    </div>
  );
}
