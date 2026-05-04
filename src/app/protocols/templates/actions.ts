"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { protocols } from "@/lib/db/schema";
import { PROTOCOL_TEMPLATES } from "@/lib/protocol-templates";

export async function importProtocolTemplate(templateId: string): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const clinicId = (session.user as { clinicId?: string }).clinicId!;

  const template = PROTOCOL_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error("Template not found");

  const [row] = await db
    .insert(protocols)
    .values({
      clinicId,
      name: template.name,
      description: template.description,
      deviceType: template.deviceType === "both" ? "eeg" : template.deviceType,
      durationSeconds: template.sessionDurationMinutes * 60,
    })
    .returning({ id: protocols.id });

  revalidatePath("/protocols");
  return row.id;
}
