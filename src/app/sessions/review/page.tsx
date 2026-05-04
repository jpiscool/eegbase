import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sessions, clients, soapNotes } from "@/lib/db/schema";
import { eq, desc, and, lt, inArray } from "drizzle-orm";
import Link from "next/link";
import { ReviewTable } from "./ReviewTable";

type SessionRow = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  avgRewardScore: number | null;
  deviceType: string;
  clientId: string;
  clientName: string;
};

export default async function SessionReviewQueuePage() {
  const authSession = await auth();
  if (!authSession?.user) {
    redirect("/login");
  }

  const clinicId = (authSession.user as { clinicId?: string })?.clinicId ?? "";

  // Sessions that ended more than 1 hour ago
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Query 1: All completed sessions for this clinic (ended > 1 hour ago)
  const allSessions: SessionRow[] = await db
    .select({
      id: sessions.id,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
      durationSeconds: sessions.durationSeconds,
      avgRewardScore: sessions.avgRewardScore,
      deviceType: sessions.deviceType,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(sessions)
    .innerJoin(clients, and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId)))
    .where(lt(sessions.endedAt, oneHourAgo))
    .orderBy(desc(sessions.startedAt))
    .limit(200);

  if (allSessions.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Session Review Queue
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Sessions awaiting clinical documentation
          </p>
        </div>
        <EmptyState />
      </div>
    );
  }

  // Query 2: All sessionIds that already have soap notes
  const sessionIds = allSessions.map((s) => s.id);
  const existingNotes =
    sessionIds.length > 0
      ? await db
          .select({ sessionId: soapNotes.sessionId })
          .from(soapNotes)
          .where(inArray(soapNotes.sessionId, sessionIds))
      : [];

  const reviewedIds = new Set(existingNotes.map((n) => n.sessionId));

  // Filter sessions that don't have soap notes
  const pending = allSessions.filter((s) => !reviewedIds.has(s.id)).slice(0, 50);

  const serialized = pending.map((s) => ({
    ...s,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              Session Review Queue
            </h1>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Sessions awaiting clinical documentation
            </p>
          </div>
          <Link
            href="/sessions"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium"
            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
          >
            ← All Sessions
          </Link>
        </div>
      </div>

      {pending.length === 0 ? (
        <EmptyState />
      ) : (
        <ReviewTable sessions={serialized} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "64px 32px",
      }}
    >
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        style={{ marginBottom: 20 }}
      >
        <circle cx="28" cy="28" r="28" fill="var(--surface-sunken)" />
        <path
          d="M20 28l6 6 10-12"
          stroke="var(--success)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h2
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        All caught up!
      </h2>
      <p className="text-sm" style={{ color: "var(--text-tertiary)", maxWidth: 320 }}>
        No sessions are pending review. All completed sessions have clinical documentation.
      </p>
      <Link
        href="/sessions"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
        style={{ background: "var(--brand)", color: "white" }}
      >
        View All Sessions
      </Link>
    </div>
  );
}
