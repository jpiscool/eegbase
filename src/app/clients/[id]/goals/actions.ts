"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { goals, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function verifyClientOwnership(clientId: string, clinicId: string) {
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.clinicId, clinicId)))
    .limit(1);
  if (!client) throw new Error("Client not found");
}

export async function createGoal(data: {
  clientId: string;
  title: string;
  description?: string;
  targetDate?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const clinicId = (session.user as { clinicId?: string }).clinicId ?? "";
  await verifyClientOwnership(data.clientId, clinicId);

  await db.insert(goals).values({
    clientId: data.clientId,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    targetDate: data.targetDate ? new Date(data.targetDate) : null,
    status: "active",
  });

  revalidatePath(`/clients/${data.clientId}/goals`);
  revalidatePath(`/clients/${data.clientId}`);
}

export async function updateGoalStatus(
  goalId: string,
  clientId: string,
  status: "active" | "achieved" | "paused" | "cancelled"
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const clinicId = (session.user as { clinicId?: string }).clinicId ?? "";
  await verifyClientOwnership(clientId, clinicId);

  await db
    .update(goals)
    .set({
      status,
      completedAt: status === "achieved" ? new Date() : null,
    })
    .where(and(eq(goals.id, goalId), eq(goals.clientId, clientId)));

  revalidatePath(`/clients/${clientId}/goals`);
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteGoal(goalId: string, clientId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const clinicId = (session.user as { clinicId?: string }).clinicId ?? "";
  await verifyClientOwnership(clientId, clinicId);

  await db
    .delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.clientId, clientId)));

  revalidatePath(`/clients/${clientId}/goals`);
  revalidatePath(`/clients/${clientId}`);
}
