import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sessions, clients, sessionDataPoints } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SupervisionView } from "./SupervisionView";

export default async function SupervisionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const authSession = await auth();
  if (!authSession?.user) {
    redirect("/login");
  }

  const clinicId = (authSession.user as { clinicId?: string })?.clinicId ?? "";

  // Load session with clinic ownership check via client
  const [row] = await db
    .select({
      sessionId: sessions.id,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
      durationSeconds: sessions.durationSeconds,
      avgRewardScore: sessions.avgRewardScore,
      deviceType: sessions.deviceType,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(sessions)
    .innerJoin(
      clients,
      and(eq(sessions.clientId, clients.id), eq(clients.clinicId, clinicId))
    )
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!row) notFound();

  // Load initial 200 data points (most recent)
  const initialDataPoints = await db
    .select({
      id: sessionDataPoints.id,
      timestampMs: sessionDataPoints.timestampMs,
      rewardScore: sessionDataPoints.rewardScore,
      oxyHbLeft: sessionDataPoints.oxyHbLeft,
      oxyHbRight: sessionDataPoints.oxyHbRight,
      theta: sessionDataPoints.theta,
      alpha: sessionDataPoints.alpha,
      heartRate: sessionDataPoints.heartRate,
    })
    .from(sessionDataPoints)
    .where(eq(sessionDataPoints.sessionId, sessionId))
    .orderBy(desc(sessionDataPoints.timestampMs))
    .limit(200);

  // Return in ascending order for chart rendering
  const sortedPoints = [...initialDataPoints].sort((a, b) => a.timestampMs - b.timestampMs);

  return (
    <SupervisionView
      sessionId={sessionId}
      clientName={row.clientName}
      startedAt={row.startedAt.toISOString()}
      deviceType={row.deviceType}
      initialDataPoints={sortedPoints}
    />
  );
}
