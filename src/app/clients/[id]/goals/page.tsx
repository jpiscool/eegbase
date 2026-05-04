import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, goals } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { GoalsList } from "@/components/GoalsList";

export default async function GoalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  const [client] = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.clinicId, clinicId)))
    .limit(1);

  if (!client) notFound();

  const goalList = await db
    .select()
    .from(goals)
    .where(eq(goals.clientId, id))
    .orderBy(desc(goals.createdAt));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/clients/${id}`}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg" style={{ background: "var(--success-subtle)" }}>
            <Target size={18} style={{ color: "var(--success)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{client.name} — Treatment Goals</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Track milestones and clinical objectives</p>
          </div>
        </div>
      </div>

      <GoalsList clientId={id} initialGoals={goalList} />
    </div>
  );
}
