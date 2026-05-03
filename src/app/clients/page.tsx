import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions } from "@/lib/db/schema";
import { eq, count, avg, max } from "drizzle-orm";
import { AddClientModal } from "@/components/AddClientModal";
import { ClientsTable } from "@/components/ClientsTable";

export default async function ClientsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const clientList = await db
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
    .orderBy(clients.createdAt);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Clients</h1>
          <p className="text-sm text-gray-500">
            {clientList.length} client{clientList.length !== 1 ? "s" : ""} in your roster
          </p>
        </div>
        <AddClientModal />
      </div>

      <ClientsTable clients={clientList} />
    </div>
  );
}
