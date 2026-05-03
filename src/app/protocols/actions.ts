"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { protocols } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function createProtocol(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) throw new Error("No clinic");

  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  const deviceType = (formData.get("deviceType") as string) || "mendi";
  const minutes = Number(formData.get("durationMinutes")) || 20;

  if (!name) throw new Error("Protocol name is required");

  await db.insert(protocols).values({
    clinicId,
    name,
    description,
    deviceType,
    durationSeconds: minutes * 60,
  });

  revalidatePath("/protocols");
}

export async function updateProtocol(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) throw new Error("No clinic");

  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  const deviceType = (formData.get("deviceType") as string) || "mendi";
  const minutes = Number(formData.get("durationMinutes")) || 20;

  if (!name) throw new Error("Protocol name is required");

  await db
    .update(protocols)
    .set({ name, description, deviceType, durationSeconds: minutes * 60 })
    .where(and(eq(protocols.id, id), eq(protocols.clinicId, clinicId)));

  revalidatePath("/protocols");
}

export async function deleteProtocol(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) throw new Error("No clinic");

  await db
    .delete(protocols)
    .where(and(eq(protocols.id, id), eq(protocols.clinicId, clinicId)));

  revalidatePath("/protocols");
}
