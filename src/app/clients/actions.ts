"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clients, assignments, messages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function addClient(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) throw new Error("No clinic associated with your account");

  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim() || null;
  const goals = (formData.get("goals") as string).trim() || null;
  const notes = (formData.get("notes") as string).trim() || null;
  const dobStr = (formData.get("dateOfBirth") as string).trim() || null;
  const dateOfBirth = dobStr ? new Date(dobStr) : null;

  if (!name) throw new Error("Client name is required");

  await db.insert(clients).values({
    clinicId,
    clinicianId: session.user.id!,
    name,
    email,
    goals,
    notes,
    ...(dateOfBirth ? { dateOfBirth } : {}),
  });

  redirect("/clients");
}

export async function assignProtocol(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clientId = formData.get("clientId") as string;
  const protocolId = formData.get("protocolId") as string;
  if (!clientId || !protocolId) throw new Error("Missing fields");

  // Deactivate any existing active assignment
  await db
    .update(assignments)
    .set({ active: false })
    .where(and(eq(assignments.clientId, clientId), eq(assignments.active, true)));

  // Insert new active assignment
  await db.insert(assignments).values({ clientId, protocolId });

  revalidatePath(`/clients/${clientId}`);
}

export async function updateClient(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim() || null;
  const notes = (formData.get("notes") as string).trim() || null;
  const goals = (formData.get("goals") as string).trim() || null;
  const dobStr = (formData.get("dateOfBirth") as string)?.trim() || null;
  const dateOfBirth = dobStr ? new Date(dobStr) : null;

  if (!name || !id) throw new Error("Missing required fields");

  // Ownership check
  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.clinicId, clinicId!)))
    .limit(1);

  if (!existing) throw new Error("Not found");

  await db.update(clients).set({ name, email, notes, goals, dateOfBirth }).where(eq(clients.id, id));

  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
}

export async function sendMessage(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clientId = formData.get("clientId") as string;
  const body = (formData.get("body") as string).trim();
  if (!clientId || !body) throw new Error("Missing fields");

  await db.insert(messages).values({
    clientId,
    clinicianId: session.user.id!,
    senderRole: "clinician",
    body,
  });

  revalidatePath(`/clients/${clientId}/messages`);
}

export async function generateCheckInToken(clientId: string): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.clinicId, clinicId!)))
    .limit(1);

  if (!existing) throw new Error("Not found");

  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  await db.update(clients).set({ checkInToken: token }).where(eq(clients.id, clientId));
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/checkins`);
  return token;
}

export async function revokeCheckInToken(clientId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.clinicId, clinicId!)))
    .limit(1);

  if (!existing) throw new Error("Not found");

  await db.update(clients).set({ checkInToken: null }).where(eq(clients.id, clientId));
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/checkins`);
}

export async function generateReportToken(clientId: string): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.clinicId, clinicId!)))
    .limit(1);

  if (!existing) throw new Error("Not found");

  // Generate a cryptographically random token
  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  await db.update(clients).set({ reportToken: token }).where(eq(clients.id, clientId));
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/report`);
  return token;
}

export async function revokeReportToken(clientId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.clinicId, clinicId!)))
    .limit(1);

  if (!existing) throw new Error("Not found");

  await db.update(clients).set({ reportToken: null }).where(eq(clients.id, clientId));
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/report`);
}

export async function setClientActive(clientId: string, active: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.clinicId, clinicId!)))
    .limit(1);

  if (!existing) throw new Error("Not found");

  await db.update(clients).set({ active }).where(eq(clients.id, clientId));

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}
