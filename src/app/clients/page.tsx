import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions } from "@/lib/db/schema";
import { eq, count, avg, max } from "drizzle-orm";
import { AddClientModal } from "@/components/AddClientModal";
import { ClientList } from "@/components/ClientList";

export default async function ClientsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  // One simple query — joins to count sessions and grab last-session timestamp.
  // No risk-trend computation; the new list layout doesn't surface it.
  const clientList = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      goals: clients.goals,
      active: clients.active,
      sessionCount: count(sessions.id),
      avgRewardScore: avg(sessions.avgRewardScore),
      lastSessionAt: max(sessions.startedAt),
    })
    .from(clients)
    .leftJoin(sessions, eq(sessions.clientId, clients.id))
    .where(eq(clients.clinicId, clinicId))
    .groupBy(clients.id)
    .orderBy(clients.name);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "8px 4px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "#F1F5F9", margin: 0 }}>
            Clients
          </h1>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4, margin: 0 }}>
            {clientList.length} client{clientList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AddClientModal />
      </div>

      <ClientList clients={clientList} />
    </div>
  );
}
