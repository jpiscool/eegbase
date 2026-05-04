import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions } from "@/lib/db/schema";
import { eq, count, avg, max, inArray, isNotNull, desc } from "drizzle-orm";
import { AddClientModal } from "@/components/AddClientModal";
import { ClientsTable } from "@/components/ClientsTable";

export default async function ClientsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [clientList, recentScores] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        goals: clients.goals,
        active: clients.active,
        createdAt: clients.createdAt,
        sessionCount: count(sessions.id),
        avgRewardScore: avg(sessions.avgRewardScore),
        lastSessionAt: max(sessions.startedAt),
      })
      .from(clients)
      .leftJoin(sessions, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId))
      .groupBy(clients.id)
      .orderBy(clients.createdAt),
    // Recent 12 scored sessions per clinic client for trend calculation
    db
      .select({
        clientId: sessions.clientId,
        avgRewardScore: sessions.avgRewardScore,
        startedAt: sessions.startedAt,
      })
      .from(sessions)
      .innerJoin(clients, eq(sessions.clientId, clients.id))
      .where(eq(clients.clinicId, clinicId))
      .orderBy(desc(sessions.startedAt))
      .limit(200),
  ]);

  // Compute trend: recent 3 sessions avg vs prior 3
  const trendMap = new Map<string, "up" | "down" | "flat">();
  const byClient = new Map<string, number[]>();
  for (const s of recentScores) {
    if (s.avgRewardScore == null) continue;
    const arr = byClient.get(s.clientId) ?? [];
    arr.push(Number(s.avgRewardScore));
    byClient.set(s.clientId, arr);
  }
  for (const [clientId, scores] of byClient.entries()) {
    if (scores.length < 4) continue;
    const recent = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const prior = scores.slice(3, 6).reduce((a, b) => a + b, 0) / Math.min(3, scores.slice(3, 6).length);
    const delta = recent - prior;
    trendMap.set(clientId, Math.abs(delta) < 2 ? "flat" : delta > 0 ? "up" : "down");
  }

  const clientsWithTrend = clientList.map((c) => ({
    ...c,
    trend: trendMap.get(c.id) ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Clients</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {clientList.length} client{clientList.length !== 1 ? "s" : ""} in your roster
          </p>
        </div>
        <AddClientModal />
      </div>

      <ClientsTable clients={clientsWithTrend} />
    </div>
  );
}
