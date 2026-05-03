"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { protocols } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const STARTER_TEMPLATES = [
  {
    name: "Prefrontal Uptraining (Focus)",
    description:
      "Increases beta/gamma activity in the prefrontal cortex. Improves sustained attention, working memory, and executive function. Recommended for ADHD and cognitive enhancement goals.",
    deviceType: "mendi",
    durationSeconds: 20 * 60,
  },
  {
    name: "Alpha/Theta Deep Relaxation",
    description:
      "Promotes alpha and theta brainwave states associated with relaxation, creativity, and emotional regulation. Effective for anxiety reduction and trauma processing.",
    deviceType: "mendi",
    durationSeconds: 20 * 60,
  },
  {
    name: "SMR Training (Calm Focus)",
    description:
      "Sensorimotor rhythm (12–15 Hz) uptraining for calm, alert focus. Reduces impulsivity and supports sleep quality. Suitable for sleep disorders and attention difficulties.",
    deviceType: "mendi",
    durationSeconds: 15 * 60,
  },
  {
    name: "Anxiety Reduction Protocol",
    description:
      "Targets high-beta downtraining combined with alpha uptraining to reduce physiological arousal and rumination. Supports GAD and panic disorder management.",
    deviceType: "mendi",
    durationSeconds: 25 * 60,
  },
  {
    name: "Simulator — Demo Session",
    description:
      "Uses the built-in signal simulator. Ideal for demonstrations, onboarding, and testing the platform without a physical device.",
    deviceType: "simulator",
    durationSeconds: 5 * 60,
  },
] as const;

export async function seedProtocolTemplates() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) throw new Error("No clinic");

  await db.insert(protocols).values(
    STARTER_TEMPLATES.map((t) => ({ clinicId, ...t }))
  );

  revalidatePath("/protocols");
}

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

export async function updateProtocolParameters(id: string, params: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const clinicId = (session.user as { clinicId?: string }).clinicId;
  if (!clinicId) throw new Error("No clinic");

  await db
    .update(protocols)
    .set({ parameters: params })
    .where(and(eq(protocols.id, id), eq(protocols.clinicId, clinicId)));

  revalidatePath(`/protocols/${id}`);
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
