import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, sessions } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { AddClientModal } from "@/components/AddClientModal";
import Link from "next/link";

export default async function ClientsPage() {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  // Fetch clients with session counts in one query
  const clientList = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      goals: clients.goals,
      notes: clients.notes,
      active: clients.active,
      createdAt: clients.createdAt,
      sessionCount: count(sessions.id),
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Goals</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Sessions</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Added</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                  No clients yet. Click &quot;Add Client&quot; to get started.
                </td>
              </tr>
            ) : (
              clientList.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    <Link href={`/clients/${client.id}`} className="hover:text-blue-600 transition-colors">
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    {client.goals ? (
                      <span className="truncate block text-sm text-gray-600">{client.goals}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {client.sessionCount} session{client.sessionCount !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{client.email ?? "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {client.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
