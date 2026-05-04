"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { treatmentPlans, clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveTreatmentPlan(clientId: string, data: {
  presentingConcerns: string;
  protocolId?: string;
  targetSessionCount?: number;
  sessionFrequency: string;
  outcomeMeasures: string[];
  decisionRules: string;
  goals: string;
  reviewDate?: string;
}) {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId ?? "";

  // Verify client belongs to clinic
  const [client] = await db.select({ id: clients.id }).from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.clinicId, clinicId))).limit(1);
  if (!client) throw new Error("Not found");

  // Upsert: deactivate old plans, insert new
  await db.update(treatmentPlans)
    .set({ status: "paused" })
    .where(and(eq(treatmentPlans.clientId, clientId)));

  await db.insert(treatmentPlans).values({
    clientId,
    protocolId: data.protocolId || null,
    presentingConcerns: data.presentingConcerns || null,
    targetSessionCount: data.targetSessionCount ?? null,
    sessionFrequency: data.sessionFrequency || null,
    outcomeMeasures: data.outcomeMeasures.filter(Boolean),
    decisionRules: data.decisionRules || null,
    goals: data.goals || null,
    reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
    status: "active",
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/treatment-plan`);
}
