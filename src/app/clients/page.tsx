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
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Clients</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {clientList.length} client{clientList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AddClientModal />
      </div>

      <ClientList clients={clientList} />
    </div>
  );
}
